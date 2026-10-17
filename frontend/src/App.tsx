import React, { useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import type {
  CampusGraphData,
  ScenarioPreset,
  SimulationResult,
} from './types';
import {
  fetchCampusGraph,
  fetchScenarios,
  simulateCascade,
  applyScenario,
  resetSimulation,
} from './api/client';
import { Header } from './components/hud/Header';
import { ImpactPanel } from './components/hud/ImpactPanel';
import { ComponentInspector } from './components/inspector/ComponentInspector';
import { CampusCanvas } from './components/3d/CampusCanvas';
import { DependencyFlow } from './components/2d/DependencyFlow';

export const App: React.FC = () => {
  const [graphData, setGraphData] = useState<CampusGraphData | null>(null);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioPreset[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [disabledNodeIds, setDisabledNodeIds] = useState<string[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('power_grid_main');
  const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Initialize graph and scenarios on mount
  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        const [graph, scens, initialSim] = await Promise.all([
          fetchCampusGraph(),
          fetchScenarios(),
          simulateCascade([]),
        ]);
        setGraphData(graph);
        setScenarios(scens);
        setSimulation(initialSim);
        setDisabledNodeIds(initialSim.disabled_nodes);
      } catch (err) {
        console.error('Failed to initialize GHOST GRID:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Toggle disabling a single node
  const handleToggleNode = useCallback(async (nodeId: string) => {
    try {
      setIsSimulating(true);
      const isCurrentlyDisabled = disabledNodeIds.includes(nodeId);
      const nextDisabled = isCurrentlyDisabled
        ? disabledNodeIds.filter((id) => id !== nodeId)
        : [...disabledNodeIds, nodeId];

      setActiveScenarioId(null);
      const result = await simulateCascade(nextDisabled);
      setSimulation(result);
      setDisabledNodeIds(result.disabled_nodes);

      // If full nominal recovery was achieved by restoring this node
      if (result.is_recovered && isCurrentlyDisabled) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00f0ff', '#06d6a0', '#ffffff'],
        });
      }
    } catch (err) {
      console.error('Failed to simulate toggle:', err);
    } finally {
      setIsSimulating(false);
    }
  }, [disabledNodeIds]);

  // Apply a preset disaster scenario
  const handleApplyScenario = useCallback(async (scenarioId: string) => {
    try {
      setIsSimulating(true);
      setActiveScenarioId(scenarioId);
      const result = await applyScenario(scenarioId);
      setSimulation(result);
      setDisabledNodeIds(result.disabled_nodes);
      // Auto-select first disabled node so inspector opens immediately
      if (result.disabled_nodes.length > 0) {
        setSelectedNodeId(result.disabled_nodes[0]);
      }
    } catch (err) {
      console.error('Failed to apply scenario:', err);
    } finally {
      setIsSimulating(false);
    }
  }, []);

  // Reset to 100% nominal state
  const handleReset = useCallback(async () => {
    try {
      setIsSimulating(true);
      setActiveScenarioId(null);
      const result = await resetSimulation();
      setSimulation(result);
      setDisabledNodeIds([]);
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#00f0ff', '#06d6a0', '#ffb703'],
      });
    } catch (err) {
      console.error('Failed to reset simulation:', err);
    } finally {
      setIsSimulating(false);
    }
  }, []);

  if (isLoading || !graphData || !simulation) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#06090e',
        gap: '16px',
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '3px solid rgba(0, 240, 255, 0.2)',
          borderTopColor: '#00f0ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', letterSpacing: '1px', fontWeight: 600 }}>
          INITIALIZING AETHER CAMPUS INFRASTRUCTURE TWIN...
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const nodeStatuses = simulation.node_statuses;
  const activeEdgeIds = simulation.active_edge_ids;

  return (
    <div className="grid-overlay" style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-primary)',
      overflow: 'hidden',
    }}>
      {/* Top HUD Navigation & Control Header */}
      <Header
        healthPercentage={simulation.metrics.system_health_percentage}
        scenarios={scenarios}
        activeScenarioId={activeScenarioId}
        onApplyScenario={handleApplyScenario}
        onReset={handleReset}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        isSimulating={isSimulating}
      />

      {/* Main Workspace */}
      <div style={{
        flex: 1,
        display: 'flex',
        padding: '0 16px 16px 16px',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Left Side: Campus Impact Panel & Cascade Log */}
        <ImpactPanel
          metrics={simulation.metrics}
          cascadeTimeline={simulation.cascade_timeline}
          onSelectNode={setSelectedNodeId}
          selectedNodeId={selectedNodeId}
        />

        {/* Center: 3D Campus or 2D Graph Visualizer */}
        <div className="glass-panel" style={{
          flex: 1,
          height: 'calc(100vh - 100px)',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {viewMode === '3D' ? (
            <CampusCanvas
              graphData={graphData}
              nodeStatuses={nodeStatuses}
              activeEdgeIds={activeEdgeIds}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
            />
          ) : (
            <DependencyFlow
              graphData={graphData}
              nodeStatuses={nodeStatuses}
              activeEdgeIds={activeEdgeIds}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
            />
          )}

          {/* Quick HUD legend on bottom canvas */}
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            background: 'rgba(8, 12, 18, 0.85)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            fontSize: '10px',
            fontWeight: 600,
            backdropFilter: 'blur(8px)',
            pointerEvents: 'none',
          }}>
            <span style={{ color: 'var(--text-muted)' }}>CONDUIT LEGEND:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f0ff', boxShadow: '0 0 6px #00f0ff' }} />
              <span style={{ color: '#fff' }}>Power</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9d4edd', boxShadow: '0 0 6px #9d4edd' }} />
              <span style={{ color: '#fff' }}>Network Fiber</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffb703', boxShadow: '0 0 6px #ffb703' }} />
              <span style={{ color: '#fff' }}>Failover Backup</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#202938' }} />
              <span style={{ color: 'var(--text-muted)' }}>Severed</span>
            </div>
          </div>
        </div>

        {/* Right Side: Component Inspector */}
        {selectedNodeId && (
          <ComponentInspector
            nodeId={selectedNodeId}
            graphData={graphData}
            nodeStatuses={nodeStatuses}
            disabledNodeIds={disabledNodeIds}
            onToggleNode={handleToggleNode}
            onClose={() => setSelectedNodeId(null)}
            onSelectRelatedNode={setSelectedNodeId}
          />
        )}
      </div>
    </div>
  );
};

export default App;
