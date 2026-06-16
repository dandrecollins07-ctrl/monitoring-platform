from fastapi import FastAPI
import psycopg2
from passlib.context import CryptContext
from jose import jwt
import yaml
import bcrypt; bcrypt.__about__ = bcrypt

#Three functions: password_hashing, password_verification, token_auth

def load_config(path="config.yaml"):
    with open(path, "r") as f:
        return yaml.safe_load(f)

config = load_config()
#Set up the CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def password_hashing(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def password_verification(password, hashed_password):
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def token_auth(user, role):
    secret = config["secret_key"]
    auth = config["algorithm"]
    user_dict = {"sub": user, "role": role}
    return jwt.encode(user_dict, secret, auth)
