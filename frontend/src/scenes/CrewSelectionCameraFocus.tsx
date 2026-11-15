import { useEffect, useRef } from "react";
import { CameraControls, type CameraControls as CameraControlsApi } from "@react-three/drei";

export default function CrewSelectionCameraFocus({ target }: { target: [number, number, number] | null }) {
  const controls = useRef<CameraControlsApi>(null);
  useEffect(() => {
    if (!target || !controls.current) return;
    const [x, y, z] = target;
    void controls.current.setLookAt(x + 8, y + 5, z + 10, x, y + 1.2, z, true);
  }, [target]);
  if (!target) return null;
  return <CameraControls ref={controls} makeDefault minDistance={7} maxDistance={45} smoothTime={0.8} />;
}
