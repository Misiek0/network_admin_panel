from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import engine
from database import get_db
import models
import schemas
import crud

# Look at all classes in models.py and create tables if they don't exist
models.Base.metadata.create_all(bind=engine)
app = FastAPI(
    title="Network Admin Panel API",
    description="API for LAN management and device monitoring.",
    version="1.0.0"
)


# Dictionary Endpoints (for dropdowns in frontend)
@app.get("/locations/", response_model=List[schemas.Location], tags=["Dictionaries"])
def read_locations(db: Session = Depends(get_db)):
    """Retrieve a list of available locations (for dropdown menus)."""
    return crud.get_locations(db)


@app.get("/device-types/", response_model=List[schemas.DeviceType], tags=["Dictionaries"])
def read_device_types(db: Session = Depends(get_db)):
    """Retrieve a list of device types (for dropdown menus)."""
    return crud.get_device_types(db)
