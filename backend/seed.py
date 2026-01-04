from database import SessionLocal
import models
from passlib.context import CryptContext
import random
from datetime import datetime, timedelta

# Password hashing setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed_data():
    db = SessionLocal()

    # Check if DB is already populated
    if db.query(models.User).first():
        print("Database already seeded. Skipping.")
        db.close()
        return

    print("Seeding data...")

    # 1. Create Admin User
    admin = models.User(
        email="admin@admin.com",
        hashed_password=pwd_context.hash("admin"),
        role="admin",
        is_active=True
    )
    db.add(admin)

    # 2. Create Locations
    loc_server = models.Location(name="Server Room")
    loc_office = models.Location(name="Office 101")
    loc_warehouse = models.Location(name="Warehouse")

    db.add_all([loc_server, loc_office, loc_warehouse])
    db.commit()  # Commit to generate IDs

    # 3. Create Device Types
    type_router = models.DeviceType(name="Router", icon_name="router")
    type_switch = models.DeviceType(name="Switch", icon_name="switch")
    type_pc = models.DeviceType(name="PC", icon_name="desktop")
    type_printer = models.DeviceType(name="Printer", icon_name="print")

    db.add_all([type_router, type_switch, type_pc, type_printer])
    db.commit()

    # 4. Create Devices
    devices = [
        models.Device(name="Main Gateway", ip_address="192.168.1.1", mac_address="AA:00:00:01",
                      location_id=loc_server.id, device_type_id=type_router.id),
        models.Device(name="Core Switch", ip_address="192.168.1.2", mac_address="AA:00:00:02",
                      location_id=loc_server.id, device_type_id=type_switch.id),
        models.Device(name="Manager PC", ip_address="192.168.1.10", mac_address="AA:00:00:03",
                      location_id=loc_office.id, device_type_id=type_pc.id),
        models.Device(name="Warehouse AP", ip_address="192.168.1.50", mac_address="AA:00:00:04",
                      location_id=loc_warehouse.id, device_type_id=type_router.id),
    ]

    db.add_all(devices)
    db.commit()

    # 5. Generate Scan History (Logs)
    for dev in devices:
        for i in range(5):
            is_online = random.choice([True, True, False])
            log = models.ScanResult(
                device_id=dev.id,
                status=is_online,
                response_time_ms=random.randint(5, 80) if is_online else None,
                log_message="OK" if is_online else "Request Timed Out",
                timestamp=datetime.now() - timedelta(hours=i * 4)
            )
            db.add(log)

    db.commit()
    db.close()
    print("Success: Database seeded!")


if __name__ == "__main__":
    seed_data()
