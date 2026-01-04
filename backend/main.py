from fastapi import FastAPI
from database import engine
import models

# Look at all classes in models.py and create tables if they don't exist
models.Base.metadata.create_all(bind=engine)
app = FastAPI()


@app.get("/")
def read_root():
    return {"message": "System is running and DB is connected!"}
