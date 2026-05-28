import yaml
import requests
import time
import psycopg2
import schedule
from datetime import datetime


def load_config(path="config.yaml"):
    with open(path, "r") as f:
        return yaml.safe_load(f)


def ping(name, url, expected_status, cur, conn):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    try:
        response = requests.get(url, timeout=10)
        status_code = response.status_code
        response_time_ms = round(response.elapsed.total_seconds() * 1000, 2)
        is_up = status_code == expected_status

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
    except Exception as e: #catch all function
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
    



def run_agent():
    config = load_config()
    urls = config["urls"]

    print(f"Agent started. Monitoring {len(urls)} URLs.\n")

    #Connecting agent to SQL:
    conn = psycopg2.connect(
        dbname="monitoring",
        user="postgres",
        password="postgres", #update before deploying
        host="localhost",
    )

    cur = conn.cursor()
    #running the daemon
    for entry in urls:
        schedule.every(entry["interval"]).seconds.do(ping, entry["name"], entry["url"], entry["expected_status"], cur, conn)
    while True:
        schedule.run_pending()
        time.sleep(1)


if __name__ == "__main__":
    run_agent()