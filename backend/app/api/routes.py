from typing import List
from fastapi import APIRouter, HTTPException

from app.engine.campus_data import get_default_campus_graph
from app.engine.scenarios import get_preset_scenarios
from app.engine.simulator import DependencySimulator
from app.models.graph import CampusGraphData
from app.models.simulation import (
    ScenarioPreset,
    SimulationRequest,
    SimulationResult,
)

router = APIRouter(prefix="/api", tags=["simulation"])

# Singleton dataset and simulator instance
_campus_graph = get_default_campus_graph()
_simulator = DependencySimulator(_campus_graph)
_scenarios = get_preset_scenarios()
_scenario_map = {s.id: s for s in _scenarios}


@router.get("/graph", response_model=CampusGraphData)
def get_graph() -> CampusGraphData:
    """Return synthetic campus infrastructure graph with 3D positions and rules."""
    return _campus_graph


@router.post("/simulate", response_model=SimulationResult)
def simulate_cascade(request: SimulationRequest) -> SimulationResult:
    """Simulate cascading failures deterministically based on disabled node IDs."""
    return _simulator.simulate(request)


@router.get("/scenarios", response_model=List[ScenarioPreset])
def list_scenarios() -> List[ScenarioPreset]:
    """List predefined disaster simulation presets."""
    return _scenarios


@router.post("/scenarios/{scenario_id}/apply", response_model=SimulationResult)
def apply_scenario(scenario_id: str) -> SimulationResult:
    """Apply a preset disaster scenario and return immediate cascading impacts."""
    if scenario_id not in _scenario_map:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found.")
    
    scenario = _scenario_map[scenario_id]
    request = SimulationRequest(disabled_node_ids=scenario.disabled_node_ids)
    return _simulator.simulate(request)


@router.post("/reset", response_model=SimulationResult)
def reset_simulation() -> SimulationResult:
    """Restore all infrastructure components back to nominal operational state."""
    return _simulator.simulate(SimulationRequest(disabled_node_ids=[]))
