#need to import the fast API
from fastapi import FastAPI
import psycopg2

app = FastAPI()

#I need to define a route:
#what is a route? A route is a function that runs when someone visits a URL


#Connecting agent to SQL:
conn = psycopg2.connect(
    dbname="monitoring",
    user="postgres",
    password="postgres", #update before deploying
    host="localhost",
    )

@app.get("/")
def first_test():
    return "Hello world"

@app.get("/metrics")
#We want the last 50 records, if no n is provided it will default to 50
def get_metrics(n: int = 50): 
    #The goal of get metrics is to get the last n records
    cur = conn.cursor()
    cur.execute("""
                SELECT * from metrics
                ORDER BY checked_at DESC
                LIMIT %s
                """,
                    (n,))
    all_rows = cur.fetchall()
    return all_rows


@app.get("/uptime")
def get_uptime(url: str):
    #Need 2 queries, as we are using a percentage formula
    cur = conn.cursor()
    cur.execute("""
                SELECT COUNT(*) from metrics
                WHERE url = %s AND checked_at >= NOW() - INTERVAL '24 hours'
                """,
                    (url,))
    total = cur.fetchone()[0]
    if total == 0:
        return {"error": f"No data found for {url} in the last 24 hours"}
    #Can use cur.execute() twice despite 2 queries
    cur.execute("""
                SELECT COUNT(*) from metrics
                WHERE url = %s AND checked_at >= NOW() - INTERVAL '24 hours' AND status_code = 200
                """,
                   (url,))
    #now get the number of pings
    number_of_pings = cur.fetchone()[0]
    return (number_of_pings / total) * 100
