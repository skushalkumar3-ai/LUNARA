
import { useEffect, useRef } from "react";

interface LaunchSequenceProps {
  onComplete: () => void;
}

function LaunchSequence({ onComplete }: LaunchSequenceProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.source !== frameRef.current?.contentWindow) return;

      if (event.data?.type === "LUNARA_LAUNCH_COMPLETE") {
        onComplete();
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [onComplete]);

  return (
    <iframe
      ref={frameRef}
      src="/launch/index.html"
      title="LUNARA Cinematic Launch Sequence"
      allow="autoplay"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        border: "none",
        display: "block",
      }}
    />
  );
}

export default LaunchSequence;
