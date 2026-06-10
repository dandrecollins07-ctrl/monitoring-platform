import re
import psycopg2
from datetime import datetime #Used to get the proper structure of timestamp
#Follow the structure of NASA dataset
conn = psycopg2.connect(
    dbname="monitoring",
    user="postgres",
    password="postgres", #update before deploying
    host="localhost",
    )
cur = conn.cursor()
cur.execute("""
            CREATE TABLE IF NOT EXISTS server_logs (
            host VARCHAR NOT NULL,
            time TIMESTAMP NOT NULL,
            method VARCHAR NOT NULL,
            endpoint VARCHAR NOT NULL,
            http_version VARCHAR NOT NULL,
            reply_code INT NULL,
            byte INT NULL)
            """)
conn.commit()


with open("access.log", "r", encoding="utf-8", errors="ignore") as file:
    for line in file:
        match = re.match(r'(\S+) \S+ \S+ \[(.+)\] "(.+)" (\d+) (\d+)', line)
        if match:
            host = match.group(1)
            timestamp = datetime.strptime(match.group(2), "%d/%b/%Y:%H:%M:%S %z")
            request = match.group(3)
            reply_code = int(match.group(4))
            byte = int(match.group(5)) if match.group(5) != '-' else None
            if len(request.split()) != 3:
                continue
            method, endpoint, http_version = request.split()
            cur.execute("INSERT INTO server_logs VALUES (%s, %s, %s, %s, %s, %s, %s)", (host, timestamp, method, endpoint, http_version, reply_code, byte))
            
    conn.commit() #Save all inserts into the database
    print("Done") #Make sure it actually runs