import React from 'react';
import {
  X,
  Power,
  Wifi,
  Cpu,
  Building2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import type {
  CampusGraphData,
  ComponentStatus,
  ComponentType,
  InfrastructureNode,
} from '../../types';

interface ComponentInspectorProps {
  nodeId: string | null;
  graphData: CampusGraphData | null;
  nodeStatuses: Record<string, ComponentStatus>;
  disabledNodeIds: string[];
  onToggleNode: (nodeId: string) => void;
  onClose: () => void;
  onSelectRelatedNode: (nodeId: string) => void;
}

export const ComponentInspector: React.FC<ComponentInspectorProps> = ({
  nodeId,
  graphData,
  nodeStatuses,
  disabledNodeIds,
  onToggleNode,
  onClose,
  onSelectRelatedNode,
}) => {
  if (!nodeId || !graphData) return null;

  const node = graphData.nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const currentStatus = nodeStatuses[nodeId] || 'OPERATIONAL';
  const isManuallyDisabled = disabledNodeIds.includes(nodeId);

  // Upstream providers
  const incomingEdges = graphData.edges.filter((e) => e.target === nodeId);
  const upstreamNodes = incomingEdges.map((e) => ({
    edge: e,
    node: graphData.nodes.find((n) => n.id === e.source),
  })).filter((item): item is { edge: typeof item.edge; node: InfrastructureNode } => !!item.node);

  // Downstream dependents (Blast radius)
  const outgoingEdges = graphData.edges.filter((e) => e.source === nodeId);
  const downstreamNodes = outgoingEdges.map((e) => ({
    edge: e,
    node: graphData.nodes.find((n) => n.id === e.target),
  })).filter((item): item is { edge: typeof item.edge; node: InfrastructureNode } => !!item.node);

  const getTypeIcon = (type: ComponentType) => {
    switch (type) {
      case 'POWER': return <Power size={14} color="var(--accent-amber)" />;
      case 'NETWORK': return <Wifi size={14} color="var(--accent-cyan)" />;
      case 'SERVICE': return <Cpu size={14} color="var(--accent-purple)" />;
      case 'BUILDING': return <Building2 size={14} color="var(--accent-emerald)" />;
    }
  };

  const getStatusBadge = (status: ComponentStatus) => {
    switch (status) {
      case 'OPERATIONAL':
        return <span className="badge-operational" style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>OPERATIONAL</span>;
      case 'BACKUP_ACTIVE':
        return <span className="badge-backup" style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>BACKUP ACTIVE</span>;
      case 'FAILED':
        return <span className="badge-failed" style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>FAILED / COLLAPSED</span>;
      case 'OFFLINE_MANUAL':
        return <span className="badge-offline" style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>ISOLATED MANUAL</span>;
      default:
        return null;
    }
  };

  return (
    <aside className="glass-panel glass-panel-glow" style={{
      width: '350px',
      height: 'calc(100vh - 100px)',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      gap: '14px',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            {getTypeIcon(node.type)}
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
              {node.type} // {node.sub_type}
            </span>
            {node.critical && (
              <span style={{
                background: 'rgba(255, 51, 102, 0.2)',
                color: 'var(--accent-red)',
                border: '1px solid rgba(255, 51, 102, 0.4)',
                borderRadius: '3px',
                fontSize: '9px',
                fontWeight: 700,
                padding: '1px 5px',
              }}>
                MISSION CRITICAL
              </span>
            )}
          </div>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
            {node.name}
          </h2>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            padding: '4px',
            borderRadius: '4px',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Live Status Callout */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.35)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '6px',
        padding: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
          ACTIVE STATE
        </span>
        {getStatusBadge(currentStatus)}
      </div>

      {/* Description */}
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {node.description}
      </p>

      {/* Action Toggle Button */}
      <button
        onClick={() => onToggleNode(node.id)}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '6px',
          fontWeight: 700,
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: isManuallyDisabled
            ? 'linear-gradient(135deg, rgba(6, 214, 160, 0.25), rgba(0, 240, 255, 0.25))'
            : 'linear-gradient(135deg, rgba(255, 51, 102, 0.3), rgba(255, 183, 3, 0.2))',
          border: isManuallyDisabled ? '1px solid var(--accent-emerald)' : '1px solid var(--accent-red)',
          color: '#fff',
          boxShadow: isManuallyDisabled ? '0 0 15px rgba(6, 214, 160, 0.2)' : '0 0 15px rgba(255, 51, 102, 0.2)',
        }}
      >
        <AlertTriangle size={15} />
        <span>{isManuallyDisabled ? 'RESTORE COMPONENT FEED' : 'MANUALLY SEVER / ISOLATE'}</span>
      </button>

      {/* Dependency Rules */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.25)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '6px',
        padding: '10px',
      }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
          DEPENDENCY CRITERIA
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Min Power: <strong style={{ color: '#fff' }}>{node.rules.min_power_sources}</strong>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Min Network: <strong style={{ color: '#fff' }}>{node.rules.min_network_sources}</strong>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Service Interlocks: <strong style={{ color: '#fff' }}>{node.rules.min_service_sources}</strong>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Failover Backup: <strong style={{ color: node.rules.allows_backup ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
              {node.rules.allows_backup ? 'ENABLED' : 'NONE'}
            </strong>
          </div>
        </div>
      </div>

      {/* Upstream Dependencies (Providers) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <ArrowUpRight size={13} color="var(--accent-cyan)" />
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
            UPSTREAM DEPENDENCIES ({upstreamNodes.length})
          </span>
        </div>
        {upstreamNodes.length === 0 ? (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Autonomous root provider.</span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {upstreamNodes.map(({ edge, node: prov }) => {
              const status = nodeStatuses[prov.id] || 'OPERATIONAL';
              return (
                <div
                  key={prov.id}
                  onClick={() => onSelectRelatedNode(prov.id)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {edge.is_backup && (
                      <span style={{ fontSize: '8px', color: 'var(--accent-amber)', border: '1px solid var(--accent-amber)', padding: '1px 3px', borderRadius: '2px' }}>
                        BACKUP
                      </span>
                    )}
                    <span style={{ fontSize: '11px', color: '#fff' }}>{prov.name}</span>
                  </div>
                  {getStatusBadge(status)}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Downstream Blast Radius (Dependents) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <ArrowDownRight size={13} color="var(--accent-red)" />
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
            DEPENDENT BLAST RADIUS ({downstreamNodes.length})
          </span>
        </div>
        {downstreamNodes.length === 0 ? (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Terminal node (no dependents).</span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {downstreamNodes.map(({ edge, node: dep }) => {
              const status = nodeStatuses[dep.id] || 'OPERATIONAL';
              return (
                <div
                  key={dep.id}
                  onClick={() => onSelectRelatedNode(dep.id)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {edge.is_backup && (
                      <span style={{ fontSize: '8px', color: 'var(--accent-amber)', border: '1px solid var(--accent-amber)', padding: '1px 3px', borderRadius: '2px' }}>
                        BACKUP
                      </span>
                    )}
                    <span style={{ fontSize: '11px', color: '#fff' }}>{dep.name}</span>
                  </div>
                  {getStatusBadge(status)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
