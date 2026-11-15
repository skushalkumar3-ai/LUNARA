import { useEffect, useRef } from "react";
import {
  CameraControls as DreiCameraControls,
  type CameraControls as CameraControlsApi,
} from "@react-three/drei";

import {
  OVERVIEW_CAMERA,
  TUTORIAL_STEPS,
  type TutorialLocation,
} from "./TutorialConfiguration";

interface Props {
  enabled: boolean;
  activeStep: number;
  locations: TutorialLocation[] | null;
  onOverviewReached?: () => void;
}

export default function TutorialCamera({
  enabled,
  activeStep,
  locations,
  onOverviewReached,
}: Props) {
  const controls = useRef<CameraControlsApi>(null);

  useEffect(() => {
    if (!enabled || !controls.current) return;

    let cancelled = false;
    const selectedLocation = locations?.[activeStep];

    if (activeStep >= 0) {
      if (!selectedLocation) return;
      const offset = TUTORIAL_STEPS[activeStep].cameraOffset;
      void controls.current.setLookAt(
        selectedLocation.focus[0] + offset[0],
        selectedLocation.focus[1] + offset[1],
        selectedLocation.focus[2] + offset[2],
        selectedLocation.focus[0],
        selectedLocation.focus[1],
        selectedLocation.focus[2],
        true
      );
    } else {
      const transition = controls.current.setLookAt(
        ...OVERVIEW_CAMERA.position,
        ...OVERVIEW_CAMERA.target,
        true
      );

      if (onOverviewReached) {
        void transition.then(() => {
          if (!cancelled) onOverviewReached();
        });
      }
    }

    return () => {
      cancelled = true;
    };
  }, [activeStep, enabled, locations, onOverviewReached]);

  return (
    <DreiCameraControls
      ref={controls}
      makeDefault
      enabled={false}
      minDistance={8}
      maxDistance={95}
      minPolarAngle={0.28}
      maxPolarAngle={Math.PI / 2.05}
      smoothTime={1.15}
      dollySpeed={0}
      truckSpeed={0}
    />
  );
}
