import pytest
from app.engine.campus_data import get_default_campus_graph
from app.engine.simulator import DependencySimulator
from app.models.graph import (
    CampusGraphData,
    ComponentStatus,
    ComponentType,
    Coordinates3D,
    DependencyRule,
    EdgeType,
    InfrastructureEdge,
    InfrastructureNode,
)
from app.models.simulation import SimulationRequest


@pytest.fixture
def simulator():
    graph = get_default_campus_graph()
    return DependencySimulator(graph)


def test_baseline_nominal_state(simulator):
    """Initial simulation with 0 disabled nodes should be 100% operational."""
    res = simulator.simulate(SimulationRequest(disabled_node_ids=[]))
    assert res.is_recovered is True
    assert res.metrics.system_health_percentage == 100.0
    assert res.metrics.failed_count == 0
    assert res.metrics.backup_active_count == 0
    assert len(res.metrics.affected_buildings) == 0
    assert len(res.metrics.unavailable_services) == 0
    for status in res.node_statuses.values():
        assert status == ComponentStatus.OPERATIONAL


def test_failure_propagation(simulator):
    """Disabling North Substation should cascade and fail North Quad & Science Complex."""
    res = simulator.simulate(SimulationRequest(disabled_node_ids=["power_substation_north"]))
    statuses = res.node_statuses

    # Directly disabled
    assert statuses["power_substation_north"] == ComponentStatus.OFFLINE_MANUAL

    # Dependent components without backup should fail
    assert statuses["bldg_science_complex"] == ComponentStatus.FAILED
    assert statuses["bldg_residence_quad"] == ComponentStatus.FAILED

    assert "Franklin Science & Engineering Complex" in res.metrics.affected_buildings
    assert "North Residential Quadrangle" in res.metrics.affected_buildings


def test_backup_route_failover(simulator):
    """Disabling main grid should engage backup generators for Data Center and Clinic."""
    res = simulator.simulate(SimulationRequest(disabled_node_ids=["power_grid_main"]))
    statuses = res.node_statuses

    # Grid is offline
    assert statuses["power_grid_main"] == ComponentStatus.OFFLINE_MANUAL

    # Datacenter has backup diesel generator, so it must be BACKUP_ACTIVE, not FAILED!
    assert statuses["bldg_datacenter"] == ComponentStatus.BACKUP_ACTIVE

    # South Substation has solar microgrid backup, so it must be BACKUP_ACTIVE
    assert statuses["power_substation_south"] == ComponentStatus.BACKUP_ACTIVE

    # Backup conduit to datacenter should be active
    assert "e_gen_to_datacenter" in res.active_edge_ids


def test_medical_clinic_local_generator_failover(simulator):
    """Disabling South Substation directly triggers the Medical Clinic's auxiliary generator."""
    res = simulator.simulate(SimulationRequest(disabled_node_ids=["power_substation_south"]))
    statuses = res.node_statuses

    assert statuses["power_substation_south"] == ComponentStatus.OFFLINE_MANUAL
    # Unprotected buildings on south substation fail
    assert statuses["bldg_admin_tower"] == ComponentStatus.FAILED
    assert statuses["bldg_library"] == ComponentStatus.FAILED

    # But Medical Clinic has dedicated emergency generator and stays online on BACKUP_ACTIVE!
    assert statuses["bldg_medical_clinic"] == ComponentStatus.BACKUP_ACTIVE
    assert "e_gen_to_medical" in res.active_edge_ids


def test_compound_failure_backup_loss(simulator):
    """Disabling primary feed AND backup generator should fail Datacenter and all hosted services."""
    res = simulator.simulate(
        SimulationRequest(
            disabled_node_ids=["power_substation_north", "power_backup_diesel_datacenter"]
        )
    )
    statuses = res.node_statuses

    assert statuses["bldg_datacenter"] == ComponentStatus.FAILED
    # Downstream services hosted/powered by Datacenter must cascade fail
    assert statuses["service_hpc_cluster"] == ComponentStatus.FAILED
    assert statuses["service_security_access"] == ComponentStatus.FAILED
    assert statuses["service_fire_safety"] == ComponentStatus.FAILED

    assert len(res.metrics.unavailable_services) >= 3


def test_recovery_restoration(simulator):
    """Restoring a previously disabled component returns system to full nominal health."""
    # First disable
    res_failed = simulator.simulate(SimulationRequest(disabled_node_ids=["power_grid_main"]))
    assert res_failed.is_recovered is False
    assert res_failed.metrics.system_health_percentage < 100.0

    # Then restore / empty list
    res_restored = simulator.simulate(SimulationRequest(disabled_node_ids=[]))
    assert res_restored.is_recovered is True
    assert res_restored.metrics.system_health_percentage == 100.0
    assert all(s == ComponentStatus.OPERATIONAL for s in res_restored.node_statuses.values())


def test_cyclic_dependency_stability():
    """Verify simulator handles cycles without infinite loops or recursion depth errors."""
    cyclic_nodes = [
        InfrastructureNode(
            id="node_a",
            name="Node A",
            type=ComponentType.SERVICE,
            sub_type="Microservice A",
            description="Service in cycle",
            position=Coordinates3D(x=0, y=0, z=0),
            rules=DependencyRule(min_power_sources=0, min_network_sources=0, min_service_sources=1),
        ),
        InfrastructureNode(
            id="node_b",
            name="Node B",
            type=ComponentType.SERVICE,
            sub_type="Microservice B",
            description="Service in cycle",
            position=Coordinates3D(x=1, y=0, z=0),
            rules=DependencyRule(min_power_sources=0, min_network_sources=0, min_service_sources=1),
        ),
        InfrastructureNode(
            id="node_c",
            name="Node C",
            type=ComponentType.SERVICE,
            sub_type="Microservice C",
            description="Service in cycle",
            position=Coordinates3D(x=2, y=0, z=0),
            rules=DependencyRule(min_power_sources=0, min_network_sources=0, min_service_sources=1),
        ),
    ]

    # Cycle: A -> B -> C -> A
    cyclic_edges = [
        InfrastructureEdge(id="e_ab", source="node_a", target="node_b", edge_type=EdgeType.SERVICE_DEPENDENCY),
        InfrastructureEdge(id="e_bc", source="node_b", target="node_c", edge_type=EdgeType.SERVICE_DEPENDENCY),
        InfrastructureEdge(id="e_ca", source="node_c", target="node_a", edge_type=EdgeType.SERVICE_DEPENDENCY),
    ]

    cyclic_graph = CampusGraphData(nodes=cyclic_nodes, edges=cyclic_edges)
    sim = DependencySimulator(cyclic_graph)

    # Disabling node_a should cascade through cycle cleanly and terminate
    res = sim.simulate(SimulationRequest(disabled_node_ids=["node_a"]))
    assert res.node_statuses["node_a"] == ComponentStatus.OFFLINE_MANUAL
    assert res.node_statuses["node_b"] == ComponentStatus.FAILED
    assert res.node_statuses["node_c"] == ComponentStatus.FAILED
    # Must have recorded timeline steps without hanging
    assert len(res.cascade_timeline) >= 3
