import pytest
import subprocess
import time
import requests
from typing import Generator


@pytest.fixture(scope="session")
def servers() -> Generator:
    """Set the mock database here."""
    """Start the servers before tests and stop them after."""

    # Start the servers without capturing output (so we can see errors)
    process = subprocess.Popen(
        ["invoke", "server"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )

    print("\n=== Starting servers ===")

    # Wait for servers to be ready
    max_retries = 30
    for i in range(max_retries):
        try:
            # Check if frontend is up
            frontend_response = requests.get(
                "http://localhost:5173", timeout=1)
            print(f"Frontend check: {frontend_response.status_code}")

            # Check if backend is up
            backend_response = requests.get("http://localhost:8000", timeout=1)
            print(f"Backend check: {backend_response.status_code}")

            print("=== Servers are ready ===\n")
            break

        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
            print(f"Retry {i + 1}/{max_retries}: Servers not ready yet...")

            # Check if process has died
            if process.poll() is not None:
                # Process has terminated
                stdout, _ = process.communicate()
                print(
                    f"Process terminated early with code {
                        process.returncode}")
                print(f"Output: {stdout}")
                raise RuntimeError(
                    f"Server process died with exit code {process.returncode}"
                )

            time.sleep(1)
    else:
        # Timeout - get any output from the process
        process.terminate()
        stdout, _ = process.communicate(timeout=5)
        print(f"Server output:\n{stdout}")
        raise RuntimeError("Servers failed to start within 30 seconds")

    yield

    # Cleanup: stop the servers
    print("\n=== Stopping servers ===")
    process.terminate()
    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait()
