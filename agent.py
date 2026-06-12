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
    #Run the alert engine
    schedule.every(60).seconds.do(alert_engine, cur, conn)
    while True:
        schedule.run_pending()
        time.sleep(1)

    
alerted_urls = dict() #Dictionary used to prevent alert fatigue
def alert_engine(cur,conn):
    #Connect agent to SQL:
    config = load_config()
    urls = config["urls"]
    for entry in urls:
        #Get the last 5 response times from database
        cur.execute("""
            SELECT response_time_ms from metrics
            WHERE url = %s
            ORDER BY checked_at DESC 
            LIMIT 5 
        """, (entry["url"],))
        #Fetch all rows:
        all_rows = cur.fetchall()
        #Skip empty rows
        if len(all_rows) == 0:
            continue
        #Extract numbers from tuples:
        numbers = [row[0] for row in all_rows if row[0] is not None]
        total = sum(numbers)
        average = total / len(all_rows)
        #Checking for status code from database
        cur.execute("""
            SELECT status_code from metrics
            WHERE url = %s
            ORDER BY checked_at DESC
            LIMIT 1 
        """, (entry["url"],))
        one_row = cur.fetchone()
        status_code = one_row[0]
        #Issue check now
        if average > config["threshold_ms"] or status_code != 200:
            #Add to the discord webhook:
            if entry["url"] not in alerted_urls:
                requests.post(config["webhook_url"], json={"content": f"ALERT: {entry['url']} is down or slow -- {status_code} | avg response: {average} ms"})
                alerted_urls[entry["url"]] = True
        #If no problem detected pop out the dictionary:
        else:
            if entry["url"] in alerted_urls:
                alerted_urls.pop(entry["url"])
        spike_detection(cur, conn, entry["url"], config["webhook_url"])

#Spike detection
spiked_urls = dict()
def spike_detection(cur, conn, url, webhook_url):
    cur.execute("""
                SELECT COUNT(*)
                FROM metrics
                WHERE status_code = 404 AND url = %s
                AND checked_at >= NOW() - INTERVAL '5 minutes'""", (url,))
    one_row = cur.fetchone()
    spike_count = one_row[0]
    #Check for spike detection:
    if spike_count >= 10 and url not in spiked_urls:
        requests.post(webhook_url, json={"content": f"ALERT: {url} is currently having a 404 spike."})
        spiked_urls[url] = True
    elif spike_count < 10 and url in spiked_urls:
            spiked_urls.pop(url)

if __name__ == "__main__":
    run_agent()
    