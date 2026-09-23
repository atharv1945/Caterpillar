import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.fixture(scope="session")
def client():
    # TestClient will automatically call lifespan events for setup/teardown
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
