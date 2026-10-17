import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, useTexture, Sparkles } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import type {
  CampusGraphData,
  ComponentStatus,
  InfrastructureEdge,
  InfrastructureNode,
} from '../../types';

interface CampusCanvasProps {
  graphData: CampusGraphData | null;
  nodeStatuses: Record<string, ComponentStatus>;
  activeEdgeIds: string[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}

interface TexturesRecord {
  groundGreen: THREE.Texture;
  brickBuilding: THREE.Texture;
  glassBuilding: THREE.Texture;
  clinicBuilding: THREE.Texture;
  datacenter: THREE.Texture;
  solar: THREE.Texture;
}

// WASD & Arrow Key Navigation Component
const WASDNavigator: React.FC<{
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}> = ({ controlsRef }) => {
  const { camera } = useThree();
  const keys = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (['input', 'textarea'].includes(tag)) return;
      keys.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const speed = (keys.current['shift'] ? 30 : 15) * delta;

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const moveVector = new THREE.Vector3(0, 0, 0);

    if (keys.current['w'] || keys.current['arrowup']) moveVector.add(forward);
    if (keys.current['s'] || keys.current['arrowdown']) moveVector.sub(forward);
    if (keys.current['d'] || keys.current['arrowright']) moveVector.add(right);
    if (keys.current['a'] || keys.current['arrowleft']) moveVector.sub(right);

    if (moveVector.lengthSq() > 0) {
      moveVector.normalize().multiplyScalar(speed);
      camera.position.add(moveVector);
      controls.target.add(moveVector);
    }
  });

  return null;
};

// 3D Conduit connecting two infrastructure nodes
const Conduit: React.FC<{
  edge: InfrastructureEdge;
  sourceNode: InfrastructureNode;
  targetNode: InfrastructureNode;
  isActive: boolean;
  targetStatus: ComponentStatus;
}> = ({ edge, sourceNode, targetNode, isActive, targetStatus }) => {
  const curve = useMemo(() => {
    const p1 = new THREE.Vector3(sourceNode.position.x, 0.45, sourceNode.position.z);
    const p2 = new THREE.Vector3(targetNode.position.x, 0.45, targetNode.position.z);
    
    const distance = p1.distanceTo(p2);
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    mid.y += Math.min(2.5, Math.max(0.7, distance * 0.18));

    return new THREE.QuadraticBezierCurve3(p1, mid, p2);
  }, [sourceNode, targetNode]);

  const conduitColor = useMemo(() => {
    if (!isActive) return '#1b2330';
    if (edge.is_backup || targetStatus === 'BACKUP_ACTIVE') return '#ffb703';
    if (edge.edge_type === 'POWER') return '#00f0ff';
    if (edge.edge_type === 'NETWORK') return '#a855f7';
    return '#06d6a0';
  }, [isActive, edge, targetStatus]);

  const tubeGeo = useMemo(() => {
    return new THREE.TubeGeometry(curve, 32, edge.is_backup ? 0.055 : 0.075, 8, false);
  }, [curve, edge.is_backup]);

  return (
    <mesh geometry={tubeGeo}>
      <meshStandardMaterial
        color={conduitColor}
        emissive={conduitColor}
        emissiveIntensity={isActive ? (edge.is_backup ? 1.2 : 0.9) : 0.04}
        transparent
        opacity={isActive ? 0.95 : 0.22}
        roughness={0.2}
      />
    </mesh>
  );
};

