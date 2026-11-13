
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Stars,
  ContactShadows,
} from "@react-three/drei";
import { Suspense } from "react";

import Terrain from "./Terrain";
import Buildings from "./Buildings";


function Earth() {
  return (
    <group position={[43, 27, -48]}>
      {/* Earth */}
      <mesh>
        <sphereGeometry args={[6, 48, 48]} />
        <meshStandardMaterial
          color="#1769b2"
          emissive="#082c58"
          emissiveIntensity={0.4}
          roughness={0.8}
        />
      </mesh>

      {/* Atmospheric glow */}
      <mesh>
        <sphereGeometry args={[6.35, 48, 48]} />
        <meshBasicMaterial
          color="#319aff"
          transparent
          opacity={0.13}
          side={2}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}


function Scene() {
  return (
    <>
      {/* Deep space background */}
      <color attach="background" args={["#03050a"]} />
      <fog attach="fog" args={["#080b12", 65, 125]} />

      {/* Space stars */}
      <Stars
        radius={110}
        depth={65}
        count={4500}
        factor={5}
        saturation={0.2}
        fade
        speed={0.3}
      />
      <Earth />

      {/* Moon illumination */}
      <ambientLight intensity={0.55} />

      <directionalLight
        position={[35, 45, 20]}
        intensity={3}
        color="#fff1d6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <hemisphereLight
        args={["#a4c9ff", "#292329", 0.45]}
      />

      {/* Lunar surface */}
      <Terrain />

      {/* Lunar outpost */}
      <Buildings />

      {/* Soft contact shadows */}
      <ContactShadows
        position={[0, 0.04, 0]}
        opacity={0.4}
        scale={75}
        blur={2.5}
        far={25}
      />

      {/* Camera controls */}
      <OrbitControls
        makeDefault
        target={[0, 1, 0]}
        minDistance={12}
        maxDistance={65}
        maxPolarAngle={Math.PI / 2.05}
        minPolarAngle={0.25}
        enableDamping
        dampingFactor={0.06}
      />
    </>
  );
}

export default function LunarBase() {
  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        camera={{
        position: [20, 17, 24],
        fov: 42,
        near: 0.1,
        far: 200,
        }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
