import React, { useMemo, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Text, Decal, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { CarConfig, BodyStyle } from '../types';

interface GarageDisplayProps {
  config: CarConfig;
}

// Map styles to a set of points for THREE.Shape
const getShapeForStyle = (style: BodyStyle) => {
  const shape = new THREE.Shape();
  // We'll define the side profile, then extrude it.
  // Origin is roughly bottom center. Let's make length roughly 10 units (representing 7 inches)
  // Height roughly 1.5 units, width roughly 2.5 units.

  // Coordinates mapping roughly from the SVG to 3D units:
  // SVG: width 250, height 40. Scale by ~1/25
  const s = 1 / 25;

  switch (style) {
    case 'wedge':
      shape.moveTo(30 * s, 0);
      shape.lineTo(280 * s, 0);
      shape.lineTo(280 * s, 40 * s);
      shape.lineTo(270 * s, 40 * s);
      shape.lineTo(30 * s, 5 * s);
      shape.quadraticCurveTo(20 * s, 4 * s, 30 * s, 0);
      break;
    case 'block':
      shape.moveTo(25 * s, 0);
      shape.lineTo(275 * s, 0);
      shape.quadraticCurveTo(280 * s, 0, 280 * s, 5 * s);
      shape.lineTo(280 * s, 35 * s);
      shape.quadraticCurveTo(280 * s, 40 * s, 275 * s, 40 * s);
      shape.lineTo(25 * s, 40 * s);
      shape.quadraticCurveTo(20 * s, 40 * s, 20 * s, 35 * s);
      shape.lineTo(20 * s, 5 * s);
      shape.quadraticCurveTo(20 * s, 0, 25 * s, 0);
      break;
    case 'bullet':
      shape.moveTo(40 * s, 0);
      shape.lineTo(280 * s, 0);
      shape.lineTo(280 * s, 40 * s);
      shape.lineTo(270 * s, 40 * s);
      shape.quadraticCurveTo(150 * s, 40 * s, 40 * s, 10 * s);
      shape.quadraticCurveTo(30 * s, 5 * s, 40 * s, 0);
      break;
    case 'shark':
      shape.moveTo(30 * s, 0);
      shape.lineTo(280 * s, 0);
      shape.lineTo(280 * s, 35 * s);
      shape.lineTo(160 * s, 35 * s);
      shape.lineTo(120 * s, 55 * s); // Fin
      shape.lineTo(100 * s, 35 * s);
      shape.lineTo(30 * s, 5 * s);
      shape.quadraticCurveTo(20 * s, 4 * s, 30 * s, 0);
      break;
    default:
      shape.moveTo(30 * s, 0);
      shape.lineTo(280 * s, 0);
      shape.lineTo(280 * s, 40 * s);
      shape.lineTo(30 * s, 0);
      break;
  }
  return shape;
};

// Sticker component to render emojis as 3D textures on a Decal
const StickerDecal = ({ type, position, rotation, scale = 1 }: { type: string, position: [number, number, number], rotation: [number, number, number], scale?: number }) => {
  const [texture, setTexture] = React.useState<THREE.CanvasTexture | null>(null);

  React.useEffect(() => {
    let content = '⭐';
    if (type === 'flames') content = '🔥';
    if (type === 'lightning') content = '⚡';
    if (type === 'star') content = '⭐';
    if (type === 'skull') content = '💀';
    if (type === 'flag') content = '🏁';
    if (type === 'number') content = '1️⃣';

    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.font = '96px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(content, 64, 64 + 8); // +8 for slight baseline offset
    }

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    setTexture(tex);

    // Cleanup texture memory when sticker is removed or changed
    return () => {
      tex.dispose();
    }
  }, [type]);

  if (!texture) return null;

  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
    >
      <planeGeometry args={[1.5, 1.5]} />
      <meshBasicMaterial
        map={texture}
        transparent={true}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

const Wheel = ({ position }: { position: [number, number, number] }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Slowly rotate wheel to give a bit of life
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * -1;
    }
  });

  return (
    <mesh position={position} ref={meshRef} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.5, 0.5, 0.2, 32]} />
      {/* Tire black */}
      <meshStandardMaterial color="#111" roughness={0.8} />
      {/* Simple Rim */}
      <mesh position={[0, 0.11, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.01, 16]} />
        <meshStandardMaterial color="#ccc" metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.11, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.01, 16]} />
        <meshStandardMaterial color="#ccc" metalness={0.6} roughness={0.2} />
      </mesh>
    </mesh>
  );
};

