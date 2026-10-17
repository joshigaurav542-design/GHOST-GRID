from typing import Optional
from pydantic import BaseModel, Field
from app.models.graph import ComponentStatus


class SimulationRequest(BaseModel):
    disabled_node_ids: list[str] = Field(default_factory=list)


class CascadeStep(BaseModel):
    step_number: int
    node_id: str
    node_name: str
    previous_status: ComponentStatus
    new_status: ComponentStatus
    reason: str
    triggered_by: list[str] = Field(default_factory=list)


class ImpactMetrics(BaseModel):
    total_components: int
    operational_count: int
    backup_active_count: int
    failed_count: int
    offline_manual_count: int
    affected_buildings: list[str]
    unavailable_services: list[str]
    critical_components_compromised: list[str]
    system_health_percentage: float


class SimulationResult(BaseModel):
    node_statuses: dict[str, ComponentStatus]
    active_edge_ids: list[str]
    cascade_timeline: list[CascadeStep]
    metrics: ImpactMetrics
    disabled_nodes: list[str]
    is_recovered: bool


class ScenarioPreset(BaseModel):
    id: str
    title: str
    description: str
    disabled_node_ids: list[str]
    severity: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    category: str
