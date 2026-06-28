import os
from dotenv import load_dotenv
load_dotenv()
import psycopg2
from passlib.context import CryptContext
from jose import jwt
import bcrypt; bcrypt.__about__ = bcrypt

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def password_hashing(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def password_verification(password, hashed_password):
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def token_auth(user, role):
    user_dict = {"sub": user, "role": role}
    return jwt.encode(user_dict, SECRET_KEY, ALGORITHM)