
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  ContactShadows,
  Html,
} from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import CrewAndRover from "./CrewAndRover";
import Terrain from "./Terrain";
import Buildings from "./Buildings";
import TutorialMarker from "./SurfaceTutorialMarkers";
import TutorialCamera from "./TutorialCamera";
import EnvironmentLabels from "./EnvironmentLabels";
import ArjunCameraFocus from "./ArjunCameraFocus";
import CrewSelectionCameraFocus from "./CrewSelectionCameraFocus";
import MissionCompletionCamera from "./MissionCompletionCamera";
import useTutorialLocations from "./TutorialLocations";
import { TUTORIAL_STEPS } from "./TutorialConfiguration";
import { hasHigherPriorityScreenOverlap } from "./screenLabelLayout";
import type { MissionPhase } from "../store/missionStore";
import type { SystemStatus } from "../mission/types";

type MarkerScreenPositionHandler = (
  x: number,
  y: number,
  width: number,
  height: number,
  visible: boolean
) => void;

function Earth() {
  const earthRef = useRef<THREE.Group>(null);
  const textures = useMemo(() => createEarthTextures(), []);

  useFrame((_, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.012;
  });

  return (
    <group ref={earthRef} position={[43, 27, -48]} rotation={[0.08, 0, -0.12]}>
      <mesh>
        <sphereGeometry args={[6, 48, 48]} />
        <meshStandardMaterial
          map={textures.surface}
          roughness={0.92}
          metalness={0}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[6.025, 48, 48]} />
        <meshStandardMaterial
          map={textures.clouds}
          transparent
          opacity={0.26}
          depthWrite={false}
          roughness={1}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[6.38, 48, 48]} />
        <shaderMaterial
          vertexShader={EARTH_ATMOSPHERE_VERTEX}
          fragmentShader={EARTH_ATMOSPHERE_FRAGMENT}
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          uniforms={{
            glowColor: { value: new THREE.Color("#48aaff") },
            glowStrength: { value: 0.42 },
          }}
        />
      </mesh>
    </group>
  );
}

const CONTINENTS: number[][][] = [
  [[0.055, 0.22], [0.09, 0.16], [0.15, 0.13], [0.19, 0.18], [0.24, 0.16], [0.29, 0.21], [0.34, 0.24], [0.35, 0.31], [0.31, 0.36], [0.3, 0.43], [0.26, 0.47], [0.23, 0.42], [0.19, 0.43], [0.16, 0.38], [0.12, 0.36], [0.1, 0.3], [0.065, 0.29]],
  [[0.255, 0.43], [0.3, 0.45], [0.33, 0.49], [0.34, 0.56], [0.32, 0.62], [0.31, 0.7], [0.28, 0.79], [0.26, 0.74], [0.255, 0.65], [0.24, 0.57], [0.245, 0.49]],
  [[0.37, 0.13], [0.405, 0.1], [0.435, 0.13], [0.43, 0.19], [0.4, 0.22], [0.375, 0.19]],
  [[0.455, 0.22], [0.49, 0.18], [0.535, 0.2], [0.57, 0.15], [0.625, 0.17], [0.67, 0.13], [0.72, 0.17], [0.78, 0.15], [0.84, 0.19], [0.9, 0.21], [0.95, 0.27], [0.93, 0.33], [0.88, 0.35], [0.84, 0.42], [0.77, 0.43], [0.72, 0.4], [0.68, 0.45], [0.63, 0.4], [0.59, 0.45], [0.55, 0.41], [0.52, 0.35], [0.48, 0.36], [0.46, 0.3]],
  [[0.48, 0.36], [0.53, 0.35], [0.57, 0.4], [0.6, 0.47], [0.59, 0.56], [0.56, 0.66], [0.53, 0.71], [0.5, 0.65], [0.49, 0.56], [0.46, 0.49], [0.46, 0.41]],
  [[0.59, 0.47], [0.64, 0.44], [0.68, 0.48], [0.7, 0.54], [0.67, 0.6], [0.63, 0.58], [0.61, 0.53]],
  [[0.77, 0.63], [0.82, 0.6], [0.87, 0.63], [0.9, 0.69], [0.88, 0.74], [0.83, 0.76], [0.79, 0.72]],
  [[0.94, 0.49], [0.96, 0.47], [0.98, 0.49], [0.975, 0.53], [0.95, 0.54]],
];

