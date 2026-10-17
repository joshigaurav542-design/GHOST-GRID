import React, { useState } from 'react';
import {
  ShieldAlert,
  Building,
  Server,
  Activity,
  History,
  AlertOctagon,
} from 'lucide-react';
import type { CascadeStep, ImpactMetrics } from '../../types';

interface ImpactPanelProps {
  metrics: ImpactMetrics | null;
  cascadeTimeline: CascadeStep[];
  onSelectNode: (nodeId: string) => void;
  selectedNodeId: string | null;
}

export const ImpactPanel: React.FC<ImpactPanelProps> = ({
  metrics,
  cascadeTimeline,
  onSelectNode,
  selectedNodeId,
}) => {
  const [activeTab, setActiveTab] = useState<'METRICS' | 'TIMELINE'>('METRICS');

  if (!metrics) {
    return (
      <div className="glass-panel" style={{ width: '320px', padding: '16px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Awaiting telemetry...</span>
      </div>
    );
  }

  return (
    <aside className="glass-panel" style={{
      width: '340px',
      height: 'calc(100vh - 100px)',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      gap: '14px',
      overflow: 'hidden',
    }}>
      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '6px',
        padding: '3px',
        border: '1px solid var(--border-subtle)',
      }}>
        <button
          onClick={() => setActiveTab('METRICS')}
          style={{
            flex: 1,
            padding: '6px',
            borderRadius: '4px',
            border: 'none',
            fontSize: '11px',
            fontWeight: 700,
            background: activeTab === 'METRICS' ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
            color: activeTab === 'METRICS' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Activity size={13} />
          <span>CAMPUS IMPACT</span>
        </button>
        <button
          onClick={() => setActiveTab('TIMELINE')}
          style={{
            flex: 1,
            padding: '6px',
            borderRadius: '4px',
            border: 'none',
            fontSize: '11px',
            fontWeight: 700,
            background: activeTab === 'TIMELINE' ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
            color: activeTab === 'TIMELINE' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <History size={13} />
          <span>CASCADE LOG ({cascadeTimeline.length})</span>
        </button>
      </div>

      {activeTab === 'METRICS' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', paddingRight: '4px' }}>
          {/* Top Status Counters Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{
              background: 'rgba(6, 214, 160, 0.08)',
              border: '1px solid rgba(6, 214, 160, 0.25)',
              borderRadius: '6px',
              padding: '10px',
            }}>
              <div style={{ fontSize: '10px', color: 'var(--accent-emerald)', fontWeight: 600 }}>OPERATIONAL</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginTop: '2px', fontFamily: 'monospace' }}>
                {metrics.operational_count} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ {metrics.total_components}</span>
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 183, 3, 0.08)',
              border: '1px solid rgba(255, 183, 3, 0.25)',
              borderRadius: '6px',
              padding: '10px',
            }}>
              <div style={{ fontSize: '10px', color: 'var(--accent-amber)', fontWeight: 600 }}>BACKUP ACTIVE</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginTop: '2px', fontFamily: 'monospace' }}>
                {metrics.backup_active_count}
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 51, 102, 0.08)',
              border: '1px solid rgba(255, 51, 102, 0.25)',
              borderRadius: '6px',
              padding: '10px',
            }}>
              <div style={{ fontSize: '10px', color: 'var(--accent-red)', fontWeight: 600 }}>FAILED / DOWN</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginTop: '2px', fontFamily: 'monospace' }}>
                {metrics.failed_count}
              </div>
            </div>

            <div style={{
              background: 'rgba(139, 155, 180, 0.08)',
              border: '1px solid rgba(139, 155, 180, 0.25)',
              borderRadius: '6px',
              padding: '10px',
            }}>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>ISOLATED MANUAL</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginTop: '2px', fontFamily: 'monospace' }}>
                {metrics.offline_manual_count}
              </div>
            </div>
          </div>

          {/* Critical Assets Compromised */}
          <div style={{
            background: metrics.critical_components_compromised.length > 0 ? 'rgba(255, 51, 102, 0.06)' : 'rgba(0, 0, 0, 0.2)',
            border: metrics.critical_components_compromised.length > 0 ? '1px solid rgba(255, 51, 102, 0.35)' : '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <ShieldAlert size={14} color={metrics.critical_components_compromised.length > 0 ? 'var(--accent-red)' : 'var(--accent-emerald)'} />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>
                CRITICAL ASSETS STATUS
              </span>
            </div>
            {metrics.critical_components_compromised.length === 0 ? (
              <span style={{ fontSize: '12px', color: 'var(--accent-emerald)' }}>
                ✓ All high-priority life safety & security systems nominal.
              </span>
            ) : (
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {metrics.critical_components_compromised.map((name) => (
                  <li key={name} style={{
                    fontSize: '11px',
                    color: 'var(--accent-red)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <AlertOctagon size={12} />
                    <span>{name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Affected Buildings */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Building size={14} color="var(--accent-cyan)" />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>
                AFFECTED BUILDINGS ({metrics.affected_buildings.length})
              </span>
            </div>
            {metrics.affected_buildings.length === 0 ? (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                No campus facilities compromised.
              </span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {metrics.affected_buildings.map((b) => (
                  <div key={b} style={{
                    fontSize: '11px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: 'rgba(255, 51, 102, 0.1)',
                    borderLeft: '2px solid var(--accent-red)',
                    color: '#fff',
                  }}>
                    {b}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unavailable Services */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Server size={14} color="var(--accent-purple)" />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>
                DISRUPTED SERVICES ({metrics.unavailable_services.length})
              </span>
            </div>
            {metrics.unavailable_services.length === 0 ? (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                All software services online.
              </span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {metrics.unavailable_services.map((s) => (
                  <div key={s} style={{
                    fontSize: '11px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: 'rgba(181, 23, 158, 0.12)',
                    borderLeft: '2px solid var(--accent-purple)',
                    color: '#fff',
                  }}>
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Timeline Feed */
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          overflowY: 'auto',
          paddingRight: '4px',
          flex: 1,
        }}>
          {cascadeTimeline.length === 0 ? (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>
              Grid is in nominal steady state. Disable a node to witness cascading propagation.
            </span>
          ) : (
            cascadeTimeline.map((step) => {
              const isSelected = selectedNodeId === step.node_id;
              const isFail = step.new_status === 'FAILED';
              const isBackup = step.new_status === 'BACKUP_ACTIVE';

              return (
                <div
                  key={`${step.step_number}-${step.node_id}`}
                  onClick={() => onSelectNode(step.node_id)}
                  style={{
                    background: isSelected ? 'rgba(0, 240, 255, 0.12)' : 'rgba(0, 0, 0, 0.25)',
                    border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '9px',
                        fontFamily: 'monospace',
                        color: 'var(--accent-cyan)',
                        background: 'rgba(0, 240, 255, 0.1)',
                        padding: '2px 4px',
                        borderRadius: '3px',
                      }}>
                        STEP #{step.step_number}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#fff' }}>
                        {step.node_name}
                      </span>
                    </div>

                    <span style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '3px',
                      color: isFail ? 'var(--accent-red)' : isBackup ? 'var(--accent-amber)' : 'var(--text-secondary)',
                      background: isFail ? 'rgba(255, 51, 102, 0.15)' : isBackup ? 'rgba(255, 183, 3, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    }}>
                      {step.new_status}
                    </span>
                  </div>

                  <p style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {step.reason}
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}
    </aside>
  );
};
