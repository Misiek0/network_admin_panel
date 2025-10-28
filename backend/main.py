from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional

app = FastAPI(title="Network Admin Panel API")


class Device(BaseModel):
    id: int
    hostname: str
    ip: str
    status: Optional[str] = "unknown"


devices = [
    Device(id=1, hostname="router", ip="192.168.1.1", status="online"),
    Device(id=2, hostname="access-point", ip="192.168.1.2", status="online"),
    Device(id=3, hostname="NAS", ip="192.168.1.3", status="online")
]


@app.get("/")
def read_root():
    return {"message": "Network Admin Panel API is running"}


@app.get("/api/devices", response_model=List[Device])
def get_devices():
    return devices


@app.get("/api/devices/{device_id}", response_model=Device)
def get_device(device_id: int):
    if device_id < 0:
        raise HTTPException(status_code=400, detail="Device ID must be positive integer")
    for device in devices:
        if device.id == device_id:
            return device
    raise HTTPException(status_code=404, detail="Device not found")