import { useThree } from '@react-three/fiber';

const CarModel = ({ config, setIsDragging }: { config: CarConfig, setIsDragging: (v: boolean) => void }) => {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const { controls } = useThree();

  // Track sticker positions and orientations
  const [stickers, setStickers] = React.useState<{
    id: string;
    type: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: number;
  }[]>([]);

  // Initialize or update stickers when config changes
  React.useEffect(() => {
    setStickers((prevStickers) => {
      const s = 1 / 25;
      return config.stickers.map((type, i) => {
        const id = `sticker-${i}`;
        // Preserve existing manually placed sticker if it exists
        const existing = prevStickers.find(s => s.id === id && s.type === type);
        if (existing) {
          return existing;
        }

        // Otherwise generate a new one at default position
        const xPos = (80 + (i * 60) % 180) * s;
        const yPos = 20 * s;
        const scale = Math.random() * 0.4 + 0.8;

        return {
          id,
          type,
          position: [xPos, yPos, 1.8] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          scale
        };
      });
    });
  }, [config.stickers]);

  // Dragging state
  const [activeStickerId, setActiveStickerId] = React.useState<string | null>(null);

  // Slight floating animation
  useFrame((state) => {
    if (groupRef.current && !activeStickerId) {
      // Only float if not currently dragging, makes it easier to place
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  const extrudeSettings = useMemo(() => {
    return {
      steps: 2,
      depth: 1.8, // width of the car
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.05,
      bevelOffset: 0,
      bevelSegments: 3
    };
  }, []);

  const shape = useMemo(() => getShapeForStyle(config.bodyStyle), [config.bodyStyle]);

  // Pointer Events for Dragging
  const handlePointerDown = (e: any, id: string) => {
    e.stopPropagation();
    setActiveStickerId(id);
    setIsDragging(true);
    // Disable orbit controls while dragging a sticker
    if (controls) (controls as any).enabled = false;

    // Set pointer capture to ensure smooth dragging even if mouse leaves mesh briefly
    if (e.target) e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: any) => {
    if (!activeStickerId) return;
    e.stopPropagation();

    // Event contains the intersection point and face normal
    if (e.point && e.face) {
      // e.point is in world space, convert to local space of the mesh
      const localPoint = bodyRef.current!.worldToLocal(e.point.clone());

      // We also need to calculate the proper rotation based on the face normal
      // A Decal projects along the Z axis of its transform.
      const n = e.face.normal.clone();

      // Calculate rotation. We want the Decal's local Z axis to match the face normal
      // and its local Y axis to point 'up' (positive Y in world space mapping).
      // If the normal is pointing straight up (e.g. the flat top of the car block), 
      // the Y-up vector becomes parallel to the normal and lookAt fails (Gimbal Lock).
      const up = Math.abs(n.y) > 0.99 ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 1, 0);

      const target = new THREE.Vector3().addVectors(localPoint, n);
      const matrix = new THREE.Matrix4().lookAt(target, localPoint, up);
      const euler = new THREE.Euler().setFromRotationMatrix(matrix);

      // Offset position slightly along normal to prevent Z-fighting
      const offsetPoint = localPoint.clone().add(n.clone().multiplyScalar(0.02));

      setStickers(prev => prev.map(s => {
        if (s.id === activeStickerId) {
          return {
            ...s,
            position: [offsetPoint.x, offsetPoint.y, offsetPoint.z],
            rotation: [euler.x, euler.y, euler.z]
          };
        }
        return s;
      }));
    }
  };

  const handlePointerUp = (e: any) => {
    if (activeStickerId) {
      e.stopPropagation();
      setActiveStickerId(null);
      setIsDragging(false);
      // Re-enable orbit controls
      if (controls) (controls as any).enabled = true;
      if (e.target && e.target.hasPointerCapture(e.pointerId)) {
        e.target.releasePointerCapture(e.pointerId);
      }
    }
  };

  return (
    <group ref={groupRef} position={[-5, 0.5, -0.9]}>
      {/* Car Body */}
      <mesh
        ref={bodyRef}
        castShadow
        receiveShadow
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOut={handlePointerUp} // Safety catch if mouse leaves entirely
      >
        <extrudeGeometry
          args={[shape, extrudeSettings]}
          onUpdate={(self) => {
            self.computeVertexNormals();
            self.computeBoundingBox();
            self.computeBoundingSphere();
          }}
        />
        <meshPhysicalMaterial
          color={config.color}
          roughness={0.3}
          metalness={0.1}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
        />

        {/* Stickers mapped onto the body */}
        {stickers.map((sticker) => (
          <group
            key={sticker.id}
            // We wrap Decal in a group to catch pointer events easily
            // since Decal modifies the geometry deeply
            onPointerDown={(e) => handlePointerDown(e, sticker.id)}
          >
            <StickerDecal
              type={sticker.type}
              position={sticker.position}
              rotation={sticker.rotation}
              scale={sticker.scale * (activeStickerId === sticker.id ? 1.2 : 1.0)} // enlarge slightly when dragging
            />
          </group>
        ))}
      </mesh>

      {/* Wheels */}
      {/* Extrude geometry goes from Z=0 to Z=1.8. Local Origin is at 0 */}
      {/* Wheelbase: Front and Rear. SVG maps CX 60 and 240 */}
      {/* Rear Right (inside) */}
      <Wheel position={[60 * 1 / 25, -0.2, -0.2]} />
      {/* Rear Left (outside) */}
      <Wheel position={[60 * 1 / 25, -0.2, 2.0]} />

      {/* Front Right */}
      <Wheel position={[240 * 1 / 25, -0.2, -0.2]} />
      {/* Front Left */}
      <Wheel position={[240 * 1 / 25, -0.2, 2.0]} />
    </group>
  );
};

export function GarageDisplay({ config }: GarageDisplayProps) {
  const [isDragging, setIsDragging] = React.useState(false);

  return (
    <div className="flex-1 h-full w-full bg-gradient-to-b from-gray-50 to-gray-200 flex flex-col items-center justify-center overflow-hidden relative rounded-xl border border-gray-200 shadow-inner">
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
      </div>

      <div className="relative w-full h-[300px] sm:h-[400px] cursor-grab active:cursor-grabbing">
        <Canvas shadows camera={{ position: [6, 4, 8], fov: 40 }}>
          <Suspense fallback={null}>
            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} castShadow intensity={1} shadow-mapSize={[1024, 1024]} />
            <directionalLight position={[-10, 10, -5]} intensity={0.5} />

            {/* Environment mapping for nice reflections */}
            <Environment preset="city" />

            {/* The Car */}
            <CarModel config={config} setIsDragging={setIsDragging} />

            {/* Fake Ground / Shadow */}
            <ContactShadows position={[0, -0.4, 0]} opacity={0.5} scale={20} blur={2} far={4} />

            {/* Interactive Controls */}
            <OrbitControls
              makeDefault
              enabled={!isDragging}
              enablePan={false}
              minPolarAngle={Math.PI / 4} // Don't let user go under the car
              maxPolarAngle={Math.PI / 2 - 0.1} // Stop slightly above ground
              minDistance={5}
              maxDistance={15}
            />
          </Suspense>
        </Canvas>
      </div>

      <div className="absolute bottom-6 flex flex-col items-center space-y-1 bg-white/50 backdrop-blur px-4 py-2 rounded-lg border border-white/20 shadow-sm pointer-events-none">
        <div className="text-gray-500 text-xs font-mono uppercase tracking-widest flex items-center gap-2">
          <span>Garage Mode</span>
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
        </div>
        <div className="text-gray-700 text-xs font-sans font-medium">
          {config.name} • {config.totalWeightOz}oz • {config.bodyStyle.toUpperCase()}
        </div>
        <div className="text-gray-400 text-[10px]">
          Drag to rotate • Scroll to zoom
        </div>
      </div>
    </div>
  );
}

