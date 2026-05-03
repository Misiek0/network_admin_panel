from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
import ipaddress
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


# Host discovery endpoints
@app.get("/discovery-networks/", response_model=List[schemas.DiscoveryNetwork], tags=["Discovery"])
def read_discovery_networks(db: Session = Depends(get_db)):
    networks = crud.get_discovery_networks(db)
    return [
        schemas.DiscoveryNetwork(
            id=network.id,
            name=network.name,
            cidr=network.cidr,
            last_discovery=network.last_discovery,
            new_hosts_count=crud.count_pending_discovered_hosts(db, network.id),
        )
        for network in networks
    ]


@app.post(
    "/discovery-networks/",
    response_model=schemas.DiscoveryNetwork,
    status_code=status.HTTP_201_CREATED,
    tags=["Discovery"],
)
def create_discovery_network(
    network: schemas.DiscoveryNetworkCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    name = network.name.strip()
    cidr = network.cidr.strip()

    if not name:
        raise HTTPException(status_code=400, detail="Network name cannot be empty.")

    try:
        ipaddress.ip_network(cidr, strict=False)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid network address. Use CIDR format x.x.x.x/x.")

    if crud.get_discovery_network_by_name(db, name):
        raise HTTPException(status_code=400, detail="A discovery network with this name already exists.")

    if crud.get_discovery_network_by_cidr(db, cidr):
        raise HTTPException(status_code=400, detail="This network address is already configured.")

    created = crud.create_discovery_network(db, schemas.DiscoveryNetworkCreate(name=name, cidr=cidr))
    return schemas.DiscoveryNetwork(
        id=created.id,
        name=created.name,
        cidr=created.cidr,
        last_discovery=created.last_discovery,
        new_hosts_count=0,
    )


@app.put("/discovery-networks/{network_id}", response_model=schemas.DiscoveryNetwork, tags=["Discovery"])
def update_discovery_network(
    network_id: int,
    network: schemas.DiscoveryNetworkCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    db_network = crud.get_discovery_network(db, network_id)
    if db_network is None:
        raise HTTPException(status_code=404, detail="Discovery network not found")

    name = network.name.strip()
    cidr = network.cidr.strip()

    if not name:
        raise HTTPException(status_code=400, detail="Network name cannot be empty.")

    try:
        ipaddress.ip_network(cidr, strict=False)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid network address. Use CIDR format x.x.x.x/x.")

    existing_name = crud.get_discovery_network_by_name(db, name)
    if existing_name and existing_name.id != network_id:
        raise HTTPException(status_code=400, detail="A discovery network with this name already exists.")

    existing_cidr = crud.get_discovery_network_by_cidr(db, cidr)
    if existing_cidr and existing_cidr.id != network_id:
        raise HTTPException(status_code=400, detail="This network address is already configured.")

    updated = crud.update_discovery_network(db, network_id, schemas.DiscoveryNetworkCreate(name=name, cidr=cidr))
    return schemas.DiscoveryNetwork(
        id=updated.id,
        name=updated.name,
        cidr=updated.cidr,
        last_discovery=updated.last_discovery,
        new_hosts_count=crud.count_pending_discovered_hosts(db, updated.id),
    )


@app.delete("/discovery-networks/{network_id}", tags=["Discovery"])
def delete_discovery_network(
    network_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete discovery networks.",
        )
    deleted = crud.delete_discovery_network(db, network_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Discovery network not found")
    return {"message": "Discovery network deleted successfully"}


@app.get("/discovered-hosts/pending", response_model=List[schemas.DiscoveredHost], tags=["Discovery"])
def read_pending_discovered_hosts(db: Session = Depends(get_db)):
    return crud.get_pending_discovered_hosts(db)


@app.post("/discovered-hosts/{host_id}/accept", response_model=schemas.Device, tags=["Discovery"])
def accept_discovered_host(
    host_id: int,
    payload: schemas.DiscoveredHostAccept,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    db_host = crud.get_discovered_host(db, host_id)
    if db_host is None:
        raise HTTPException(status_code=404, detail="Discovered host not found")
    if db_host.status != "pending":
        raise HTTPException(status_code=409, detail="This host has already been processed.")

    normalized_name = payload.name.strip()
    if not normalized_name:
        raise HTTPException(status_code=400, detail="Device name cannot be empty.")

    if crud.get_device_by_ip(db, db_host.ip_address):
        db_host.status = "added"
        db_host.proposed_name = normalized_name
        db.commit()
        raise HTTPException(status_code=409, detail="Host already exists in devices.")

    device_data = schemas.DeviceCreate(
        name=normalized_name,
        ip_address=db_host.ip_address,
        mac_address=None,
        location_id=payload.location_id,
        device_type_id=payload.device_type_id,
    )
    created_device = crud.create_device(db, device_data)
    db_host.status = "added"
    db_host.proposed_name = normalized_name
    db.commit()
    db.refresh(created_device)
    return created_device


@app.post("/discovered-hosts/{host_id}/skip", tags=["Discovery"])
def skip_discovered_host(
    host_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    db_host = crud.get_discovered_host(db, host_id)
    if db_host is None:
        raise HTTPException(status_code=404, detail="Discovered host not found")
    if db_host.status != "pending":
        raise HTTPException(status_code=409, detail="This host has already been processed.")

    db_host.status = "skipped"
    db.commit()
    return {"message": "Discovered host skipped"}


# Monitoring Endpoints (Logs)
@app.get("/scan-results/", response_model=List[schemas.ScanResultWithDevice], tags=["Monitoring"])
def read_scan_results(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """Retrieve network scan history with device details included."""
    return crud.get_scan_results(db, skip=skip, limit=limit)


@app.get("/logs/", response_model=List[schemas.LogEntry], tags=["Monitoring"])
def read_logs(
    skip: int = 0,
    limit: int = 50,
    event_type: str | None = None,
    db: Session = Depends(get_db),
):
    """
    Retrieve a unified log stream containing both monitoring scan results
    and host discovery events. Filter with `event_type=scan` or `event_type=discovery`.
    """
    if event_type not in (None, "scan", "discovery"):
        raise HTTPException(status_code=400, detail="event_type must be 'scan' or 'discovery'.")
    return crud.get_logs(db, skip=skip, limit=limit, event_type=event_type)