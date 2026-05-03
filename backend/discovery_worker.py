import asyncio
import logging
import subprocess
import ipaddress
import platform

from database import SessionLocal
import models
import crud

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)
PING_CONCURRENCY = 64


def run_nmap_scan(cidr: str) -> list[str]:
    """
    Run nmap ping scan and return discovered IPv4 addresses.
    """
    try:
        network = ipaddress.ip_network(cidr, strict=False)
    except ValueError:
        logger.error(f"Invalid CIDR configured for discovery: {cidr}")
        return []

    valid_host_ips = {str(host) for host in network.hosts()}

    try:
        result = subprocess.run(
            ["nmap", "-sn", "-n", "-oG", "-", cidr],
            capture_output=True,
            text=True,
            check=False,
        )
    except FileNotFoundError:
        logger.error("nmap executable not found. Install nmap and ensure it is in PATH.")
        return []
    except Exception as exc:
        logger.error(f"nmap scan failed for {cidr}: {exc}")
        return []

    if result.returncode != 0:
        logger.warning(f"nmap returned code {result.returncode} for {cidr}: {result.stderr.strip()}")
        return []

    found_ips = set()
    for line in result.stdout.splitlines():
        # Grepable format example:
        # Host: 192.168.1.10 ()  Status: Up
        if not line.startswith("Host: "):
            continue
        if "Status: Up" not in line:
            continue

        parts = line.split()
        if len(parts) < 2:
            continue
        candidate_ip = parts[1]

        # Safety filter: only valid IPv4 hosts from network range
        if candidate_ip in valid_host_ips:
            found_ips.add(candidate_ip)

    return sorted(found_ips)


async def is_host_reachable(ip_address: str, semaphore: asyncio.Semaphore) -> bool:
    """
    Confirm host reachability with a direct ICMP ping.
    This extra check protects against nmap false positives in containerized environments.
    """
    is_windows = platform.system().lower() == "windows"
    count_param = "-n" if is_windows else "-c"
    timeout_param = "-w" if is_windows else "-W"
    timeout_value = "1000" if is_windows else "1"

    async with semaphore:
        try:
            proc = await asyncio.create_subprocess_exec(
                "ping",
                count_param,
                "1",
                timeout_param,
                timeout_value,
                ip_address,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.DEVNULL,
            )
            return_code = await asyncio.wait_for(proc.wait(), timeout=3)
            return return_code == 0
        except Exception:
            return False


async def get_reachable_hosts(discovered_ips: list[str]) -> list[str]:
    if not discovered_ips:
        return []

    semaphore = asyncio.Semaphore(PING_CONCURRENCY)
    checks = [is_host_reachable(ip, semaphore) for ip in discovered_ips]
    results = await asyncio.gather(*checks, return_exceptions=False)
    return [ip for ip, is_up in zip(discovered_ips, results) if is_up]


async def run_discovery_cycle():
    logger.info("--- STARTING HOST DISCOVERY CYCLE ---")
    with SessionLocal() as db:
        networks = crud.get_discovery_networks(db)
        if not networks:
            logger.info("No discovery networks configured.")
            return

        existing_device_ips = {
            row[0]
            for row in db.query(models.Device.ip_address).all()
        }

        try:
            for network in networks:
                discovered_ips = run_nmap_scan(network.cidr)
                reachable_ips = await get_reachable_hosts(discovered_ips)
                new_hosts = 0

                for ip in reachable_ips:
                    if ip in existing_device_ips:
                        continue
                    host = crud.create_discovered_host_if_missing(db, network.id, ip)
                    if host and host.status == "pending":
                        new_hosts += 1

                crud.mark_network_discovery_time(db, network.id)
                logger.info(
                    f"Network {network.name} ({network.cidr}) scanned. "
                    f"Candidates: {len(discovered_ips)}, reachable: {len(reachable_ips)}, new pending hosts: {new_hosts}"
                )

            db.commit()
            logger.info("--- HOST DISCOVERY CYCLE COMPLETED ---")
        except Exception as exc:
            db.rollback()
            logger.error(f"Discovery cycle failed: {exc}")


async def main():
    logger.info("Discovery worker started. Running discovery every 90 seconds.")
    logger.info("Press CTRL+C to stop the worker.")
    while True:
        await run_discovery_cycle()
        await asyncio.sleep(90)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Discovery worker stopped by user.")
