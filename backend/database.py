import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
POSTGRES_DB = os.getenv("POSTGRES_DB")
POSTGRES_PORT = os.getenv("POSTGRES_PORT")
DB_HOST = os.getenv("DB_HOST")

# connection string
SQLALCHEMY_DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{DB_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

# engine - manages all connections to database
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# SessionLocal is a "session factory". Each http request instantiate its own database session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base is a parent class that all database models(tables) will inherit from
Base = declarative_base()


# function provides database session for the scope of single request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
