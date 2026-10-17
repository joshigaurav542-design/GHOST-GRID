import type {
  CampusGraphData,
  ScenarioPreset,
  SimulationResult,
} from '../types';

const API_BASE = '/api';

export async function fetchCampusGraph(): Promise<CampusGraphData> {
  const res = await fetch(`${API_BASE}/graph`);
  if (!res.ok) {
    throw new Error(`Failed to fetch campus graph: ${res.statusText}`);
  }
  return res.json();
}

export async function simulateCascade(disabledNodeIds: string[]): Promise<SimulationResult> {
  const res = await fetch(`${API_BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ disabled_node_ids: disabledNodeIds }),
  });
  if (!res.ok) {
    throw new Error(`Simulation request failed: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchScenarios(): Promise<ScenarioPreset[]> {
  const res = await fetch(`${API_BASE}/scenarios`);
  if (!res.ok) {
    throw new Error(`Failed to fetch preset scenarios: ${res.statusText}`);
  }
  return res.json();
}

export async function applyScenario(scenarioId: string): Promise<SimulationResult> {
  const res = await fetch(`${API_BASE}/scenarios/${scenarioId}/apply`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(`Failed to apply scenario: ${res.statusText}`);
  }
  return res.json();
}

export async function resetSimulation(): Promise<SimulationResult> {
  const res = await fetch(`${API_BASE}/reset`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(`Failed to reset simulation: ${res.statusText}`);
  }
  return res.json();
}
