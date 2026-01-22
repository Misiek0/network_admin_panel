from pydantic import BaseModel
from ipaddress import IPv4Address
from typing import List, Optional
from datetime import datetime


class LocationBase(BaseModel):
    name: str


class Location(LocationBase):
    id: int

    class Config:
        from_attributes = True


class DeviceTypeBase(BaseModel):
    name: str
    icon_name: Optional[str] = None


class DeviceType(DeviceTypeBase):
    id: int

    class Config:
        from_attributes = True


class ScanResultBase(BaseModel):
    status: bool
    response_time_ms: Optional[int] = None
    log_message: Optional[str] = None


class ScanResult(ScanResultBase):
    id: int
    timestamp: datetime
    device_id: int

    class Config:
        from_attributes = True


class DeviceCreate(BaseModel):
    name: str
    ip_address: IPv4Address
    mac_address: Optional[str] = None
    location_id: int
    device_type_id: int


class Device(BaseModel):
    id: int
    name: str
    ip_address: IPv4Address
    mac_address: Optional[str] = None
    location_id: int
    device_type_id: int

    location: Optional[Location] = None
    device_type: Optional[DeviceType] = None

    scan_results: List[ScanResult] = []

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    email: str
    role: str = "user"
    is_active: Optional[bool] = True


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
