#need to import the fast API
from fastapi import FastAPI
import psycopg2
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError 
from auth import (
    password_verification,
    token_auth,
    load_config
)
from fastapi import Form
from pydantic import BaseModel
import yaml


app = FastAPI()
from fastapi.middleware.cors import CORSMiddleware
from psycopg2.extras import RealDictCursor
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


#load the config:
config = load_config()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

#I need to define a route:
#what is a route? A function that runs when someone visits a URL

#Connecting agent to SQL:
conn = psycopg2.connect(
    dbname="monitoring",
    user="postgres",
    password="postgres", #update before deploying
    host="localhost",
    )

def get_current_user(
    token: str = Depends(oauth2_scheme)
):
    try:
        payload = jwt.decode(
            token,
            config["secret_key"],
            algorithms=[config["algorithm"]]
        )

        username = payload.get("sub")
        role = payload.get("role")

        if username is None or role is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

        return {
            "username": username,
            "role": role
        }

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

#RBAC:
def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != 'admin':
        raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Admins only"
    )

@app.get("/")
def first_test():
    return "Hello world"

@app.get("/metrics")
#We want the last 50 records as a flat list for the table
def get_metrics(n: int = 50): #add back after test: current_user: dict = Depends(get_current_user)
    cur = conn.cursor()
    cur.execute("""
                SELECT * from metrics
                ORDER BY checked_at DESC
                LIMIT %s
                """,
                    (n,))
    all_rows = cur.fetchall()
    return all_rows

@app.get("/metrics/grouped")
#Returns metrics grouped by URL as a dictionary — used by the Chart.js line chart
def get_metrics_grouped(n: int = 50):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
                SELECT url, response_time_ms, checked_at FROM metrics
                ORDER BY checked_at DESC
                LIMIT %s
                """,
                    (n,))
    all_rows = cur.fetchall()
    metric_dict = dict()
    for row in all_rows:
        if row["url"] not in metric_dict:
            metric_dict[row["url"]] = []
        metric_dict[row["url"]].append({"response_time_ms": row["response_time_ms"], "checked_at": row["checked_at"]})
    return metric_dict

@app.get("/uptime")
def get_uptime(url: str): #add back after test: current_user: dict = Depends(get_current_user)
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
    cur.execute("""
                SELECT COUNT(*) from metrics
                WHERE url = %s AND checked_at >= NOW() - INTERVAL '24 hours' AND status_code = 200
                """,
                   (url,))
    #now get the number of pings
    number_of_pings = cur.fetchone()[0]
    return (number_of_pings / total) * 100

@app.get("/anomalies")
def anomaly_detection(current_user: dict = Depends(get_current_user), _: dict = Depends(require_admin)):
    cur = conn.cursor()
    cur.execute("""
        SELECT host, COUNT(DISTINCT endpoint)
        FROM server_logs
        WHERE time >= NOW() - INTERVAL '10 minutes'
        GROUP BY host
        HAVING COUNT(DISTINCT endpoint) > 50
    """)
    total = cur.fetchall()
    return total


#Admin panel:
class AdminPanel(BaseModel):
    name: str
    url: str
    expected_status: int
    interval: int

#Post request example:
@app.post("/urls")
def add_url(url_data: AdminPanel):
    url_name = url_data.name
    original_url = url_data.url
    expected_status = url_data.expected_status
    interval = url_data.interval
    config = load_config()
    urls = config["urls"]
    urls.append({
        "name": url_name,
        "url": original_url,
        "expected_status": expected_status,
        "interval": interval
    })
    #Read the YAML file
    with open("config.yaml", "w") as f:
        yaml.dump(config, f)
    return {"success": True}


#Delete request:
@app.delete("/urls")
def remove_url(url: str):
    config = load_config()
    config["urls"] = [entry for entry in config["urls"] if entry["url"] != url]
    with open("config.yaml", "w") as f:
        yaml.dump(config, f)
    return {"success": True}

#Get urls:
@app.get("/urls")
def get_url():
    config=load_config()
    return config["urls"]

#Login here:
@app.post("/login")
def login(
    username: str = Form(...),
    password: str = Form(...)
):
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT username, hashed_password, role
        FROM users
        WHERE username = %s
        """,
        (username,)
    )

    user = cursor.fetchone()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    stored_hash = user[1]

    if not password_verification(password, stored_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    token = token_auth(
        user[0],  # username
        user[2]   # role
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }

@app.get("/alerts")
def get_alerts():
    cur = conn.cursor(cursor_factory=RealDictCursor)
    conn.rollback()
    cur.execute("""
        SELECT
            id,
            url,
            status_code,
            avg_response_ms,
            message,
            triggered_at
        FROM alerts
        ORDER BY triggered_at DESC
    """)

    rows = cur.fetchall()
    return rows

#Get incidents:
@app.get("/incidents")
def get_incidents():
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT
            id,
            title,
            description,
            severity,
            status,
            created_at
        FROM incidents
        ORDER BY created_at DESC
    """)
    all_rows = cur.fetchall()
    return all_rows

#Post incidents:
class IncidentCreate(BaseModel):
    title: str
    description: str
    severity: str
    status: str

class IncidentUpdate(BaseModel):
    title: str
    description: str
    severity: str
    status: str


@app.post("/incidents")
def create_incident(incident: IncidentCreate):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        INSERT INTO incidents (
            title,
            description,
            severity,
            status
        )
        VALUES (%s, %s, %s, %s)
        RETURNING
            id,
            title,
            description,
            severity,
            status,
            created_at
    """, (
        incident.title,
        incident.description,
        incident.severity,
        incident.status
    ))
    new_row = cur.fetchone()
    conn.commit()
    return new_row

@app.patch("/incidents/{id}")
def update_incident(id: int, incident: IncidentUpdate):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        UPDATE incidents
        SET
            title = %s,
            description = %s,
            severity = %s,
            status = %s
        WHERE id = %s
        RETURNING
            id,
            title,
            description,
            severity,
            status,
            created_at
    """, (
        incident.title,
        incident.description,
        incident.severity,
        incident.status,
        id
    ))
    updated_row = cur.fetchone()
    conn.commit()
    return updated_row

@app.delete("/incidents/{id}")
def delete_incident(id: int):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        DELETE FROM incidents
        WHERE id = %s
        RETURNING
            id,
            title,
            description,
            severity,
            status,
            created_at
    """, (id,))
    deleted_row = cur.fetchone()
    conn.commit()
    return deleted_row