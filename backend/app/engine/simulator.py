from collections import defaultdict
from typing import Dict, List, Set, Tuple
import networkx as nx

from app.models.graph import (
    CampusGraphData,
    ComponentStatus,
    ComponentType,
    EdgeType,
    InfrastructureEdge,
    InfrastructureNode,
)
from app.models.simulation import (
    CascadeStep,
    ImpactMetrics,
    SimulationRequest,
    SimulationResult,
)


class DependencySimulator:
    """
    Deterministic Cascading Dependency Simulator using NetworkX.
    Evaluates power delivery, network reachability, service dependencies,
    and automatic backup failover with cycle-safe monotonic fixpoint resolution.
    """

    def __init__(self, campus_data: CampusGraphData):
        self.campus_data = campus_data
        self.node_map: Dict[str, InfrastructureNode] = {n.id: n for n in campus_data.nodes}
        self.edge_map: Dict[str, InfrastructureEdge] = {e.id: e for e in campus_data.edges}
        
        # Build directed graph: u -> v means "u provides to / is dependency of v"
        self.graph = nx.MultiDiGraph()
        for node in campus_data.nodes:
            self.graph.add_node(node.id, data=node)
        
        for edge in campus_data.edges:
            self.graph.add_edge(
                edge.source,
                edge.target,
                key=edge.id,
                edge_id=edge.id,
                edge_type=edge.edge_type,
                is_backup=edge.is_backup,
                label=edge.label,
            )

    def simulate(self, request: SimulationRequest) -> SimulationResult:
        disabled_set: Set[str] = set(request.disabled_node_ids)
        statuses: Dict[str, ComponentStatus] = {}
        timeline: List[CascadeStep] = []
        step_counter = 1

        # Phase 1: Initialize baseline states
        for node_id, node in self.node_map.items():
            if node_id in disabled_set:
                statuses[node_id] = ComponentStatus.OFFLINE_MANUAL
                timeline.append(
                    CascadeStep(
                        step_number=step_counter,
                        node_id=node_id,
                        node_name=node.name,
                        previous_status=node.initial_status,
                        new_status=ComponentStatus.OFFLINE_MANUAL,
                        reason="Component manually isolated / disabled by operator",
                        triggered_by=["USER_ACTION"],
                    )
                )
                step_counter += 1
            else:
                statuses[node_id] = ComponentStatus.OPERATIONAL

        # Phase 2: Fixpoint iterative relaxation
        # Maximum iterations bounded by number of nodes to handle any cyclic dependencies
        max_iterations = len(self.node_map) + 2
        for _ in range(max_iterations):
            state_changed = False

            for node_id, node in self.node_map.items():
                if node_id in disabled_set:
                    continue  # Remains manually offline

                current_status = statuses[node_id]
                new_status, reason, triggers = self._evaluate_node_state(node, statuses)

                if new_status != current_status:
                    statuses[node_id] = new_status
                    timeline.append(
                        CascadeStep(
                            step_number=step_counter,
                            node_id=node_id,
                            node_name=node.name,
                            previous_status=current_status,
                            new_status=new_status,
                            reason=reason,
                            triggered_by=triggers,
                        )
                    )
                    step_counter += 1
                    state_changed = True

            if not state_changed:
                break

        # Phase 3: Identify active transmission conduits / edges
        active_edges = self._compute_active_edges(statuses)

        # Phase 4: Compute impact metrics
        metrics = self._compute_metrics(statuses)

        is_recovered = len(disabled_set) == 0 and all(
            s == ComponentStatus.OPERATIONAL for s in statuses.values()
        )

        return SimulationResult(
            node_statuses=statuses,
            active_edge_ids=active_edges,
            cascade_timeline=timeline,
            metrics=metrics,
            disabled_nodes=list(disabled_set),
            is_recovered=is_recovered,
        )

    def _evaluate_node_state(
        self,
        node: InfrastructureNode,
        current_statuses: Dict[str, ComponentStatus],
    ) -> Tuple[ComponentStatus, str, List[str]]:
        rules = node.rules
        in_edges = self.graph.in_edges(node.id, data=True, keys=True)

        primary_power = 0
        backup_power = 0
        primary_network = 0
        backup_network = 0
        service_count = 0

        failed_power_providers = []
        failed_network_providers = []
        failed_service_providers = []

        for u, _, key, data in in_edges:
            provider_status = current_statuses.get(u, ComponentStatus.FAILED)
            is_online = provider_status in (
                ComponentStatus.OPERATIONAL,
                ComponentStatus.BACKUP_ACTIVE,
            )
            edge_type = data.get("edge_type")
            is_backup = data.get("is_backup", False)

            if edge_type == EdgeType.POWER:
                if is_online:
                    if is_backup:
                        backup_power += 1
                    else:
                        primary_power += 1
                else:
                    failed_power_providers.append(self.node_map[u].name)

            elif edge_type == EdgeType.NETWORK:
                if is_online:
                    if is_backup:
                        backup_network += 1
                    else:
                        primary_network += 1
                else:
                    failed_network_providers.append(self.node_map[u].name)

            elif edge_type == EdgeType.SERVICE_DEPENDENCY:
                if is_online:
                    service_count += 1
                else:
                    failed_service_providers.append(self.node_map[u].name)

        # 1. Check Power satisfaction
        power_status = "OK"
        if rules.min_power_sources > 0:
            if primary_power >= rules.min_power_sources:
                power_status = "PRIMARY"
            elif rules.allows_backup and (primary_power + backup_power) >= rules.min_power_sources:
                power_status = "BACKUP"
            else:
                power_status = "FAILED"

        if power_status == "FAILED":
            return (
                ComponentStatus.FAILED,
                f"Total electrical blackout. Missing required power feeds (Depended on: {', '.join(failed_power_providers) or 'None'}).",
                failed_power_providers,
            )

        # 2. Check Network satisfaction
        network_status = "OK"
        if rules.min_network_sources > 0:
            if primary_network >= rules.min_network_sources:
                network_status = "PRIMARY"
            elif rules.allows_backup and (primary_network + backup_network) >= rules.min_network_sources:
                network_status = "BACKUP"
            else:
                network_status = "FAILED"

        if network_status == "FAILED":
            return (
                ComponentStatus.FAILED,
                f"Network isolation. No active routing or upstream gateway (Depended on: {', '.join(failed_network_providers) or 'None'}).",
                failed_network_providers,
            )

        # 3. Check Service dependency satisfaction
        if rules.min_service_sources > 0 and service_count < rules.min_service_sources:
            return (
                ComponentStatus.FAILED,
                f"Critical interlock safety trip: Required service unreached ({', '.join(failed_service_providers)}).",
                failed_service_providers,
            )

        # 4. Check if operating on backup feeds
        if power_status == "BACKUP" or network_status == "BACKUP":
            active_backups = []
            if power_status == "BACKUP":
                active_backups.append("Auxiliary Backup Power Feed")
            if network_status == "BACKUP":
                active_backups.append("Secondary Network Link")
            return (
                ComponentStatus.BACKUP_ACTIVE,
                f"Operating under failover: {' & '.join(active_backups)}.",
                failed_power_providers + failed_network_providers,
            )

        return (ComponentStatus.OPERATIONAL, "All dependencies satisfied.", [])

    def _compute_active_edges(self, statuses: Dict[str, ComponentStatus]) -> List[str]:
        active_edge_ids: List[str] = []

        for u, v, key, data in self.graph.edges(data=True, keys=True):
            edge_id = data.get("edge_id", key)
            is_backup = data.get("is_backup", False)
            source_status = statuses.get(u, ComponentStatus.FAILED)
            target_status = statuses.get(v, ComponentStatus.FAILED)

            source_online = source_status in (
                ComponentStatus.OPERATIONAL,
                ComponentStatus.BACKUP_ACTIVE,
            )
            target_online = target_status in (
                ComponentStatus.OPERATIONAL,
                ComponentStatus.BACKUP_ACTIVE,
            )

            if source_online and target_online:
                if not is_backup:
                    active_edge_ids.append(edge_id)
                elif is_backup and target_status == ComponentStatus.BACKUP_ACTIVE:
                    # Backup line illuminates when target is actively drawing on failover
                    active_edge_ids.append(edge_id)

        return active_edge_ids

    def _compute_metrics(self, statuses: Dict[str, ComponentStatus]) -> ImpactMetrics:
        total = len(self.node_map)
        op_count = sum(1 for s in statuses.values() if s == ComponentStatus.OPERATIONAL)
        backup_count = sum(1 for s in statuses.values() if s == ComponentStatus.BACKUP_ACTIVE)
        failed_count = sum(1 for s in statuses.values() if s == ComponentStatus.FAILED)
        offline_count = sum(1 for s in statuses.values() if s == ComponentStatus.OFFLINE_MANUAL)

        affected_bldgs: List[str] = []
        unavail_services: List[str] = []
        critical_compromised: List[str] = []

        for node_id, node in self.node_map.items():
            status = statuses[node_id]
            is_healthy = status == ComponentStatus.OPERATIONAL

            if node.type == ComponentType.BUILDING and status in (
                ComponentStatus.FAILED,
                ComponentStatus.OFFLINE_MANUAL,
            ):
                affected_bldgs.append(node.name)

            if node.type == ComponentType.SERVICE and status in (
                ComponentStatus.FAILED,
                ComponentStatus.OFFLINE_MANUAL,
            ):
                unavail_services.append(node.name)

            if node.critical and not is_healthy and status != ComponentStatus.BACKUP_ACTIVE:
                critical_compromised.append(node.name)

        # Health score calculation
        health = ((op_count * 1.0 + backup_count * 0.7) / max(total, 1)) * 100.0

        return ImpactMetrics(
            total_components=total,
            operational_count=op_count,
            backup_active_count=backup_count,
            failed_count=failed_count,
            offline_manual_count=offline_count,
            affected_buildings=affected_bldgs,
            unavailable_services=unavail_services,
            critical_components_compromised=critical_compromised,
            system_health_percentage=round(health, 1),
        )