// 3D Textured Campus Node (Building, Substation, Server Rack, Generator)
const CampusNodeMesh: React.FC<{
  node: InfrastructureNode;
  status: ComponentStatus;
  isSelected: boolean;
  onSelect: () => void;
  textures: TexturesRecord;
}> = ({ node, status, isSelected, onSelect, textures }) => {
  const meshRef = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.PointLight>(null);
  const [hovered, setHovered] = React.useState(false);

  const statusColor = useMemo(() => {
    switch (status) {
      case 'OPERATIONAL': return '#00f0ff';
      case 'BACKUP_ACTIVE': return '#ffb703';
      case 'FAILED': return '#ff3366';
      case 'OFFLINE_MANUAL': return '#8b9bb4';
      default: return '#00f0ff';
    }
  }, [status]);

  useFrame((state) => {
    if (meshRef.current && (status === 'FAILED' || isSelected)) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.08;
    } else if (meshRef.current) {
      meshRef.current.position.y = 0;
    }

    if (beaconRef.current && status === 'FAILED') {
      beaconRef.current.intensity = 1.8 + Math.sin(state.clock.elapsedTime * 8) * 1.8;
    }
  });

  const { width, height, depth } = useMemo(() => {
    if (node.type === 'BUILDING') {
      if (node.id === 'bldg_datacenter') return { width: 2.6, height: 2.2, depth: 2.6 };
      if (node.id === 'bldg_admin_tower') return { width: 2.0, height: 3.8, depth: 2.0 };
      if (node.id === 'bldg_science_complex') return { width: 3.4, height: 2.0, depth: 2.4 };
      if (node.id === 'bldg_medical_clinic') return { width: 2.4, height: 1.6, depth: 2.4 };
      if (node.id === 'bldg_library') return { width: 2.6, height: 1.8, depth: 2.6 };
      return { width: 2.6, height: 1.7, depth: 2.2 };
    }
    if (node.type === 'POWER') {
      if (node.id.includes('solar')) return { width: 3.2, height: 0.5, depth: 2.6 };
      if (node.id.includes('diesel') || node.id.includes('generator')) return { width: 1.5, height: 1.1, depth: 1.3 };
      return { width: 2.0, height: 1.3, depth: 1.8 };
    }
    if (node.type === 'NETWORK') {
      return { width: 1.3, height: 1.7, depth: 1.3 };
    }
    return { width: 1.1, height: 1.5, depth: 1.1 };
  }, [node]);

  // Distinct texture assignment based on building function
  const blockTexture = useMemo(() => {
    if (node.id.includes('solar')) return textures.solar;
    if (node.id === 'bldg_medical_clinic') return textures.clinicBuilding;
    if (node.id === 'bldg_science_complex') return textures.glassBuilding;
    if (node.id === 'bldg_admin_tower' || node.id === 'bldg_library' || node.id === 'bldg_residence_quad') {
      return textures.brickBuilding;
    }
    if (node.id === 'bldg_datacenter' || node.type === 'SERVICE') {
      return textures.datacenter;
    }
    // Substations / network hubs / generators
    return textures.datacenter;
  }, [node, textures]);

  return (
    <group
      ref={meshRef}
      position={[node.position.x, 0, node.position.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Concrete Paving Foundation Pad around building */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width + 0.6, depth + 0.6]} />
        <meshStandardMaterial color="#3a424e" roughness={0.8} />
      </mesh>

      {/* Ground Projection Halo Ring */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.85 * Math.max(width, depth), 1.1 * Math.max(width, depth), 32]} />
        <meshBasicMaterial
          color={statusColor}
          transparent
          opacity={isSelected ? 0.95 : hovered ? 0.7 : 0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Main Architectural Textured Block */}
      <mesh position={[0, height / 2 + 0.05, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          map={blockTexture}
          roughness={0.4}
          metalness={0.15}
          color="#ffffff"
          emissive={statusColor}
          emissiveIntensity={status === 'FAILED' ? 0.35 : status === 'BACKUP_ACTIVE' ? 0.2 : 0.04}
        />
      </mesh>

      {/* Rooftop Parapet / Dark Slate Top */}
      <mesh position={[0, height + 0.08, 0]}>
        <boxGeometry args={[width * 0.92, 0.1, depth * 0.92]} />
        <meshStandardMaterial color="#1e2530" roughness={0.9} />
      </mesh>

      {/* Rooftop Mechanical / HVAC Unit on Buildings */}
      {node.type === 'BUILDING' && (
        <mesh position={[0.2, height + 0.25, -0.2]}>
          <boxGeometry args={[width * 0.35, 0.25, depth * 0.35]} />
          <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.6} />
        </mesh>
      )}

      {/* Glowing Status Fin / Crown Bar */}
      <mesh position={[0, height + 0.15, 0]}>
        <boxGeometry args={[width * 0.98, 0.06, depth * 0.98]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={status === 'FAILED' ? 1.5 : 0.8}
          roughness={0.1}
        />
      </mesh>

      {/* Rooftop Emergency Light Beacon if Failed */}
      {status === 'FAILED' && (
        <pointLight
          ref={beaconRef}
          position={[0, height + 0.6, 0]}
          color="#ff3366"
          distance={10}
          intensity={3.0}
        />
      )}

      {/* Floating Hover Label */}
      {(hovered || isSelected) && (
        <Html position={[0, height + 1.1, 0]} center distanceFactor={14}>
          <div style={{
            background: 'rgba(8, 12, 18, 0.95)',
            border: `1.5px solid ${statusColor}`,
            padding: '6px 12px',
            borderRadius: '6px',
            boxShadow: `0 0 18px ${statusColor}`,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
              {node.name}
            </div>
            <div style={{ fontSize: '10px', color: statusColor, fontWeight: 600, marginTop: '2px' }}>
              ● {status} // {node.sub_type}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// Scene Content with Texture Loading and Environment
const SceneContent: React.FC<{
  graphData: CampusGraphData;
  nodeStatuses: Record<string, ComponentStatus>;
  activeEdgeIds: string[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}> = ({
  graphData,
  nodeStatuses,
  activeEdgeIds,
  selectedNodeId,
  onSelectNode,
  controlsRef,
}) => {
  // Load campus textures: green ground, collegiate brick, glass laboratory, hospital clinic, server racks, solar
  const [
    groundGreenTex,
    brickBuildingTex,
    glassBuildingTex,
    clinicBuildingTex,
    datacenterTex,
    solarTex,
  ] = useTexture([
    '/textures/ground_green.jpg',
    '/textures/brick_building.jpg',
    '/textures/building.jpg',
    '/textures/clinic_building.jpg',
    '/textures/datacenter.jpg',
    '/textures/solar.jpg',
  ]);

  useMemo(() => {
    // Green campus lawn with stone walkways
    groundGreenTex.wrapS = THREE.RepeatWrapping;
    groundGreenTex.wrapT = THREE.RepeatWrapping;
    groundGreenTex.repeat.set(6, 6);

    brickBuildingTex.wrapS = THREE.RepeatWrapping;
    brickBuildingTex.wrapT = THREE.RepeatWrapping;
    brickBuildingTex.repeat.set(2, 2);

    glassBuildingTex.wrapS = THREE.RepeatWrapping;
    glassBuildingTex.wrapT = THREE.RepeatWrapping;
    glassBuildingTex.repeat.set(2, 2);

    clinicBuildingTex.wrapS = THREE.RepeatWrapping;
    clinicBuildingTex.wrapT = THREE.RepeatWrapping;
    clinicBuildingTex.repeat.set(2, 2);

    datacenterTex.wrapS = THREE.RepeatWrapping;
    datacenterTex.wrapT = THREE.RepeatWrapping;
    datacenterTex.repeat.set(2, 2);

    solarTex.wrapS = THREE.RepeatWrapping;
    solarTex.wrapT = THREE.RepeatWrapping;
    solarTex.repeat.set(3, 3);
  }, [
    groundGreenTex,
    brickBuildingTex,
    glassBuildingTex,
    clinicBuildingTex,
    datacenterTex,
    solarTex,
  ]);

  const textures: TexturesRecord = useMemo(() => ({
    groundGreen: groundGreenTex,
    brickBuilding: brickBuildingTex,
    glassBuilding: glassBuildingTex,
    clinicBuilding: clinicBuildingTex,
    datacenter: datacenterTex,
    solar: solarTex,
  }), [
    groundGreenTex,
    brickBuildingTex,
    glassBuildingTex,
    clinicBuildingTex,
    datacenterTex,
    solarTex,
  ]);

  return (
    <>
      {/* Bright, Vibrant Daylight Campus Lighting */}
      <ambientLight intensity={0.65} />
      <directionalLight position={[25, 35, 20]} intensity={1.8} color="#fffcf5" castShadow />
      <directionalLight position={[-25, 20, -25]} intensity={0.7} color="#dbeafe" />
      <pointLight position={[0, 16, 0]} intensity={1.0} color="#ffffff" distance={60} />

      {/* Floating Ambient Pollen & Atmosphere Particles */}
      <Sparkles
        count={80}
        scale={60}
        size={2.2}
        speed={0.25}
        color="#a7f3d0"
        opacity={0.45}
      />

      {/* Lush Green University Campus Ground with Walkways */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[110, 110]} />
        <meshStandardMaterial
          map={groundGreenTex}
          roughness={0.75}
          metalness={0.05}
        />
      </mesh>

      {/* Subtle outer campus perimeter boundary */}
      <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[44, 46, 64]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* Render 3D Conduits */}
      {graphData.edges.map((edge) => {
        const sourceNode = graphData.nodes.find((n) => n.id === edge.source);
        const targetNode = graphData.nodes.find((n) => n.id === edge.target);
        if (!sourceNode || !targetNode) return null;

        const isActive = activeEdgeIds.includes(edge.id);
        const targetStatus = nodeStatuses[targetNode.id] || 'OPERATIONAL';

        return (
          <Conduit
            key={edge.id}
            edge={edge}
            sourceNode={sourceNode}
            targetNode={targetNode}
            isActive={isActive}
            targetStatus={targetStatus}
          />
        );
      })}

      {/* Render 3D Campus Nodes */}
      {graphData.nodes.map((node) => {
        const status = nodeStatuses[node.id] || 'OPERATIONAL';
        const isSelected = selectedNodeId === node.id;

        return (
          <CampusNodeMesh
            key={node.id}
            node={node}
            status={status}
            isSelected={isSelected}
            onSelect={() => onSelectNode(node.id)}
            textures={textures}
          />
        );
      })}

      {/* Camera Orbit Controls */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={8}
        maxDistance={65}
        maxPolarAngle={Math.PI / 2.05}
      />

      {/* WASD Keyboard Navigator */}
      <WASDNavigator controlsRef={controlsRef} />
    </>
  );
};

export const CampusCanvas: React.FC<CampusCanvasProps> = ({
  graphData,
  nodeStatuses,
  activeEdgeIds,
  selectedNodeId,
  onSelectNode,
}) => {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  if (!graphData) return null;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Navigation HUD Overlay */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        background: 'rgba(8, 12, 18, 0.85)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '6px',
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '11px',
        fontWeight: 600,
        backdropFilter: 'blur(8px)',
        pointerEvents: 'none',
        zIndex: 10,
      }}>
        <span style={{
          background: 'rgba(0, 240, 255, 0.15)',
          color: 'var(--accent-cyan)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontFamily: 'monospace',
          border: '1px solid rgba(0, 240, 255, 0.4)',
        }}>
          WASD
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>Pan</span>
        <span style={{ color: 'var(--text-muted)' }}>•</span>
        <span style={{
          background: 'rgba(255, 255, 255, 0.1)',
          color: '#fff',
          padding: '2px 5px',
          borderRadius: '4px',
          fontFamily: 'monospace',
        }}>
          Shift
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>Sprint</span>
        <span style={{ color: 'var(--text-muted)' }}>•</span>
        <span style={{ color: 'var(--text-secondary)' }}>Click + Drag to Rotate</span>
      </div>

      <Canvas
        camera={{ position: [18, 22, 22], fov: 42 }}
        style={{ background: '#070b10' }}
      >
        <Suspense fallback={null}>
          <SceneContent
            graphData={graphData}
            nodeStatuses={nodeStatuses}
            activeEdgeIds={activeEdgeIds}
            selectedNodeId={selectedNodeId}
            onSelectNode={onSelectNode}
            controlsRef={controlsRef}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
