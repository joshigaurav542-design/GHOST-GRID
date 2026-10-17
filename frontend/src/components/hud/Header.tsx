import React from 'react';
import {
  Activity,
  AlertTriangle,
  RotateCcw,
  Layers,
  Box,
  Flame,
  ShieldAlert,
  ZapOff,
} from 'lucide-react';
import type { ScenarioPreset } from '../../types';

interface HeaderProps {
  healthPercentage: number;
  scenarios: ScenarioPreset[];
  activeScenarioId: string | null;
  onApplyScenario: (id: string) => void;
  onReset: () => void;
  viewMode: '3D' | '2D';
  onToggleViewMode: (mode: '3D' | '2D') => void;
  isSimulating: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  healthPercentage,
  scenarios,
  activeScenarioId,
  onApplyScenario,
  onReset,
  viewMode,
  onToggleViewMode,
  isSimulating,
}) => {
  // Determine health color
  const getHealthColor = (health: number) => {
    if (health >= 85) return 'var(--accent-emerald)';
    if (health >= 50) return 'var(--accent-amber)';
    return 'var(--accent-red)';
  };

  const healthColor = getHealthColor(healthPercentage);

  const getScenarioIcon = (id: string) => {
    if (id.includes('grid')) return <ZapOff size={14} />;
    if (id.includes('cyber')) return <ShieldAlert size={14} />;
    return <Flame size={14} />;
  };

  return (
    <header className="glass-panel" style={{
      margin: '12px 16px',
      padding: '10px 18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative',
      zIndex: 20,
    }}>
      {/* Brand & Simulation Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          background: 'rgba(0, 240, 255, 0.1)',
          border: '1px solid var(--accent-cyan)',
          borderRadius: '6px',
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 0 12px rgba(0, 240, 255, 0.2)'
        }}>
          <Activity size={18} color="var(--accent-cyan)" />
          <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '1px', color: '#fff' }}>
            GHOST GRID
          </span>
          <span style={{ fontSize: '10px', color: 'var(--accent-cyan)', opacity: 0.8, letterSpacing: '0.5px' }}>
            v1.0.4
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255, 183, 3, 0.1)',
          border: '1px solid rgba(255, 183, 3, 0.3)',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '11px',
          color: 'var(--accent-amber)',
          fontWeight: 500,
        }}>
          <AlertTriangle size={12} />
          <span>SYNTHETIC FICTIONAL CAMPUS MODEL — DEMO ONLY</span>
        </div>
      </div>

      {/* Preset Scenarios Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>
          PRESETS:
        </span>
        {scenarios.map((s) => {
          const isActive = activeScenarioId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onApplyScenario(s.id)}
              disabled={isSimulating}
              title={s.description}
              style={{
                background: isActive ? 'rgba(255, 51, 102, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: isActive ? '1px solid var(--accent-red)' : '1px solid var(--border-subtle)',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {getScenarioIcon(s.id)}
              <span>{s.title.split(' ')[0]} {s.title.split(' ')[1]}</span>
            </button>
          );
        })}

        {/* Reset Button */}
        <button
          onClick={onReset}
          disabled={isSimulating}
          style={{
            background: 'rgba(0, 240, 255, 0.08)',
            border: '1px solid rgba(0, 240, 255, 0.35)',
            color: 'var(--accent-cyan)',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginLeft: '4px',
          }}
        >
          <RotateCcw size={13} />
          <span>RESTORE NOMINAL</span>
        </button>
      </div>

      {/* Health Meter & View Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Health meter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>
              GRID HEALTH
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: healthColor, fontFamily: 'monospace' }}>
              {healthPercentage.toFixed(1)}%
            </div>
          </div>
          <div style={{
            width: '60px',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '3px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${Math.max(0, Math.min(100, healthPercentage))}%`,
              height: '100%',
              background: healthColor,
              boxShadow: `0 0 8px ${healthColor}`,
              transition: 'all 0.4s ease',
            }} />
          </div>
        </div>

        {/* View Mode Toggle: 3D Campus vs 2D Graph */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px',
          padding: '2px',
        }}>
          <button
            onClick={() => onToggleViewMode('3D')}
            style={{
              background: viewMode === '3D' ? 'var(--accent-cyan)' : 'transparent',
              color: viewMode === '3D' ? '#000' : 'var(--text-secondary)',
              border: 'none',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Box size={13} />
            <span>3D CAMPUS</span>
          </button>
          <button
            onClick={() => onToggleViewMode('2D')}
            style={{
              background: viewMode === '2D' ? 'var(--accent-cyan)' : 'transparent',
              color: viewMode === '2D' ? '#000' : 'var(--text-secondary)',
              border: 'none',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Layers size={13} />
            <span>2D GRAPH</span>
          </button>
        </div>
      </div>
    </header>
  );
};
