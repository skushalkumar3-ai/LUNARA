import { Html } from "@react-three/drei";
import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { TUTORIAL_STEPS, type TutorialLocation } from "./TutorialConfiguration";
import { hasHigherPriorityScreenOverlap } from "./screenLabelLayout";
import { useMissionStore } from "../store/missionStore";
import useTutorialLocations from "./TutorialLocations";

/** Single persistent environment label shown after tutorial */
function EnvLabel({
  location,
  step,
  index,
}: {
  location: TutorialLocation;
  step: (typeof TUTORIAL_STEPS)[0];
  index: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const projectedPosition = useRef(new THREE.Vector3());
  const labelVisible = useRef(false);
  const nextVisibilityCheck = useRef(0);
  const { camera, size } = useThree();
  const phase = useRef(index * 0.6); // stagger idle animation

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime + phase.current;
    // Gentle bob
    groupRef.current.position.y = location.marker[1] + Math.sin(t * 0.9) * 0.08;
    if (clock.elapsedTime < nextVisibilityCheck.current) return;
    nextVisibilityCheck.current = clock.elapsedTime + 0.12;

    groupRef.current.localToWorld(projectedPosition.current.set(0, 2.1, 0));
    const distance = camera.position.distanceTo(projectedPosition.current);
    projectedPosition.current.project(camera);
    const horizontalMargin =
      (180 + (labelVisible.current ? 0 : 8)) / Math.max(size.width, 1);
    const verticalMargin =
      (36 + (labelVisible.current ? 0 : 8)) / Math.max(size.height, 1);
    const inView =
      projectedPosition.current.z > -1 &&
      projectedPosition.current.z < 1 &&
      Math.abs(projectedPosition.current.x) < 1 - horizontalMargin &&
      Math.abs(projectedPosition.current.y) < 1 - verticalMargin &&
      distance < (labelVisible.current ? 300 : 280);
    const label = labelRef.current;
    const visible =
      inView && label !== null && !hasHigherPriorityScreenOverlap(label);

    if (label && labelVisible.current !== visible) {
      label.style.visibility = visible ? "visible" : "hidden";
      labelVisible.current = visible;
    }
  });

  return (
    <group ref={groupRef} position={location.marker}>
      {/* Thin vertical rod */}
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 1.4, 8]} />
        <meshBasicMaterial color="#55f2f4" transparent opacity={0.5} toneMapped={false} />
      </mesh>

      {/* Small beacon sphere */}
      <mesh position={[0, 0.08, 0]}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshBasicMaterial color="#8fffff" transparent opacity={0.75} toneMapped={false} />
      </mesh>

      {/* HTML label */}
      <Html
        position={[0, 2.1, 0]}
        center
        zIndexRange={[8, 1]}
        eps={0.01}
        style={{ pointerEvents: "none" }}
      >
        <div
          className="env-label"
          data-screen-label-priority={30 + index}
          ref={labelRef}
        >
          <div className="env-label__cat">{step.category}</div>
          <div className="env-label__name">{step.title}</div>
        </div>
      </Html>
    </group>
  );
}

/**
 * EnvironmentLabels — renders all 5 location labels post-tutorial.
 * Reads visibility from mission store; independent of tutorial state.
 */
export default function EnvironmentLabels() {
  const showLabels = useMissionStore((s) => s.showEnvironmentLabels);
  const { locations } = useTutorialLocations();

  if (!showLabels || !locations) return null;

  return (
    <>
      {TUTORIAL_STEPS.map((step, i) => {
        const location = locations[i];
        if (!location) return null;
        return (
          <EnvLabel
            key={step.title}
            location={location}
            step={step}
            index={i}
          />
        );
      })}
    </>
  );
}
