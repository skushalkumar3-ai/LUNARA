import { Html } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import type { TutorialLocation } from "./TutorialConfiguration";
import type { TutorialStep } from "./TutorialConfiguration";
import { hasHigherPriorityScreenOverlap } from "./screenLabelLayout";

interface Props {
  location: TutorialLocation;
  label: string;
  step?: TutorialStep;
  onScreenPosition: (
    x: number,
    y: number,
    width: number,
    height: number,
    visible: boolean
  ) => void;
}

function keepHtmlLabelInView(
  node: HTMLDivElement | null,
  marker: THREE.Group,
  camera: THREE.Camera,
  viewport: DOMRect,
  projected: THREE.Vector3,
  localX: number,
  localY: number
) {
  if (!node) return;

  marker.localToWorld(projected.set(localX, localY, 0));
  projected.project(camera);
  const bounds = node.getBoundingClientRect();
  const centerX = viewport.left + (projected.x * 0.5 + 0.5) * viewport.width;
  const centerY = viewport.top + (-projected.y * 0.5 + 0.5) * viewport.height;
  const inView =
    projected.z > -1 &&
    projected.z < 1 &&
    centerX - bounds.width / 2 >= viewport.left + 8 &&
    centerX + bounds.width / 2 <= viewport.right - 8 &&
    centerY - bounds.height / 2 >= viewport.top + 8 &&
    centerY + bounds.height / 2 <= viewport.bottom - 8;
  const visible = inView && !hasHigherPriorityScreenOverlap(node);

  if (node.dataset.viewportVisible !== String(visible)) {
    node.style.visibility = visible ? "visible" : "hidden";
    node.dataset.viewportVisible = String(visible);
  }
}

export default function TutorialMarker({
  location,
  label,
  step,
  onScreenPosition,
}: Props) {
  const marker = useRef<THREE.Group>(null);
  const beacon = useRef<THREE.Mesh>(null);
  const beaconMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const ringMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const projectedPosition = useRef(new THREE.Vector3());
  const projectedLabelPosition = useRef(new THREE.Vector3());
  const lastScreenPosition = useRef({
    x: Number.NaN,
    y: Number.NaN,
    visible: false,
  });
  const primaryLabelRef = useRef<HTMLDivElement>(null);
  const infoLabelRef = useRef<HTMLDivElement>(null);
  const nextVisibilityCheck = useRef(0);
  const { camera, gl, size } = useThree();
  const entrance = useRef(0);

  useEffect(() => {
    entrance.current = 0;
  }, [location]);

  useFrame(({ clock }, delta) => {
    entrance.current = Math.min(1, entrance.current + delta * 3);
    if (marker.current) {
      marker.current.scale.setScalar(0.82 + entrance.current * 0.18);
    }

    const pulse = (Math.sin(clock.elapsedTime * 3.2) + 1) / 2;
    if (beacon.current) {
      beacon.current.scale.setScalar(0.92 + pulse * 0.24);
    }
    if (beaconMaterial.current) {
      beaconMaterial.current.opacity = 0.62 + pulse * 0.38;
    }
    if (ringMaterial.current) {
      ringMaterial.current.opacity = 0.3 + pulse * 0.55;
    }

    if (marker.current) {
      marker.current.getWorldPosition(projectedPosition.current);
      projectedPosition.current.project(camera);
      const onScreen =
        projectedPosition.current.z > -1 &&
        projectedPosition.current.z < 1 &&
        Math.abs(projectedPosition.current.x) < 1.15 &&
        Math.abs(projectedPosition.current.y) < 1.15;
      const x = (projectedPosition.current.x * 0.5 + 0.5) * size.width;
      const y = (-projectedPosition.current.y * 0.5 + 0.5) * size.height;
      const previous = lastScreenPosition.current;
      if (
        previous.visible !== onScreen ||
        Math.abs(previous.x - x) > 0.5 ||
        Math.abs(previous.y - y) > 0.5
      ) {
        previous.x = x;
        previous.y = y;
        previous.visible = onScreen;
        onScreenPosition(x, y, size.width, size.height, onScreen);
      }

      if (clock.elapsedTime >= nextVisibilityCheck.current) {
        nextVisibilityCheck.current = clock.elapsedTime + 0.12;
        const viewport = gl.domElement.getBoundingClientRect();
        keepHtmlLabelInView(
          primaryLabelRef.current,
          marker.current,
          camera,
          viewport,
          projectedLabelPosition.current,
          0,
          3.55
        );
        keepHtmlLabelInView(
          infoLabelRef.current,
          marker.current,
          camera,
          viewport,
          projectedLabelPosition.current,
          0,
          -0.6
        );
      }
    }
  });

  return (
    <group ref={marker} position={location.marker}>
      <mesh position={[0, 2.15, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 2.3, 10]} />
        <meshBasicMaterial
          color="#55f2f4"
          toneMapped={false}
          transparent
        />
      </mesh>

      <mesh position={[0, 0.92, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.48, 0.9, 4]} />
        <meshBasicMaterial color="#55f2f4" toneMapped={false} />
      </mesh>

      <mesh ref={beacon} position={[0, 0.18, 0]}>
        <sphereGeometry args={[0.31, 20, 20]} />
        <meshBasicMaterial
          ref={beaconMaterial}
          color="#8fffff"
          toneMapped={false}
          transparent
        />
      </mesh>

      <mesh position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.74, 0.035, 8, 40]} />
        <meshBasicMaterial
          ref={ringMaterial}
          color="#55f2f4"
          toneMapped={false}
          transparent
        />
      </mesh>

      {/* Primary label chip — name */}
      <Html
        position={[0, 3.55, 0]}
        center
        zIndexRange={[8, 1]}
        eps={0.01}
        style={{ pointerEvents: "none" }}
      >
        <div
          className="tutorial-marker-label"
          data-screen-label-priority="10"
          ref={primaryLabelRef}
        >
          <span className="tutorial-marker-dot" />
          {label}
        </div>
      </Html>

      {/* Enhanced info panel — below the arrow */}
      {step && (
        <Html
          position={[0, -0.6, 0]}
          center
          zIndexRange={[8, 1]}
          eps={0.01}
          style={{ pointerEvents: "none" }}
        >
          <div
            className="tutorial-marker-info"
            data-screen-label-priority="20"
            ref={infoLabelRef}
          >
            <div className="tutorial-marker-info__category">{step.category}</div>
            <p className="tutorial-marker-info__desc">{step.description}</p>
            {step.purpose && (
              <p className="tutorial-marker-info__purpose">{step.purpose}</p>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
