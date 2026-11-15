import { useEffect, useRef } from "react";
import { CameraControls, type CameraControls as CameraControlsApi } from "@react-three/drei";
import { OVERVIEW_CAMERA } from "./TutorialConfiguration";

export default function MissionCompletionCamera() {
  const controls = useRef<CameraControlsApi>(null);
  useEffect(() => {
    if (!controls.current) return;
    void controls.current.setLookAt(
      ...OVERVIEW_CAMERA.position,
      ...OVERVIEW_CAMERA.target,
      true
    );
  }, []);
  return <CameraControls ref={controls} makeDefault minDistance={22} maxDistance={140} smoothTime={1.15} />;
}
