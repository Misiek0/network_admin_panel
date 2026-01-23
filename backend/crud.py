from sqlalchemy.orm import Session, joinedload
import models
import schemas
import auth


# User management
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)

    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        role=user.role,
        is_active=True
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# Dictionaries for dropdowns in frontend
def get_locations(db: Session):
    return db.query(models.Location).all()


def get_device_types(db: Session):
    return db.query(models.DeviceType).all()


# Devices(Core)
def get_devices(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Device).offset(skip).limit(limit).all()


def get_device(db: Session, device_id: int):
    return db.query(models.Device).filter(models.Device.id == device_id).first()


def get_device_by_ip(db: Session, ip_address: str):
    return db.query(models.Device).filter(models.Device.ip_address == ip_address).first()


def get_device_by_mac(db: Session, mac_address: str):
    if not mac_address:
        return None
    return db.query(models.Device).filter(models.Device.mac_address == mac_address).first()


def create_device(db: Session, device: schemas.DeviceCreate):
    db_device = models.Device(
        name=device.name,
        ip_address=str(device.ip_address),
        mac_address=device.mac_address if device.mac_address else None,
        location_id=device.location_id,
        device_type_id=device.device_type_id
    )

    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device


def update_device(db: Session, device_id: int, device_update: schemas.DeviceCreate):
    db_device = db.query(models.Device).filter(models.Device.id == device_id).first()

    if not db_device:
        return None

    db_device.name = device_update.name
    db_device.ip_address = str(device_update.ip_address)
    db_device.mac_address = device_update.mac_address if device_update.mac_address else None
    db_device.location_id = device_update.location_id
    db_device.device_type_id = device_update.device_type_id

    db.commit()
    db.refresh(db_device)
    return db_device


def delete_device(db: Session, device_id: int):
    db_device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if db_device:
        db.delete(db_device)
        db.commit()
    return db_device


def get_scan_results(db: Session, skip: int = 0, limit: int = 50):
    return db.query(models.ScanResult)\
        .options(joinedload(models.ScanResult.device))\
        .order_by(models.ScanResult.timestamp.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
