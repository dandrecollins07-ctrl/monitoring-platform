from fastapi import FastAPI
import psycopg2
from passlib.context import CryptContext
from jose import jwt
import yaml

#Three functions: password_hashing, password_verification, token_auth

def load_config(path="config.yaml"):
    with open(path, "r") as f:
        return yaml.safe_load(f)

config = load_config()
#Set up the CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def password_hashing(password):
    return pwd_context.hash(password)

def password_verification(password, hashed_password):
    return pwd_context.verify(password, hashed_password)

def token_auth(user, role):
    secret = config["secret_key"]
    auth = config["algorithm"]
    {"sub": user, "role": role}
    return 