const EARTH_ATMOSPHERE_VERTEX = `
  varying vec3 vNormal;
  varying vec3 vViewDirection;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDirection = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const EARTH_ATMOSPHERE_FRAGMENT = `
  uniform vec3 glowColor;
  uniform float glowStrength;
  varying vec3 vNormal;
  varying vec3 vViewDirection;
  void main() {
    float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDirection)), 0.0), 3.2);
    gl_FragColor = vec4(glowColor, rim * glowStrength);
  }
`;

function createEarthTextures() {
  const surfaceCanvas = document.createElement("canvas");
  surfaceCanvas.width = 1024;
  surfaceCanvas.height = 512;
  const surfaceContext = surfaceCanvas.getContext("2d");
  if (!surfaceContext) throw new Error("Could not create Earth surface texture.");

  const ocean = surfaceContext.createLinearGradient(0, 0, 0, 512);
  ocean.addColorStop(0, "#164e79");
  ocean.addColorStop(0.48, "#176c9c");
  ocean.addColorStop(1, "#0b3e67");
  surfaceContext.fillStyle = ocean;
  surfaceContext.fillRect(0, 0, 1024, 512);

  const land = surfaceContext.createLinearGradient(0, 70, 0, 430);
  land.addColorStop(0, "#81966e");
  land.addColorStop(0.45, "#647d59");
  land.addColorStop(1, "#a18a69");
  surfaceContext.fillStyle = land;
  surfaceContext.strokeStyle = "rgba(172, 190, 132, 0.42)";
  surfaceContext.lineWidth = 3;
  CONTINENTS.forEach((continent) => {
    surfaceContext.beginPath();
    continent.forEach(([x, y], index) => {
      const px = x * surfaceCanvas.width;
      const py = y * surfaceCanvas.height;
      if (index === 0) surfaceContext.moveTo(px, py);
      else surfaceContext.lineTo(px, py);
    });
    surfaceContext.closePath();
    surfaceContext.fill();
    surfaceContext.stroke();
  });

  const cloudsCanvas = document.createElement("canvas");
  cloudsCanvas.width = 1024;
  cloudsCanvas.height = 512;
  const cloudsContext = cloudsCanvas.getContext("2d");
  if (!cloudsContext) throw new Error("Could not create Earth cloud texture.");
  for (let i = 0; i < 145; i++) {
    const x = (Math.sin(i * 91.7) * 0.5 + 0.5) * 1024;
    const y = 42 + (Math.sin(i * 37.1) * 0.5 + 0.5) * 428;
    const width = 12 + Math.abs(Math.sin(i * 11.3)) * 55;
    const height = 2 + Math.abs(Math.cos(i * 7.9)) * 7;
    cloudsContext.fillStyle = `rgba(225, 243, 255, ${0.08 + Math.abs(Math.sin(i * 3.1)) * 0.13})`;
    cloudsContext.beginPath();
    cloudsContext.ellipse(x, y, width, height, Math.sin(i) * 0.18, 0, Math.PI * 2);
    cloudsContext.fill();
  }

  const surface = new THREE.CanvasTexture(surfaceCanvas);
  surface.colorSpace = THREE.SRGBColorSpace;
  surface.anisotropy = 4;
  const clouds = new THREE.CanvasTexture(cloudsCanvas);
  clouds.colorSpace = THREE.SRGBColorSpace;
  clouds.anisotropy = 4;
  return { surface, clouds };
}

// ─── Emergency lighting effect ───────────────────────────────────────────────

function EmergencyLighting({ active }: { active: boolean }) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (!lightRef.current || !active) return;
    // Subtle pulsing red light during emergency
    const pulse = (Math.sin(clock.elapsedTime * 1.8) + 1) / 2;
    lightRef.current.intensity = 0.3 + pulse * 0.4;
  });

  if (!active) return null;

  return (
    <pointLight
      ref={lightRef}
      position={[0, 25, 0]}
      color="#ff4422"
      intensity={0.4}
      distance={120}
    />
  );
}

function EnvironmentBeacon({
  location,
  label,
  tone,
  labelOffset = 0,
}: {
  location: [number, number, number];
  label: string;
  tone: "warning" | "secure" | "caution";
  labelOffset?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const projectedPosition = useRef(new THREE.Vector3());
  const labelVisible = useRef(false);
  const nextVisibilityCheck = useRef(0);
  const { camera, gl } = useThree();
  const color =
    tone === "warning" ? "#fb5b55" : tone === "secure" ? "#67e8f9" : "#fbbf24";

  useFrame(({ clock }) => {
    if (
      clock.elapsedTime < nextVisibilityCheck.current ||
      !groupRef.current ||
      !labelRef.current
    ) {
      return;
    }
    nextVisibilityCheck.current = clock.elapsedTime + 0.12;

    groupRef.current.localToWorld(
      projectedPosition.current.set(0, 1.25 + labelOffset * 0.72, 0)
    );
    const distance = camera.position.distanceTo(projectedPosition.current);
    projectedPosition.current.project(camera);
    const viewport = gl.domElement.getBoundingClientRect();
    const labelBounds = labelRef.current.getBoundingClientRect();
    const screenX =
      viewport.left + (projectedPosition.current.x * 0.5 + 0.5) * viewport.width;
    const screenY =
      viewport.top + (-projectedPosition.current.y * 0.5 + 0.5) * viewport.height;
    const gutter = labelVisible.current ? 8 : 16;
    const inView =
      projectedPosition.current.z > -1 &&
      projectedPosition.current.z < 1 &&
      screenX - labelBounds.width / 2 >= viewport.left + gutter &&
      screenX + labelBounds.width / 2 <= viewport.right - gutter &&
      screenY - labelBounds.height / 2 >= viewport.top + gutter &&
      screenY + labelBounds.height / 2 <= viewport.bottom - gutter &&
      distance < (labelVisible.current ? 300 : 280);
    const visible =
      inView && !hasHigherPriorityScreenOverlap(labelRef.current);

    if (labelVisible.current !== visible) {
      labelRef.current.style.visibility = visible ? "visible" : "hidden";
      labelVisible.current = visible;
    }
  });

  return (
    <group ref={groupRef} position={location}>
      <pointLight color={color} intensity={tone === "warning" ? 1.3 : 0.75} distance={14} />
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.24, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <Html
        position={[0, 1.25 + labelOffset * 0.72, 0]}
        center
        zIndexRange={[8, 1]}
        eps={0.01}
      >
        <div
          ref={labelRef}
          className={`mission-env-indicator mission-env-indicator--${tone}`}
          data-screen-label-priority="5"
        >
          {label}
        </div>
      </Html>
    </group>
  );
}

function MissionEnvironmentEffects({
  locations,
  systemStatus,
}: {
  locations: ReturnType<typeof useTutorialLocations>["locations"];
  systemStatus: SystemStatus;
}) {
  if (!locations) return null;

  const habitat = locations[1];
  const greenhouse = locations[2];
  const solarArray = locations[3];
  const indicators = [
    systemStatus.astronautExposure
      ? {
          location: locations[0],
          label: "CREW RADIATION EXPOSURE",
          tone: "warning" as const,
        }
      : systemStatus.crewSheltered
        ? {
            location: locations[0],
            label: "CREW SHELTERED",
            tone: "secure" as const,
          }
        : null,
    systemStatus.habitatShield
      ? {
          location: habitat,
          label: "HABITAT SHIELD ACTIVE",
          tone: "secure" as const,
        }
      : null,
    systemStatus.oxygenReserve || systemStatus.oxygenRepair || systemStatus.oxygenConservation
      ? {
          location: habitat,
          label: systemStatus.oxygenReserve
            ? "OXYGEN RESERVE ACTIVE"
            : systemStatus.oxygenRepair
              ? "OXYGEN GENERATION REPAIR"
              : "OXYGEN CONSERVATION",
          tone: "caution" as const,
        }
      : null,
    systemStatus.temperatureMode !== "normal"
      ? {
          location: habitat,
          label:
            systemStatus.temperatureMode === "support"
              ? "EMERGENCY THERMAL SUPPORT"
              : `THERMAL ${systemStatus.temperatureMode.toUpperCase()}`,
          tone: systemStatus.temperatureMode === "emergency"
            ? "warning" as const
            : systemStatus.temperatureMode === "support"
              ? "secure" as const
              : "caution" as const,
        }
      : null,
    systemStatus.waterReserve || systemStatus.waterRepair || systemStatus.waterRationing
      ? {
          location: greenhouse,
          label: systemStatus.waterReserve
            ? "WATER RESERVE ACTIVE"
            : systemStatus.waterRepair
              ? "WATER LOOP REPAIR"
              : "WATER RATIONING",
          tone: "caution" as const,
        }
      : null,
    systemStatus.solarArrayUnstable
      ? {
          location: solarArray,
          label: "SOLAR ARRAY UNSTABLE",
          tone: "warning" as const,
        }
      : systemStatus.backupPower
        ? {
            location: solarArray,
            label: "BACKUP POWER ACTIVE",
            tone: "secure" as const,
          }
        : systemStatus.criticalSystemsMode
          ? {
              location: solarArray,
              label: "CRITICAL LOADS PRIORITIZED",
              tone: "caution" as const,
            }
          : null,
  ].filter(
    (indicator): indicator is NonNullable<typeof indicator> =>
      indicator !== null && indicator.location !== undefined
  );

  return (
    <>
      {systemStatus.habitatShield && habitat && (
        <mesh
          position={[
            habitat.focus[0],
            habitat.focus[1] + 3,
            habitat.focus[2],
          ]}
        >
          <sphereGeometry args={[11, 32, 24]} />
          <meshBasicMaterial
            color="#44ccff"
            transparent
            opacity={0.075}
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}
      {systemStatus.redWarningLights && habitat && (
        <pointLight
          position={[
            habitat.focus[0],
            habitat.focus[1] + 8,
            habitat.focus[2],
          ]}
          color="#ff3828"
          intensity={1.8}
          distance={28}
        />
      )}
      {(() => {
        const slots = new Map<string, number>();
        return indicators.map((indicator) => {
          const locationKey = indicator.location.marker.join(",");
          const labelOffset = slots.get(locationKey) ?? 0;
          slots.set(locationKey, labelOffset + 1);
          return (
            <EnvironmentBeacon
              key={indicator.label}
              location={[
                indicator.location.marker[0],
                indicator.location.marker[1] + 0.5,
                indicator.location.marker[2],
              ]}
              label={indicator.label}
              tone={indicator.tone}
              labelOffset={labelOffset}
            />
          );
        });
      })()}
    </>
  );
}

interface SceneProps {
  activeTutorialStep: number;
  cameraMode: "tutorial" | "outpost";
  missionPhase: MissionPhase;
  onOverviewReached?: () => void;
  onMarkerPositionChange: MarkerScreenPositionHandler;
  onArjunFocusComplete?: () => void;
  systemStatus: SystemStatus;
  selectedCrewPosition: [number, number, number] | null;
}

function Scene({
  activeTutorialStep,
  cameraMode,
  missionPhase,
  onOverviewReached,
  onMarkerPositionChange,
  onArjunFocusComplete,
  systemStatus,
  selectedCrewPosition,
}: SceneProps) {
  const { locations, arjunPosition } = useTutorialLocations();
  const activeLocation =
    activeTutorialStep >= 0 ? locations?.[activeTutorialStep] : null;

  const isEmergencyPhase =
    missionPhase === "phase-02-emergency" ||
    missionPhase === "phase-03-arjun" ||
    missionPhase === "phase-04-control" ||
    missionPhase === "phase-05-recovery";

  const isTutorialPhase = cameraMode === "tutorial";
  const isArjunPhase = missionPhase === "phase-03-arjun";
  const showEnvLabels = !isTutorialPhase && missionPhase !== "phase-02-emergency";

  return (
    <>
      <fog attach="fog" args={["#101827", 90, 260]} />

      <Earth />

      <ambientLight
        intensity={
          systemStatus.criticalSystemsMode
            ? 0.38
            : systemStatus.backupPower
              ? 0.58
              : 0.8
        }
      />

      <directionalLight
        position={[35, 45, 20]}
        intensity={
          systemStatus.criticalSystemsMode
            ? 1.7
            : isEmergencyPhase
              ? 2.2
              : 2.8
        }
        color={isEmergencyPhase ? "#ffe0cc" : "#fff1dc"}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <hemisphereLight
        args={
          systemStatus.temperatureMode === "emergency"
            ? ["#ff8055", "#2b1010", 0.38]
            : systemStatus.temperatureMode === "isolated"
              ? ["#ffd08a", "#241512", 0.3]
              : systemStatus.temperatureMode === "conserve"
                ? ["#8cc6ff", "#111b29", 0.3]
                : ["#b6d5ff", "#292432", 0.65]
        }
      />

      <EmergencyLighting active={systemStatus.redWarningLights} />

      <Terrain />
      <Buildings />
      <CrewAndRover
        sheltering={systemStatus.crewSheltered}
        systemStatus={systemStatus}
      />
      <MissionEnvironmentEffects
        locations={locations}
        systemStatus={systemStatus}
      />

      {activeLocation && (
        <TutorialMarker
          key={activeTutorialStep}
          location={activeLocation}
          label={TUTORIAL_STEPS[activeTutorialStep].title}
          step={TUTORIAL_STEPS[activeTutorialStep]}
          onScreenPosition={onMarkerPositionChange}
        />
      )}

      {showEnvLabels && <EnvironmentLabels />}

      <ContactShadows
        position={[0, 0.04, 0]}
        opacity={0.4}
        scale={75}
        blur={2.5}
        far={25}
      />

      {cameraMode === "tutorial" ? (
        <TutorialCamera
          enabled
          activeStep={activeTutorialStep}
          locations={locations}
          onOverviewReached={onOverviewReached}
        />
      ) : isArjunPhase && arjunPosition ? (
        <ArjunCameraFocus
          targetPosition={arjunPosition}
          onFocusComplete={onArjunFocusComplete}
        />
      ) : missionPhase === "phase-06-complete" ? (
        <MissionCompletionCamera />
      ) : selectedCrewPosition ? (
        <CrewSelectionCameraFocus target={selectedCrewPosition} />
      ) : (
        <OrbitControls
          makeDefault
          target={[0, 1, 0]}
          minDistance={12}
          maxDistance={150}
          maxPolarAngle={Math.PI / 2.05}
          minPolarAngle={0.25}
          enableDamping
          dampingFactor={0.06}
        />
      )}
    </>
  );
}

interface LunarBaseProps {
  activeTutorialStep?: number;
  cameraMode?: "tutorial" | "outpost";
  missionPhase?: MissionPhase;
  onOverviewReached?: () => void;
  onMarkerPositionChange: MarkerScreenPositionHandler;
  onArjunFocusComplete?: () => void;
  systemStatus: SystemStatus;
  selectedCrewPosition?: [number, number, number] | null;
}

export default function LunarBase({
  activeTutorialStep = -1,
  cameraMode = "outpost",
  missionPhase = "phase-01-normal",
  onOverviewReached,
  onMarkerPositionChange,
  onArjunFocusComplete,
  systemStatus,
  selectedCrewPosition = null,
}: LunarBaseProps) {
  return (
    <div className="lunar-scene absolute inset-0">
      <Canvas
        shadows
        camera={{
          position: [100, 66, 0],
          fov: 42,
          near: 0.1,
          far: 500,
        }}
        dpr={[1, 1.25]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
      >
        <Suspense fallback={null}>
          <Scene
            activeTutorialStep={activeTutorialStep}
            cameraMode={cameraMode}
            missionPhase={missionPhase}
            onOverviewReached={onOverviewReached}
            onMarkerPositionChange={onMarkerPositionChange}
            onArjunFocusComplete={onArjunFocusComplete}
            systemStatus={systemStatus}
            selectedCrewPosition={selectedCrewPosition}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
