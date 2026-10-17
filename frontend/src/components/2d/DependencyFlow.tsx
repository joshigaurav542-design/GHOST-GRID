import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
} from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type {
  CampusGraphData,
  ComponentStatus,
  InfrastructureNode,
} from '../../types';

interface DependencyFlowProps {
  graphData: CampusGraphData | null;
  nodeStatuses: Record<string, ComponentStatus>;
  activeEdgeIds: string[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}

export const DependencyFlow: React.FC<DependencyFlowProps> = ({
  graphData,
  nodeStatuses,
  activeEdgeIds,
  selectedNodeId,
  onSelectNode,
}) => {
  if (!graphData) return null;

  // Compute lane-based 2D coordinates for clear topological readability
  const { flowNodes, flowEdges } = useMemo(() => {
    // Categorize nodes into infrastructure hierarchy tiers
    const getTier = (n: InfrastructureNode) => {
      if (n.type === 'POWER' && (n.id.includes('grid') || n.id.includes('solar') || n.id.includes('generator'))) return 0;
      if (n.type === 'POWER' || n.id.includes('uplink') || n.id.includes('satellite')) return 1;
      if (n.type === 'NETWORK' && n.id.includes('core')) return 2;
      if (n.type === 'NETWORK' || n.id === 'bldg_datacenter') return 3;
      if (n.type === 'SERVICE') return 4;
      return 5; // Physical Campus Buildings
    };

    const tierGroups: Record<number, InfrastructureNode[]> = {
      0: [], 1: [], 2: [], 3: [], 4: [], 5: [],
    };

    graphData.nodes.forEach((n) => {
      const tier = getTier(n);
      tierGroups[tier].push(n);
    });

    const nodes: Node[] = [];
    Object.entries(tierGroups).forEach(([tierStr, group]) => {
      const tier = parseInt(tierStr, 10);
      const tierX = tier * 280 + 60;
      const totalInTier = group.length;

      group.forEach((node, index) => {
        const tierY = (index - (totalInTier - 1) / 2) * 110 + 350;
        const status = nodeStatuses[node.id] || 'OPERATIONAL';
        const isSelected = selectedNodeId === node.id;

        let statusBorder = '#00f0ff';
        let statusBg = 'rgba(14, 22, 36, 0.9)';
        if (status === 'FAILED') {
          statusBorder = '#ff3366';
          statusBg = 'rgba(40, 10, 20, 0.95)';
        } else if (status === 'BACKUP_ACTIVE') {
          statusBorder = '#ffb703';
          statusBg = 'rgba(38, 28, 8, 0.95)';
        } else if (status === 'OFFLINE_MANUAL') {
          statusBorder = '#8b9bb4';
          statusBg = 'rgba(25, 30, 40, 0.95)';
        }

        nodes.push({
          id: node.id,
          position: { x: tierX, y: tierY },
          data: {
            label: (
              <div style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1.5px solid ${isSelected ? '#fff' : statusBorder}`,
                background: statusBg,
                color: '#fff',
                minWidth: '180px',
                boxShadow: isSelected ? `0 0 16px ${statusBorder}` : 'none',
                cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontSize: '9px', color: statusBorder, fontWeight: 700 }}>
                    {node.type}
                  </span>
                  <span style={{ fontSize: '8px', color: '#8b9bb4', fontFamily: 'monospace' }}>
                    {status}
                  </span>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {node.name}
                </div>
              </div>
            ),
          },
        });
      });
    });

    const edges: Edge[] = graphData.edges.map((edge) => {
      const isActive = activeEdgeIds.includes(edge.id);
      const targetStatus = nodeStatuses[edge.target] || 'OPERATIONAL';

      let edgeColor = isActive ? '#00f0ff' : '#2c394b';
      if (isActive && (edge.is_backup || targetStatus === 'BACKUP_ACTIVE')) {
        edgeColor = '#ffb703';
      } else if (isActive && edge.edge_type === 'NETWORK') {
        edgeColor = '#9d4edd';
      } else if (isActive && edge.edge_type === 'SERVICE_DEPENDENCY') {
        edgeColor = '#06d6a0';
      }

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: isActive,
        style: {
          stroke: edgeColor,
          strokeWidth: isActive ? 2 : 1,
          strokeDasharray: edge.is_backup || !isActive ? '4,4' : undefined,
          opacity: isActive ? 0.9 : 0.25,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
          width: 14,
          height: 14,
        },
      };
    });

    return { flowNodes: nodes, flowEdges: edges };
  }, [graphData, nodeStatuses, activeEdgeIds, selectedNodeId]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#05080d' }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
      >
        <Background color="#121e2f" gap={24} />
        <Controls style={{ background: 'rgba(14, 21, 33, 0.8)', border: '1px solid var(--border-subtle)', fill: '#fff' }} />
        <MiniMap
          nodeColor="#00f0ff"
          maskColor="rgba(5, 8, 13, 0.7)"
          style={{ background: '#080d15', border: '1px solid var(--border-subtle)' }}
        />
      </ReactFlow>
    </div>
  );
};
