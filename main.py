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


app = FastAPI()
from fastapi.middleware.cors import CORSMiddleware

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
#what is a route? A route is a function that runs when someone visits a URL


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
#We want the last 50 records, if no n is provided it will default to 50
def get_metrics( n: int = 50): #add back after test:  current_user: dict = Depends(get_current_user)
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
    #Can use cur.execute() twice despite 2 queries
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

    stored_hash = user[1]  # password column

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
