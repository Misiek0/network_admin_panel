import logging
import platform
import asyncio
import subprocess
from datetime import datetime
from database import SessionLocal
import models

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("worker.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


async def ping_device(ip_address: str) -> tuple[str, bool]:
    """
    Pings an IP address asynchronously using a subprocess.
    Returns a tuple containing the IP address and its status (True for online).
    """
    # parameter for number of attempts (-n for Windows/-c for Linux)
    param = '-n' if platform.system().lower() == 'windows' else '-c'

    # Creating subprocess for async pinging
    proc = await asyncio.create_subprocess_exec(
        'ping', param, '1', ip_address,
        stdout=asyncio.subprocess.DEVNULL,
        stderr=asyncio.subprocess.DEVNULL
    )

    return_code = await proc.wait()
    is_online = (return_code == 0)
    return ip_address, is_online


async def run_scan_cycle():
    """
    Main asynchronous function that manages the full network scan cycle.
    """
    logger.info("--- STARTING ASYNC NETWORK SCAN ---")

    devices = []
    device_map = {}

    # 1. Fetch devices
    with SessionLocal() as db:
        devices = db.query(models.Device).all()
        # Map objects to a dictionary
        device_map = {d.ip_address: d for d in devices}

    if not devices:
        logger.warning("No devices found in the database.")
        return

    # 2. Execute pings concurrently
    tasks = [ping_device(device.ip_address) for device in devices]
    results = await asyncio.gather(*tasks)

    # 3. Save results
    with SessionLocal() as db:
        try:
            for ip, is_online in results:
                device = device_map.get(ip)
                status_text = "ONLINE" if is_online else "OFFLINE"

                if is_online:
                    logger.info(f"Device {device.name} ({ip}) is {status_text}")
                else:
                    logger.warning(f"Device {device.name} ({ip}) is {status_text}")

                scan_result = models.ScanResult(
                    device_id=device.id,
                    status=is_online,
                    timestamp=datetime.now()
                )
                db.add(scan_result)

            db.commit()
            logger.info("--- SCAN COMPLETED AND SAVED ---")
        except Exception as e:
            db.rollback()
            logger.error(f"Error saving scan results: {e}")


def main():
    asyncio.run(run_scan_cycle())


if __name__ == "__main__":
    main()
