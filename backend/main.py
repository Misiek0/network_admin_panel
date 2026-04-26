from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from database import engine
from database import get_db
import models
import schemas
import crud
import auth

# Look at all classes in models.py and create tables if they don't exist
models.Base.metadata.create_all(bind=engine)
app = FastAPI(
    title="Network Admin Panel API",
    description="API for LAN management and device monitoring.",
    version="1.5.0"
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


# Auth endpoint (login)
@app.post("/token", tags=["Auth"])
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # check if user exists and password match
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate token JWT
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


# Users endpoint (register)
@app.post("/users/", response_model=schemas.User, status_code=status.HTTP_201_CREATED, tags=["Users"])
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db, user)


# Device management Endpoints (Core CRUD)
@app.get("/devices/", response_model=List[schemas.Device], tags=["Devices"])
def read_devices(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Retrieve a list of all devices with pagination."""
    devices = crud.get_devices(db, skip=skip, limit=limit)
    return devices


@app.post("/devices/", response_model=schemas.Device, status_code=status.HTTP_201_CREATED, tags=["Devices"])
def create_device(
    device: schemas.DeviceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Add a new device (Requires Login)."""
    # check if IP already exists
    if crud.get_device_by_ip(db, ip_address=str(device.ip_address)):
        raise HTTPException(status_code=400, detail=f"IP address {device.ip_address} is already in use.")

    # check if MAC exists (if MAC received)
    if device.mac_address:
        if crud.get_device_by_mac(db, mac_address=device.mac_address):
            raise HTTPException(status_code=400, detail=f"MAC address {device.mac_address} is already in use.")

    return crud.create_device(db, device=device)


@app.get("/devices/{device_id}", response_model=schemas.Device, tags=["Devices"])
def read_device(device_id: int, db: Session = Depends(get_db)):
    """Retrieve details of a single device by ID."""
    db_device = crud.get_device(db, device_id)
    if db_device is None:
        raise HTTPException(status_code=404, detail="Device not found")
    return db_device


@app.put("/devices/{device_id}", response_model=schemas.Device, tags=["Devices"])
def update_device(
    device_id: int,
    device: schemas.DeviceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # check if device exists
    db_device = crud.get_device(db, device_id)
    if db_device is None:
        raise HTTPException(status_code=404, detail="Device not found")

    # check IP (without ACTUAL device so it don't block)
    existing_ip = crud.get_device_by_ip(db, ip_address=str(device.ip_address))
    if existing_ip and existing_ip.id != device_id:
        raise HTTPException(status_code=400, detail=f"IP address {device.ip_address} duplicated.")

    # same for MAC
    if device.mac_address:
        existing_mac = crud.get_device_by_mac(db, mac_address=device.mac_address)
        if existing_mac and existing_mac.id != device_id:
            raise HTTPException(status_code=400, detail=f"MAC address {device.mac_address} duplicated.")

    return crud.update_device(db, device_id=device_id, device_update=device)


@app.delete("/devices/{device_id}", tags=["Devices"])
def delete_device(device_id: int, db: Session = Depends(get_db),current_user: models.User = Depends(auth.get_current_user)):
    """Remove a device from the database (Requires Admin Privileges)."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete devices."
        )
    db_device = crud.delete_device(db, device_id)
    if db_device is None:
        raise HTTPException(status_code=404, detail="Device not found")
    return {"message": "Device deleted successfully"}


# Dictionary Endpoints (for dropdowns in frontend)
@app.get("/locations/", response_model=List[schemas.LocationWithCount], tags=["Dictionaries"])
def read_locations(db: Session = Depends(get_db)):
    """Retrieve a list of available locations (for dropdown menus)."""
    locations = crud.get_locations(db)
    return [
        schemas.LocationWithCount(
            id=location.id,
            name=location.name,
            devices_count=crud.count_devices_for_location(db, location.id),
        )
        for location in locations
    ]


@app.post(
    "/locations/",
    response_model=schemas.Location,
    status_code=status.HTTP_201_CREATED,
    tags=["Dictionaries"],
)
def create_location(
    location: schemas.LocationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Add a new location (requires login)."""
    name = location.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Location name cannot be empty.")
    if crud.get_location_by_name(db, name=name):
        raise HTTPException(status_code=400, detail="A location with this name already exists.")
    loc = schemas.LocationCreate(name=name)
    return crud.create_location(db, loc)


@app.put("/locations/{location_id}", response_model=schemas.Location, tags=["Dictionaries"])
def update_location(
    location_id: int,
    location: schemas.LocationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Update a location name (requires login)."""
    db_location = crud.get_location(db, location_id)
    if db_location is None:
        raise HTTPException(status_code=404, detail="Location not found")

    name = location.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Location name cannot be empty.")

    existing = crud.get_location_by_name(db, name=name)
    if existing and existing.id != location_id:
        raise HTTPException(status_code=400, detail="A location with this name already exists.")

    loc = schemas.LocationCreate(name=name)
    return crud.update_location(db, location_id=location_id, location_update=loc)


@app.delete("/locations/{location_id}", tags=["Dictionaries"])
def delete_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Remove a location (admin only; blocked if any device uses it)."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete locations.",
        )
    if crud.count_devices_for_location(db, location_id) > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete location: one or more devices are still assigned to it.",
        )
    deleted = crud.delete_location(db, location_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Location not found")
    return {"message": "Location deleted successfully"}


@app.get("/device-types/", response_model=List[schemas.DeviceType], tags=["Dictionaries"])
def read_device_types(db: Session = Depends(get_db)):
    """Retrieve a list of device types (for dropdown menus)."""
    return crud.get_device_types(db)


# Monitoring Endpoints (Logs)
@app.get("/scan-results/", response_model=List[schemas.ScanResultWithDevice], tags=["Monitoring"])
def read_scan_results(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """Retrieve network scan history with device details included."""
    return crud.get_scan_results(db, skip=skip, limit=limit)