interface Props {
  seconds: number;
  exploration?: boolean;
}

const EXPLORATION_MESSAGE =
  "MISSION SYSTEMS STABLE — ENJOY EXPLORING THE LUNAR OUTPOST WHILE THE NEXT MISSION PREPARES.";

export default function CountdownOverlay({
  seconds,
  exploration = false,
}: Props) {
  const isWarning = seconds <= 5;
  const formatted = `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  return (
    <div
      className={`countdown-overlay ${exploration ? "countdown-overlay--exploration" : ""}`}
      aria-live="polite"
    >
      <div
        data-screen-obstacle="true"
        className={`countdown-overlay__content ${exploration ? "countdown-overlay__content--exploration" : ""}`}
      >
        {exploration ? (
          <>
            <div className="countdown-overlay__exploration-message">
              {EXPLORATION_MESSAGE}
            </div>
            <div className="countdown-overlay__next-event">
              <span>NEXT EMERGENCY IN</span>
              <span
                className={`countdown-overlay__timer ${isWarning ? "countdown-overlay__timer--warning" : ""}`}
              >
                {formatted}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="countdown-overlay__label">
              NORMAL OPERATIONS – SOLAR ACTIVITY MONITORING
            </div>
            <div
              className={`countdown-overlay__timer ${isWarning ? "countdown-overlay__timer--warning" : ""}`}
            >
              {formatted}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
