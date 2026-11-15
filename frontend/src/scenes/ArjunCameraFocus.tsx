import { useEffect, useRef } from "react";
import {
  CameraControls as DreiCameraControls,
  type CameraControls as CameraControlsApi,
} from "@react-three/drei";

interface Props {
  /** World-space position of Arjun Sharma */
  targetPosition: [number, number, number];
  onFocusComplete?: () => void;
}

/**
 * ArjunCameraFocus — smoothly zooms the camera to Arjun Sharma's position.
 * Replaces OrbitControls temporarily during phase-03-arjun.
 * Calls onFocusComplete after the transition settles.
 */
export default function ArjunCameraFocus({
  targetPosition,
  onFocusComplete,
}: Props) {
  const controls = useRef<CameraControlsApi>(null);
  const completedRef = useRef(false);
  const onFocusCompleteRef = useRef(onFocusComplete);
  useEffect(() => {
    onFocusCompleteRef.current = onFocusComplete;
  }, [onFocusComplete]);

  useEffect(() => {
    if (!controls.current || completedRef.current) return;

    let cancelled = false;
    let completionTimer: ReturnType<typeof setTimeout> | null = null;
    const [tx, ty, tz] = targetPosition;

    // Position camera at a slight offset for a cinematic close-up
    const cameraX = tx + 12;
    const cameraY = ty + 8;
    const cameraZ = tz + 14;

    const transition = controls.current.setLookAt(
      cameraX, cameraY, cameraZ,
      tx, ty + 1.2, tz,
      true
    );

    if (onFocusCompleteRef.current) {
      void transition.then(() => {
        if (cancelled || completedRef.current) return;
        completedRef.current = true;
        completionTimer = setTimeout(() => {
          if (!cancelled) onFocusCompleteRef.current?.();
        }, 600);
      });
    }

    return () => {
      cancelled = true;
      if (completionTimer !== null) clearTimeout(completionTimer);
    };
  }, [targetPosition]);

  return (
    <DreiCameraControls
      ref={controls}
      makeDefault
      enabled={false}
      smoothTime={0.7}
      dollySpeed={0}
      truckSpeed={0}
      minDistance={8}
      maxDistance={150}
    />
  );
}
