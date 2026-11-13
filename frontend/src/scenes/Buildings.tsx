
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Habitat() {
  return (
    <group position={[0, 0, 0]}>
      {/* Main pressurized module */}
      <mesh
        position={[0, 2.5, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[2.1, 2.1, 6, 32]} />
        <meshStandardMaterial
          color="#c5cbd2"
          metalness={0.65}
          roughness={0.35}
        />
      </mesh>

      {/* End caps */}
      {[-3.05, 3.05].map((x) => (
        <mesh
          key={x}
          position={[x, 2.5, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[1.85, 1.85, 0.25, 32]} />
          <meshStandardMaterial color="#707d8b" metalness={0.7} />
        </mesh>
      ))}

      {/* Observation windows */}
      {[-1.4, 0, 1.4].map((x) => (
        <mesh
          key={x}
          position={[x, 3.1, 2.03]}
        >
          <boxGeometry args={[0.65, 0.65, 0.08]} />
          <meshPhysicalMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={0.35}
            metalness={0.4}
            roughness={0.15}
          />
        </mesh>
      ))}

      {/* Support legs */}
      {[-1.8, 1.8].map((x) =>
        [-1.1, 1.1].map((z) => (
          <mesh
            key={`${x}-${z}`}
            position={[x, 0.75, z]}
            castShadow
          >
            <cylinderGeometry args={[0.16, 0.24, 1.5, 8]} />
            <meshStandardMaterial color="#515a65" metalness={0.7} />
          </mesh>
        ))
      )}

      {/* Entrance airlock */}
      <group position={[3.7, 0, 0]}>
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.9, 0.9, 3, 24]} />
          <meshStandardMaterial color="#a5adb7" metalness={0.7} />
        </mesh>

        <mesh position={[0, 2.8, 0]}>
          <sphereGeometry args={[0.9, 24, 12]} />
          <meshStandardMaterial color="#727f8c" metalness={0.7} />
        </mesh>
      </group>

      {/* Communication lights */}
      <pointLight position={[0, 4.5, 0]} color="#38bdf8" intensity={1} distance={5} />
    </group>
  );
}

