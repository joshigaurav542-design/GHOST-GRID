import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "SYNTHETIC" in data["simulation_disclaimer"]


def test_get_graph_endpoint():
    res = client.get("/api/graph")
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "edges" in data
    assert len(data["nodes"]) >= 15
    assert len(data["edges"]) >= 20


def test_simulate_endpoint():
    res = client.post("/api/simulate", json={"disabled_node_ids": ["power_substation_north"]})
    assert res.status_code == 200
    data = res.json()
    assert data["node_statuses"]["power_substation_north"] == "OFFLINE_MANUAL"
    assert data["node_statuses"]["bldg_science_complex"] == "FAILED"
    assert "system_health_percentage" in data["metrics"]
    assert len(data["cascade_timeline"]) > 0


def test_scenarios_endpoints():
    res = client.get("/api/scenarios")
    assert res.status_code == 200
    scenarios = res.json()
    assert len(scenarios) == 3

    first_scenario_id = scenarios[0]["id"]
    res_apply = client.post(f"/api/scenarios/{first_scenario_id}/apply")
    assert res_apply.status_code == 200
    applied_data = res_apply.json()
    assert applied_data["metrics"]["system_health_percentage"] < 100.0


def test_reset_endpoint():
    # First disable
    client.post("/api/simulate", json={"disabled_node_ids": ["power_grid_main"]})
    # Reset
    res = client.post("/api/reset")
    assert res.status_code == 200
    data = res.json()
    assert data["is_recovered"] is True
    assert data["metrics"]["system_health_percentage"] == 100.0
