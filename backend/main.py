from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
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
    version="1.3.0"
)

# CORS Section ( MiddleWare )
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# Device management Endpoints (Core CRUD)
@app.get("/devices/", response_model=List[schemas.Device], tags=["Devices"])
def read_devices(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Retrieve a list of all devices with pagination."""
    devices = crud.get_devices(db, skip=skip, limit=limit)
    return devices


@app.post("/devices/", response_model=schemas.Device, status_code=status.HTTP_201_CREATED, tags=["Devices"])
def create_device(device: schemas.DeviceCreate, db: Session = Depends(get_db)):
    """Add a new device to the database."""
    return crud.create_device(db, device=device)


@app.get("/devices/{device_id}", response_model=schemas.Device, tags=["Devices"])
def read_device(device_id: int, db: Session = Depends(get_db)):
    """Retrieve details of a single device by ID."""
    db_device = crud.get_device(db, device_id)
    if db_device is None:
        raise HTTPException(status_code=404, detail="Device not found")
    return db_device


@app.delete("/devices/{device_id}", tags=["Devices"])
def delete_device(device_id: int, db: Session = Depends(get_db)):
    """Remove a device from the database."""
    db_device = crud.delete_device(db, device_id)
    if db_device is None:
        raise HTTPException(status_code=404, detail="Device not found")
    return {"message": "Device deleted successfully"}


# Dictionary Endpoints (for dropdowns in frontend)
@app.get("/locations/", response_model=List[schemas.Location], tags=["Dictionaries"])
def read_locations(db: Session = Depends(get_db)):
    """Retrieve a list of available locations (for dropdown menus)."""
    return crud.get_locations(db)


@app.get("/device-types/", response_model=List[schemas.DeviceType], tags=["Dictionaries"])
def read_device_types(db: Session = Depends(get_db)):
    """Retrieve a list of device types (for dropdown menus)."""
    return crud.get_device_types(db)


# Monitoring Endpoints (Logs)
@app.get("/scan-results/", response_model=List[schemas.ScanResult], tags=["Monitoring"])
def read_scan_results(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """Retrieve network scan history (logs)."""
    return crud.get_scan_results(db, skip=skip, limit=limit)


# User management Endpoints (Auth)
@app.post("/users/", response_model=schemas.User, status_code=status.HTTP_201_CREATED, tags=["Users"])
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db, user)