function Greenhouse() {
  return (
    <group position={[-9, 0, 4]}>
      {/* Base */}
      <mesh position={[0, 0.5, 0]} receiveShadow>
        <cylinderGeometry args={[3.1, 3.1, 1, 32]} />
        <meshStandardMaterial color="#59636b" metalness={0.5} />
      </mesh>

      {/* Transparent dome */}
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[3, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#74d9e8"
          transparent
          opacity={0.22}
          roughness={0.12}
          metalness={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Dome support ribs */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh
          key={i}
          position={[0, 0.55, 0]}
          rotation={[0, (i * Math.PI) / 4, 0]}
        >
          <cylinderGeometry args={[0.035, 0.035, 4.25, 6]} />
          <meshStandardMaterial color="#a6c7cf" metalness={0.7} />
        </mesh>
      ))}

      {/* Growing beds */}
      {[-1.5, 0, 1.5].map((x) => (
        <group key={x} position={[x, 0.9, 0]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.85, 0.25, 3.4]} />
            <meshStandardMaterial color="#594534" />
          </mesh>

          {[-1, 0, 1].map((z) => (
            <group key={z} position={[0, 0.6, z]}>
              <mesh>
                <cylinderGeometry args={[0.08, 0.12, 0.9, 8]} />
                <meshStandardMaterial color="#42854c" />
              </mesh>
              <mesh position={[0, 0.35, 0]}>
                <sphereGeometry args={[0.25, 12, 12]} />
                <meshStandardMaterial color="#62b96b" roughness={0.9} />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      <pointLight position={[0, 3, 0]} color="#a4ffad" intensity={1.5} distance={7} />
    </group>
  );
}

function SolarPanel({ position, rotation = 0 }: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Support mast */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.12, 0.18, 2.4, 8]} />
        <meshStandardMaterial color="#8d969e" metalness={0.8} />
      </mesh>

      {/* Panel frame */}
      <mesh position={[0, 2.5, 0]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[5.5, 0.12, 3.2]} />
        <meshStandardMaterial color="#9ba5b1" metalness={0.8} />
      </mesh>

      {/* Photovoltaic surface */}
      <mesh position={[0, 2.58, 0]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[5.3, 0.04, 3]} />
        <meshStandardMaterial
          color="#102e57"
          metalness={0.75}
          roughness={0.2}
        />
      </mesh>

      {/* Individual solar cells */}
      {Array.from({ length: 24 }, (_, i) => {
        const x = -2.45 + (i % 6) * 0.98;
        const z = -1.2 + Math.floor(i / 6) * 0.8;

        return (
          <mesh
            key={i}
            position={[x, 2.62, z]}
            rotation={[-0.25, 0, 0]}
          >
            <boxGeometry args={[0.9, 0.025, 0.72]} />
            <meshStandardMaterial
              color="#1e4f83"
              metalness={0.8}
              roughness={0.25}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function SolarFarm() {
  return (
    <group>
      <SolarPanel position={[9, 0, -5]} rotation={-0.3} />
      <SolarPanel position={[16, 0, -5]} rotation={-0.3} />
      <SolarPanel position={[9, 0, -11]} rotation={-0.3} />
      <SolarPanel position={[16, 0, -11]} rotation={-0.3} />
    </group>
  );
}

function CommunicationTower() {
  return (
    <group position={[-12, 0, -8]}>
      {/* Tower mast */}
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[0.12, 0.2, 6, 8]} />
        <meshStandardMaterial color="#aab4bd" metalness={0.8} />
      </mesh>

      {/* Dish antenna */}
      <mesh position={[0, 6.1, 0.1]} rotation={[0.4, 0, 0]}>
        <sphereGeometry args={[1.3, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#c7d0d8"
          metalness={0.85}
          roughness={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Signal light */}
      <mesh position={[0, 6.8, 0]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshBasicMaterial color="#ff4040" />
      </mesh>

      <pointLight position={[0, 6.8, 0]} color="#ff4040" intensity={1} distance={4} />
    </group>
  );
}

function LunarRover() {
  const wheels = [-1, 1];

  return (
    <group position={[6, 0, 8]} rotation={[0, -0.4, 0]}>
      {/* Rover chassis */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[3, 0.7, 2]} />
        <meshStandardMaterial color="#d2d6dc" metalness={0.75} roughness={0.35} />
      </mesh>

      {/* Rover top equipment */}
      <mesh position={[0, 1.7, 0]}>
        <boxGeometry args={[1.1, 0.5, 1]} />
        <meshStandardMaterial color="#626d78" metalness={0.7} />
      </mesh>

      {/* Wheels */}
      {wheels.map((x) =>
        wheels.map((z) => (
          <mesh
            key={`${x}-${z}`}
            position={[x * 1.35, 0.65, z * 1.15]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
          >
            <cylinderGeometry args={[0.65, 0.65, 0.3, 16]} />
            <meshStandardMaterial color="#25292e" roughness={1} />
          </mesh>
        ))
      )}

      {/* Front lights */}
      <pointLight position={[0, 1.3, 1.4]} color="#d8f6ff" intensity={1} distance={5} />
    </group>
  );
}

function BaseBeacon() {
  const beacon = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (beacon.current) {
      const pulse = 0.5 + Math.sin(clock.elapsedTime * 2) * 0.5;
      const material = beacon.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = pulse * 1.5;
    }
  });

  return (
    <mesh ref={beacon} position={[0, 5, 0]}>
      <sphereGeometry args={[0.12, 16, 16]} />
      <meshStandardMaterial
        color="#22d3ee"
        emissive="#06b6d4"
        emissiveIntensity={1}
      />
    </mesh>
  );
}

export default function Buildings() {
  return (
    <group>
      <Habitat />
      <Greenhouse />
      <SolarFarm />
      <CommunicationTower />
      <LunarRover />
      <BaseBeacon />
    </group>
  );
}
