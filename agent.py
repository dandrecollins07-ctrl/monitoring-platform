import yaml
import requests
import time
import psycopg2
import schedule
from datetime import datetime, timezone


def load_config(path="config.yaml"):
    with open(path, "r") as f:
        return yaml.safe_load(f)


def ping(name, url, expected_status, cur, conn):
    
    try:
        response = requests.get(url, timeout=10)
        status_code = response.status_code
        response_time_ms = round(response.elapsed.total_seconds() * 1000, 2)
        is_up = status_code == expected_status
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        status_label = "UP" if is_up else "DEGRADED"
        print(f"[{timestamp}] {name} — {status_label} | {status_code} | {response_time_ms}ms")
        cur.execute("""INSERT INTO metrics (name, url, status_code, response_time_ms, checked_at)
        VALUES (%s, %s, %s, %s, %s);""", (name, url, status_code, response_time_ms, timestamp))
        conn.commit()
        return {
            "name": name,
            "url": url,
            "timestamp": timestamp,
            "status_code": status_code,
            "response_time_ms": response_time_ms,
            "error": None
        }

    except requests.exceptions.Timeout:
        print(f"[{timestamp}] {name} — DOWN | Timed out after 10s")
        cur.execute("""INSERT INTO metrics (name, url, status_code, response_time_ms, checked_at)
        VALUES (%s, %s, %s, %s, %s);""", (name, url, None, None, timestamp))
        conn.commit()
        return {
            "name": name,
            "url": url,
            "timestamp": timestamp,
            "status_code": None,
            "response_time_ms": None,
            "error": "Timeout"
        }

    except requests.exceptions.ConnectionError:
        print(f"[{timestamp}] {name} — DOWN | Could not connect")
        cur.execute("""INSERT INTO metrics (name, url, status_code, response_time_ms, checked_at)
        VALUES (%s, %s, %s, %s, %s);""", (name, url, None, None, timestamp))
        conn.commit()
        return {
            "name": name,
            "url": url,
            "timestamp": timestamp,
            "status_code": None,
            "response_time_ms": None,
            "error": "ConnectionError"
        }
    except Exception as e:
        print(f"[{timestamp}] {name} — DOWN | Unexpected error: {e}")
        conn.rollback()
        return {
            "name": name,
            "url": url,
            "timestamp": timestamp,
            "status_code": None,
            "response_time_ms": None,
            "error": str(e)
        }


def get_urls_from_db(conn):
    cur = conn.cursor()
    cur.execute("SELECT name, url, expected_status, interval FROM urls")
    rows = cur.fetchall()
    return [{"name": r[0], "url": r[1], "expected_status": r[2], "interval": r[3]} for r in rows]


def run_agent():
    config = load_config()

    conn = psycopg2.connect(
        dbname=config["db_name"],
        user=config["db_user"],
        password=config["db_password"],
        host="db",
    )

    urls = get_urls_from_db(conn)
    print(f"Agent started. Monitoring {len(urls)} URLs.\n")

    cur = conn.cursor()
    for entry in urls:
        schedule.every(entry["interval"]).seconds.do(ping, entry["name"], entry["url"], entry["expected_status"], cur, conn)
    schedule.every(60).seconds.do(alert_engine, cur, conn)
    while True:
        schedule.run_pending()
        time.sleep(1)


alerted_urls = dict()
def alert_engine(cur, conn):
    config = load_config()
    urls = get_urls_from_db(conn)
    for entry in urls:
        cur.execute("""
            SELECT response_time_ms from metrics
            WHERE url = %s
            ORDER BY checked_at DESC 
            LIMIT 5 
        """, (entry["url"],))
        all_rows = cur.fetchall()
        if len(all_rows) == 0:
            continue
        numbers = [row[0] for row in all_rows if row[0] is not None]
        total = sum(numbers)
        average = total / len(all_rows)
        cur.execute("""
            SELECT status_code from metrics
            WHERE url = %s
            ORDER BY checked_at DESC
            LIMIT 1 
        """, (entry["url"],))
        one_row = cur.fetchone()
        status_code = one_row[0]
        if average > config["threshold_ms"] or status_code != 200:
            if entry["url"] not in alerted_urls:
                if status_code == 403:
                    message = f"ALERT: {entry['url']} is rejecting requests -- 403 Forbidden"
                elif status_code is None:
                    message = f"ALERT: {entry['url']} is down -- no response | avg response: {round(average, 2)} ms"
                else:
                    message = f"ALERT: {entry['url']} is down or slow -- {status_code} | avg response: {round(average, 2)} ms"
                requests.post(
                    config["webhook_url"],
                    json={"content": message}
                )
                cur.execute("""
                    INSERT INTO alerts
                    (url, status_code, avg_response_ms, message, triggered_at)
                    VALUES (%s, %s, %s, %s, NOW())
                """, (
                    entry["url"],
                    status_code,
                    average,
                    message
                ))
                conn.commit()
                alerted_urls[entry["url"]] = True
        else:
            if entry["url"] in alerted_urls:
                alerted_urls.pop(entry["url"])
        spike_detection(cur, conn, entry["url"], config["webhook_url"])


spiked_urls = dict()
def spike_detection(cur, conn, url, webhook_url):
    cur.execute("""
                SELECT COUNT(*)
                FROM metrics
                WHERE status_code = 404 AND url = %s
                AND checked_at >= NOW() - INTERVAL '5 minutes'""", (url,))
    one_row = cur.fetchone()
    spike_count = one_row[0]
    if spike_count >= 10 and url not in spiked_urls:
        message = f"ALERT: {url} is currently having a 404 spike."
        requests.post(
            webhook_url,
            json={"content": message}
        )
        cur.execute("""
            INSERT INTO alerts
            (url, status_code, avg_response_ms, message, triggered_at)
            VALUES (%s, %s, %s, %s, NOW())
        """, (
            url,
            404,
            None,
            message
        ))
        conn.commit()
        spiked_urls[url] = True
    elif spike_count < 10 and url in spiked_urls:
        spiked_urls.pop(url)

if __name__ == "__main__":
    run_agent()