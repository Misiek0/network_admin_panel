from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")
    is_active = Column(Boolean, default=True)


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    ip_address = Column(String, unique=True, nullable=False)
    mac_address = Column(String, unique=True)

    # Foreign keys
    location_id = Column(Integer, ForeignKey("locations.id"))
    device_type_id = Column(Integer, ForeignKey("device_types.id"))

    # Relationships (Parents)
    location = relationship("Location", back_populates="devices")
    device_type = relationship("DeviceType", back_populates="devices")

    # Relationship (Children)
    scan_results = relationship("ScanResult", back_populates="device", cascade="all, delete")


class DeviceType(Base):
    __tablename__ = "device_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    icon_name = Column(String, nullable=True)

    # relationship: One Type -> Many Devices
    devices = relationship("Device", back_populates="device_type")


class ScanResult(Base):
    __tablename__ = "scan_results"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False)

    status = Column(Boolean, default=False)  # True = Online, False = Offline
    response_time_ms = Column(Integer, nullable=True)
    log_message = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship back to Device
    device = relationship("Device", back_populates="scan_results")


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    # Relationship: One Location -> Many Devices
    devices = relationship("Device", back_populates="location")
