from typing import List
from app.models.simulation import ScenarioPreset


def get_preset_scenarios() -> List[ScenarioPreset]:
    return [
        ScenarioPreset(
            id="scenario_grid_substation_failure",
            title="Main Grid Transformer Catastrophic Arc Flash",
            description=(
                "A 115kV surge causes catastrophic failure of the municipal power feed. "
                "The campus is plunged into an islanded state. The Data Center and Medical Clinic "
                "immediately fail over to emergency diesel generators, while academic halls go dark."
            ),
            disabled_node_ids=["power_grid_main"],
            severity="CRITICAL",
            category="Power Infrastructure",
        ),
        ScenarioPreset(
            id="scenario_core_switch_cyberattack",
            title="Core Nexus Backbone Ransomware Lockout",
            description=(
                "A sophisticated zero-day intrusion targets the campus core routing plane. "
                "With internal routing severed, keycard security access, student registration, "
                "and research computing enter failsafe lockdowns while emergency blue-light telephony "
                "fails over to low-bandwidth emergency satellite links."
            ),
            disabled_node_ids=["net_cloud_uplink", "net_core_datacenter"],
            severity="HIGH",
            category="Cybersecurity & Network",
        ),
        ScenarioPreset(
            id="scenario_compound_datacenter_meltdown",
            title="Severe Storm & Data Center Generator Lockout",
            description=(
                "Severe weather knocks out the North Substation feeder lines. Simultaneously, "
                "contaminated fuel stalls the Data Center emergency diesel generator. "
                "Alan Turing Computing Center loses all power, creating an unmitigated cascading collapse "
                "across campus research, life safety interlocks, and laboratory ventilation."
            ),
            disabled_node_ids=["power_substation_north", "power_backup_diesel_datacenter"],
            severity="CRITICAL",
            category="Compound Cascading Disaster",
        ),
    ]
