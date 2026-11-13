
import { useMemo } from "react";
import * as THREE from "three";

const TERRAIN_SIZE = 120;
const SEGMENTS = 180;

const craterData = [
  { x: -18, y: -12, r: 7 },
  { x: 15, y: 10, r: 9 },
  { x: 30, y: -22, r: 5 },
  { x: -35, y: 25, r: 8 },
  { x: 5, y: -35, r: 6 },
  { x: -5, y: 22, r: 4 },
  { x: 38, y: 30, r: 7 },
  { x: -30, y: -35, r: 5 },
];

function createLunarTerrain() {
  const geometry = new THREE.PlaneGeometry(
    TERRAIN_SIZE,
    TERRAIN_SIZE,
    SEGMENTS,
    SEGMENTS
  );

  const positions = geometry.attributes.position;

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);

    let height = 0;

    for (const crater of craterData) {
      const distance = Math.sqrt(
        (x - crater.x) ** 2 + (y - crater.y) ** 2
      );

      const r = crater.r;

      // Smooth crater depression
      const depression =
        -0.8 * Math.exp(-Math.pow(distance / r, 2) * 3);

      // Raised crater rim
      const rim =
        0.24 *
        Math.exp(-Math.pow((distance - r * 1.08) / (r * 0.18), 2));

      height += depression + rim;
    }

    // Small natural surface variations
    height +=
      Math.sin(x * 0.18) * Math.cos(y * 0.14) * 0.055;

    positions.setZ(i, height);
  }

  geometry.computeVertexNormals();

  return geometry;
}

function createRocks() {
  return Array.from({ length: 110 }, (_, i) => {
    const x = Math.sin(i * 127.1) * 48;
    const z = Math.cos(i * 311.7) * 48;

    const size = 0.15 + Math.abs(Math.sin(i * 17.3)) * 0.65;

    return {
      id: i,
      position: [x, size * 0.3, z] as [number, number, number],
      scale: [
        size * 1.3,
        size * 0.8,
        size,
      ] as [number, number, number],
      rotation: [
        i * 0.7,
        i * 1.3,
        i * 0.4,
      ] as [number, number, number],
    };
  });
}

export default function Terrain() {
  const geometry = useMemo(() => createLunarTerrain(), []);
  const rocks = useMemo(() => createRocks(), []);

  return (
    <group>
      {/* Main lunar surface */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <primitive object={geometry} attach="geometry" />

        <meshStandardMaterial
          color="#858585"
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* Scattered lunar rocks */}
      {rocks.map((rock) => (
        <mesh
          key={rock.id}
          position={rock.position}
          scale={rock.scale}
          rotation={rock.rotation}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[1, 0]} />

          <meshStandardMaterial
            color="#55565b"
            roughness={1}
          />
        </mesh>
      ))}

      {/* Surface foundation */}
      <mesh
        position={[0, -1.4, 0]}
        receiveShadow
      >
        <boxGeometry args={[120, 2, 120]} />

        <meshStandardMaterial
          color="#292a2e"
          roughness={1}
        />
      </mesh>
    </group>
  );
}
