import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import LunarBase from "../scenes/LunarBase";
import { TUTORIAL_STEPS } from "../scenes/TutorialConfiguration";
import OutpostDashboard from "./OutpostDashboard";
import TutorialInfoPanel from "./TutorialInfoPanel";
import WelcomeScreen from "./WelcomeScreen";
import MissionTimer from "../mission/MissionTimer";
import EmergencyAlert from "../mission/EmergencyAlert";
import ArjunIntroPanel from "../mission/ArjunIntroPanel";
import MissionControlPanel from "../mission/MissionControlPanel";
import MissionOutcomeReport from "../mission/MissionOutcomeReport";
import ResourceTelemetry from "../mission/ResourceTelemetry";
import MissionCompletionReport from "../mission/MissionCompletionReport";
import { getMissionDeveloperSettings } from "../mission/MissionEvents";

import { useMissionStore } from "../store/missionStore";

type TutorialPhase = "welcome" | "orientation" | "zooming-out" | "complete" | "outpost";

export default function SurfaceTutorial() {
  // ── Tutorial-level phase (preserved exactly) ───────────────────────────────
  const [phase, setPhase] = useState<TutorialPhase>("welcome");
  const [activeStep, setActiveStep] = useState(0);
  const [panelRevealActive, setPanelRevealActive] = useState(false);
  const [panelRevealRemaining, setPanelRevealRemaining] = useState(10);
  const pendingMissionSettings = useRef<ReturnType<typeof getMissionDeveloperSettings> | null>(null);
  const tutorialPanelRef = useRef<HTMLDivElement>(null);

  const cameraMode =
    phase === "orientation" || phase === "zooming-out" ? "tutorial" : "outpost";

  // ── Mission store ─────────────────────────────────────────────────────────
  const missionPhase = useMissionStore((s) => s.missionPhase);
  const setTutorialComplete = useMissionStore((s) => s.setTutorialComplete);
  const systemStatus = useMissionStore((s) => s.systemStatus);

  // ── Arjun camera state ────────────────────────────────────────────────────
  const [arjunPanelVisible, setArjunPanelVisible] = useState(false);
  const [selectedCrewPosition, setSelectedCrewPosition] = useState<[number, number, number] | null>(null);

  useEffect(() => {
    const onCrewTarget = (event: Event) => {
      const position = (event as CustomEvent<{ position?: number[] }>).detail?.position;
      if (position?.length === 3) setSelectedCrewPosition([position[0], position[1], position[2]]);
    };
    const onOutpostReturn = () => setSelectedCrewPosition(null);
    const onMissionRestart = () => {
      setSelectedCrewPosition(null);
      pendingMissionSettings.current = null;
      setPanelRevealActive(false);
      setActiveStep(0);
      setPhase("welcome");
    };
    window.addEventListener("lunara:crew-camera-target", onCrewTarget);
    window.addEventListener("lunara:return-to-outpost-camera", onOutpostReturn);
    window.addEventListener("lunara:restart-mission-flow", onMissionRestart);
    return () => {
      window.removeEventListener("lunara:crew-camera-target", onCrewTarget);
      window.removeEventListener("lunara:return-to-outpost-camera", onOutpostReturn);
      window.removeEventListener("lunara:restart-mission-flow", onMissionRestart);
    };
  }, []);

  useEffect(() => {
    if (!panelRevealActive) return;
    const revealStartedAt = Date.now();
    const intervalId = window.setInterval(() => {
      setPanelRevealRemaining(Math.max(0, Math.ceil((revealStartedAt + 10_000 - Date.now()) / 1000)));
    }, 200);
    const timeoutId = window.setTimeout(() => {
      const settings = pendingMissionSettings.current;
      pendingMissionSettings.current = null;
      setPanelRevealRemaining(0);
      setPanelRevealActive(false);
      if (settings) {
        setTutorialComplete(settings.initialEventIndex, settings.countdownSeconds, settings.recoveryDurationMs, settings.testMode);
      }
    }, 10_000);
    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [panelRevealActive, setTutorialComplete]);

  // ── Tutorial actions (preserved) ──────────────────────────────────────────
  const onOverviewReached = useCallback(() => {
    setPhase((current) => (current === "zooming-out" ? "complete" : current));
  }, []);

  function startOrientation() {
    setActiveStep(0);
    setPhase("orientation");
  }

  function goNext() {
    if (activeStep < TUTORIAL_STEPS.length - 1) {
      setActiveStep((current) => current + 1);
    } else {
      setPhase("zooming-out");
    }
  }

  function goBack() {
    setActiveStep((current) => Math.max(0, current - 1));
  }

  // ── Tutorial marker position handler (preserved) ──────────────────────────
  const onMarkerPositionChange = useCallback(
    (x: number, y: number, width: number, height: number, visible: boolean) => {
      const panel = tutorialPanelRef.current;
      if (!panel) return;
      if (!visible) {
        panel.style.visibility = "hidden";
        return;
      }

      const margin = 12;
      const gap = 16;
      const cardWidth = panel.offsetWidth;
      const cardHeight = panel.offsetHeight;
      const preferredLeft =
        x - cardWidth - gap >= margin ? x - cardWidth - gap : x + gap;
      const preferredTop =
        y - cardHeight - gap >= margin ? y - cardHeight - gap : y + gap;
      const left = Math.max(
        margin,
        Math.min(preferredLeft, width - cardWidth - margin)
      );
      const top = Math.max(
        margin,
        Math.min(preferredTop, height - cardHeight - margin)
      );
      panel.style.visibility = "visible";
      panel.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    },
    []
  );

  // ── Enter outpost (tutorial complete → phase-01-normal) ───────────────────
  function enterOutpost() {
    setPhase("outpost");
    pendingMissionSettings.current = getMissionDeveloperSettings(window.location.search);
    setPanelRevealRemaining(10);
    setPanelRevealActive(true);
  }

  // ── Arjun camera callbacks ────────────────────────────────────────────────
  const handleArjunFocusComplete = useCallback(() => {
    setArjunPanelVisible(true);
  }, []);

  // ── Derived state ─────────────────────────────────────────────────────────
  const isMissionControlPhase =
    missionPhase === "phase-04-control" ||
    missionPhase === "phase-05-recovery" ||
    missionPhase === "phase-06-complete";

  // ── Root element class (emergency theming) ────────────────────────────────
  const isEmergency =
    missionPhase === "phase-02-emergency" ||
    missionPhase === "phase-03-arjun";
  const isChallengePhase =
    missionPhase === "phase-02-emergency" ||
    missionPhase === "phase-03-arjun" ||
    missionPhase === "phase-04-control" ||
    missionPhase === "phase-05-recovery";

  return (
    <main
      className={`relative isolate h-screen w-full overflow-hidden bg-[#101827] text-white ${isEmergency ? "emergency-active" : ""}`}
    >
      {/* ── 3D Environment ─────────────────────────────────────────────── */}
      {/* Always mounted; resizes to 65% in mission control split-screen   */}
      <div
        className={`absolute inset-y-0 left-0 z-0 transition-[width] duration-500 ${
          isMissionControlPhase ? "right-auto" : "right-0"
        }`}
        style={
          missionPhase === "phase-06-complete"
            ? { width: "100%" }
            : isMissionControlPhase
              ? { width: "65%" }
              : undefined
        }
      >
        {/* Cyan glow border during mission control */}
        {isMissionControlPhase && (
          <div className="scene-live-border pointer-events-none absolute inset-0 z-10" />
        )}
        {/* LIVE status chip */}
        {isMissionControlPhase && (
          <div data-screen-obstacle="true" className="scene-live-chip absolute bottom-3 left-3 z-20">
            <span className="scene-live-dot" />
            LIVE LUNAR ENVIRONMENT · SYSTEM ACTIVE
          </div>
        )}

        <LunarBase
          cameraMode={cameraMode}
          activeTutorialStep={phase === "orientation" ? activeStep : -1}
          missionPhase={missionPhase}
          onOverviewReached={onOverviewReached}
          onMarkerPositionChange={onMarkerPositionChange}
          onArjunFocusComplete={handleArjunFocusComplete}
          systemStatus={systemStatus}
          selectedCrewPosition={selectedCrewPosition}
        />
      </div>

      {/* ── Mission Control right panel ────────────────────────────────── */}
      {isMissionControlPhase && missionPhase !== "phase-06-complete" && (
        <div data-screen-obstacle="true" className="mission-control-right absolute inset-y-0 right-0 z-30" style={{ width: "35%" }}>
          {missionPhase === "phase-04-control" && <MissionControlPanel />}
          {missionPhase === "phase-05-recovery" && (
            <div className="flex h-full flex-col">
              <MissionOutcomeReport />
            </div>
          )}
        </div>
      )}

      {missionPhase === "phase-06-complete" && <MissionCompletionReport />}

      {/* ── Resource telemetry (bottom bar in mission control phases) ───── */}
      {isMissionControlPhase && missionPhase !== "phase-06-complete" && (
        <div data-screen-obstacle="true" className="resource-telemetry-bar absolute bottom-0 left-0 z-30" style={{ width: "65%" }}>
          <ResourceTelemetry showDeltas={missionPhase === "phase-05-recovery"} />
        </div>
      )}

      {/* ── Tutorial screens (preserved exactly) ───────────────────────── */}
      <WelcomeScreen
        visible={phase === "welcome"}
        onStart={startOrientation}
        onSkip={enterOutpost}
      />

      {phase === "orientation" && (
        <div
          ref={tutorialPanelRef}
          className="tutorial-panel-positioner z-20"
          style={{ visibility: "hidden" }}
        >
          <TutorialInfoPanel
            key={activeStep}
            step={TUTORIAL_STEPS[activeStep]}
            index={activeStep}
            total={TUTORIAL_STEPS.length}
            onBack={goBack}
            onNext={goNext}
          />
        </div>
      )}

      {phase === "zooming-out" && (
        <div className="absolute bottom-7 left-8 z-20 border-l border-cyan-200/50 pl-3 text-[9px] tracking-[0.2em] text-cyan-100/80">
          RETURNING TO OUTPOST VIEW
        </div>
      )}

      {phase === "complete" && (
        <section
          data-screen-obstacle="true"
          className="absolute inset-0 z-30 flex items-center justify-center bg-[#07111e]/30 p-5"
        >
          <div className="w-full max-w-md border border-cyan-200/20 bg-[#071321]/90 p-7 text-center shadow-[0_24px_100px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-9">
            <CheckCircle2 size={34} className="mx-auto text-cyan-200" />
            <p className="mt-5 text-[10px] tracking-[0.24em] text-cyan-200">
              LUNAR ORIENTATION COMPLETE
            </p>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Your introduction to the lunar research environment is complete.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={enterOutpost}
                className="border border-cyan-100/50 bg-cyan-200/15 px-5 py-3 text-[10px] font-semibold tracking-[0.17em] text-cyan-50 transition hover:bg-cyan-200/25"
              >
                RETURN TO OUTPOST
              </button>
              <button
                type="button"
                onClick={startOrientation}
                className="border border-white/15 px-5 py-3 text-[10px] tracking-[0.17em] text-slate-300 transition hover:border-white/35 hover:text-white"
              >
                RESTART ORIENTATION
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Normal outpost dashboard (phase-01-normal only) ─────────────── */}
      {phase === "outpost" && missionPhase !== "phase-06-complete" && (
        <OutpostDashboard challengeActive={isChallengePhase} panelRevealActive={panelRevealActive} />
      )}

      {phase === "outpost" && panelRevealActive && (
        <section className="mission-activation-intro" data-screen-obstacle="true" aria-live="polite">
          <span>LUNARA · MISSION SYSTEMS ONLINE</span>
          <strong>TRANSITION TO LIVE OPERATIONS</strong>
          <small>LAUNCH SEQUENCE BEGINS IN {panelRevealRemaining}</small>
          <i><b style={{ transform: `scaleX(${(10 - panelRevealRemaining) / 10})` }} /></i>
        </section>
      )}

      {/* ── Mission timer (starts counting after orientation) ────────────── */}
      {phase === "outpost" && <MissionTimer />}

      {/* ── Phase 02 — Emergency alert overlay ──────────────────────────── */}
      {missionPhase === "phase-02-emergency" && <EmergencyAlert />}

      {/* ── Phase 03 — Arjun intro panel ────────────────────────────────── */}
      {missionPhase === "phase-03-arjun" && (
        <ArjunIntroPanel visible={arjunPanelVisible} />
      )}
    </main>
  );
}
