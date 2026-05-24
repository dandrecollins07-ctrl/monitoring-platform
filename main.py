#need to import the fast API
from fastapi import FastAPI

app = FastAPI()

#I need to define a route:
#what is a route? A route is a function that runs when someone visits a URL

@app.get("/")
def first_test():
    return "Hello world"





