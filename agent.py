import yaml
import requests
import time
from datetime import datetime


def load_config(path="config.yaml"):
    with open(path, "r") as f:
        return yaml.safe_load(f)


def ping(name, url, expected_status):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    try:
        response = requests.get(url, timeout=10)
        status_code = response.status_code
        response_time_ms = round(response.elapsed.total_seconds() * 1000, 2)
        is_up = status_code == expected_status

        status_label = "UP" if is_up else "DEGRADED"
        print(f"[{timestamp}] {name} — {status_label} | {status_code} | {response_time_ms}ms")

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
        return {
            "name": name,
            "url": url,
            "timestamp": timestamp,
            "status_code": None,
            "response_time_ms": None,
            "error": "ConnectionError"
        }


def run_agent():
    config = load_config()
    urls = config["urls"]
    interval = urls[0]["interval"]  # using first entry's interval for now

    print(f"Agent started. Monitoring {len(urls)} URLs every {interval}s.\n")

    while True:
        for entry in urls:
            ping(entry["name"], entry["url"], entry["expected_status"])
        print("---")
        time.sleep(interval)


if __name__ == "__main__":
    run_agent()