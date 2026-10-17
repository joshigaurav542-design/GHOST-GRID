export type ComponentType = 'POWER' | 'NETWORK' | 'SERVICE' | 'BUILDING';

export type ComponentStatus = 
  | 'OPERATIONAL'
  | 'BACKUP_ACTIVE'
  | 'DEGRADED'
  | 'FAILED'
  | 'OFFLINE_MANUAL';

export type EdgeType = 
  | 'POWER'
  | 'NETWORK'
  | 'SERVICE_DEPENDENCY'
  | 'PHYSICAL_HOSTING';

export interface Coordinates3D {
  x: number;
  y: number;
  z: number;
}

export interface DependencyRule {
  min_power_sources: number;
  min_network_sources: number;
  min_service_sources: number;
  allows_backup: boolean;
}

export interface InfrastructureNode {
  id: string;
  name: string;
  type: ComponentType;
  sub_type: string;
  description: string;
  critical: boolean;
  position: Coordinates3D;
  rules: DependencyRule;
  initial_status: ComponentStatus;
}

export interface InfrastructureEdge {
  id: string;
  source: string;
  target: string;
  edge_type: EdgeType;
  is_backup: boolean;
  label: string;
}

export interface CampusGraphData {
  nodes: InfrastructureNode[];
  edges: InfrastructureEdge[];
}

export interface CascadeStep {
  step_number: number;
  node_id: string;
  node_name: string;
  previous_status: ComponentStatus;
  new_status: ComponentStatus;
  reason: string;
  triggered_by: string[];
}

export interface ImpactMetrics {
  total_components: number;
  operational_count: number;
  backup_active_count: number;
  failed_count: number;
  offline_manual_count: number;
  affected_buildings: string[];
  unavailable_services: string[];
  critical_components_compromised: string[];
  system_health_percentage: number;
}

export interface SimulationResult {
  node_statuses: Record<string, ComponentStatus>;
  active_edge_ids: string[];
  cascade_timeline: CascadeStep[];
  metrics: ImpactMetrics;
  disabled_nodes: string[];
  is_recovered: boolean;
}

export interface ScenarioPreset {
  id: string;
  title: string;
  description: string;
  disabled_node_ids: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
}
