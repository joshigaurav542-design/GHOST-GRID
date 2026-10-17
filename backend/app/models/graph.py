from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class ComponentType(str, Enum):
    POWER = "POWER"
    NETWORK = "NETWORK"
    SERVICE = "SERVICE"
    BUILDING = "BUILDING"


class ComponentStatus(str, Enum):
    OPERATIONAL = "OPERATIONAL"
    BACKUP_ACTIVE = "BACKUP_ACTIVE"
    DEGRADED = "DEGRADED"
    FAILED = "FAILED"
    OFFLINE_MANUAL = "OFFLINE_MANUAL"


class EdgeType(str, Enum):
    POWER = "POWER"
    NETWORK = "NETWORK"
    SERVICE_DEPENDENCY = "SERVICE_DEPENDENCY"
    PHYSICAL_HOSTING = "PHYSICAL_HOSTING"


class Coordinates3D(BaseModel):
    x: float
    y: float
    z: float


class DependencyRule(BaseModel):
    min_power_sources: int = 1
    min_network_sources: int = 1
    min_service_sources: int = 0
    allows_backup: bool = True


class InfrastructureNode(BaseModel):
    id: str
    name: str
    type: ComponentType
    sub_type: str
    description: str
    critical: bool = False
    position: Coordinates3D
    rules: DependencyRule = Field(default_factory=DependencyRule)
    initial_status: ComponentStatus = ComponentStatus.OPERATIONAL


class InfrastructureEdge(BaseModel):
    id: str
    source: str  # Provider component
    target: str  # Dependent component
    edge_type: EdgeType
    is_backup: bool = False
    label: str = ""


class CampusGraphData(BaseModel):
    nodes: list[InfrastructureNode]
    edges: list[InfrastructureEdge]
