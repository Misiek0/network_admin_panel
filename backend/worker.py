import logging
import platform
import asyncio
import subprocess
from datetime import datetime
from database import SessionLocal
import models

# Logging configuration - outputs logs to the console
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


async def ping_device(ip_address: str) -> tuple[str, bool]:
    """
    Pings an IP address asynchronously using a system subprocess.
    Returns a tuple (ip, status).
    """
    # Parameter for the number of attempts (-n for Windows, -c for Linux)
    param = '-n' if platform.system().lower() == 'windows' else '-c'

    try:
        # Creating a subprocess for asynchronous pinging
        proc = await asyncio.create_subprocess_exec(
            'ping', param, '1', ip_address,
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.DEVNULL
        )

        return_code = await proc.wait()
        is_online = (return_code == 0)
        return ip_address, is_online
    except Exception as e:
        logger.error(f"Ping failed for {ip_address}: {e}")
        return ip_address, False


async def run_scan_cycle():
    """
    Main function executing one full network scan cycle.
    """
    logger.info("--- STARTING ASYNC NETWORK SCAN ---")

    devices = []
    device_map = {}

    # Fetch devices from the database
    with SessionLocal() as db:
        devices = db.query(models.Device).all()
        # Mapping objects to a dictionary for easier access by IP
        device_map = {d.ip_address: d for d in devices}

    if not devices:
        logger.warning("No devices found in the database. Waiting for devices...")
        return

    # Concurrent execution of pings (async)
    tasks = [ping_device(device.ip_address) for device in devices]
    results = await asyncio.gather(*tasks)

    # Saving results to the database
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


async def main():
    logger.info("Worker started. Running scan every 60 seconds.")
    logger.info("Press CTRL+C to stop the worker.")
    while True:
        await run_scan_cycle()
        logger.info("Sleeping for 60 seconds...")
        await asyncio.sleep(60)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Worker stopped by user.")