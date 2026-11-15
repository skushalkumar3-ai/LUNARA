import { create } from "zustand";

import { MISSION_EVENTS } from "../mission/MissionEvents";
import type { SystemStatus } from "../mission/types";

export type MissionPhase =
  | "phase-01-normal"
  | "phase-02-emergency"
  | "phase-03-arjun"
  | "phase-04-control"
  | "phase-05-recovery"
  | "phase-06-complete";

export interface ResourceLevels {
  oxygen: number;
  water: number;
  power: number;
  food: number;
  radiationSafety: number;
}

export interface ResourceDelta {
  oxygen: number;
  water: number;
  power: number;
  food: number;
  radiationSafety: number;
}

export interface DecisionOption {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  consequences: string;
  resourceDelta: Partial<ResourceLevels>;
  crewSafetyDelta: number;
  outcome: "positive" | "neutral" | "negative";
  setFlags: Partial<SystemStatus>;
}

export interface EmergencyEvent {
  id: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  detectedAt: string;
  crewStatus: string;
  affectedSystems: string[];
  initialFlags: Partial<SystemStatus>;
  decisions: DecisionOption[];
}

export interface MissionEventRecord {
  eventId: string;
  eventTitle: string;
  decision: DecisionOption | null;
  resourceDelta: ResourceDelta | null;
  crewSafetyAfter: number | null;
}

export interface CommandEntry {
  timestamp: string;
  action: string;
  result: string;
  type: "info" | "warning" | "success" | "critical";
}

const DEFAULT_RESOURCES: ResourceLevels = {
  oxygen: 82,
  water: 76,
  power: 91,
  food: 68,
  radiationSafety: 95,
};

const INITIAL_CREW_SAFETY = 94;

function createInitialSystemStatus(): SystemStatus {
  return {
    redWarningLights: false,
    solarArrayUnstable: false,
    astronautExposure: false,
    crewSheltered: false,
    habitatShield: false,
    backupPower: false,
    criticalSystemsMode: false,
    waterReserve: false,
    waterRepair: false,
    waterRationing: false,
    oxygenReserve: false,
    oxygenRepair: false,
    oxygenConservation: false,
    temperatureMode: "normal",
  };
}

function timestamp(): string {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

interface MissionStore {
  missionPhase: MissionPhase;
  tutorialComplete: boolean;
  currentEventIndex: number;
  missionTestMode: boolean;
  countdownStartedAt: number | null;
  countdownSeconds: number;
  recoveryDurationMs: number;
  arjunBriefingComplete: boolean;
  activeEmergency: EmergencyEvent | null;
  eventHistory: MissionEventRecord[];
  resources: ResourceLevels;
  crewSafety: number;
  systemStatus: SystemStatus;
  selectedDecision: DecisionOption | null;
  appliedResourceDelta: ResourceDelta | null;
  recoveryComplete: boolean;
  commandLog: CommandEntry[];
  showEnvironmentLabels: boolean;
  setTutorialComplete: (
    initialEventIndex?: number,
    countdownSeconds?: number,
    recoveryDurationMs?: number,
    testMode?: boolean
  ) => void;
  triggerEmergency: (event: EmergencyEvent, eventIndex: number) => void;
  beginEmergencyAssessment: () => void;
  acceptCommand: () => void;
  applyDecision: (decision: DecisionOption) => void;
  setRecoveryComplete: () => void;
  resumeOperations: () => void;
  updateResources: (delta: Partial<ResourceLevels>) => void;
  updateCrewSafety: (delta: number) => void;
  setSystemFlag: (flags: Partial<SystemStatus>) => void;
  addCommandEntry: (entry: CommandEntry) => void;
  toggleEnvironmentLabels: () => void;
  resetMission: () => void;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export const useMissionStore = create<MissionStore>((set, get) => ({
  missionPhase: "phase-01-normal",
  tutorialComplete: false,
  currentEventIndex: 0,
  missionTestMode: false,
  countdownStartedAt: null,
  countdownSeconds: 15,
  recoveryDurationMs: 1400,
  arjunBriefingComplete: false,
  activeEmergency: null,
  eventHistory: [],
  resources: { ...DEFAULT_RESOURCES },
  crewSafety: INITIAL_CREW_SAFETY,
  systemStatus: createInitialSystemStatus(),
  selectedDecision: null,
  appliedResourceDelta: null,
  recoveryComplete: false,
  commandLog: [
    {
      timestamp: "14:00:00",
      action: "SYSTEM INITIALIZED",
      result: "All outpost systems nominal",
      type: "info",
    },
    {
      timestamp: "14:12:00",
      action: "CREW ORIENTATION COMPLETE",
      result: "All five crew members confirmed at stations",
      type: "info",
    },
  ],
  showEnvironmentLabels: true,

  setTutorialComplete: (
    initialEventIndex = 0,
    countdownSeconds = 15,
    recoveryDurationMs = 1400,
    testMode = false
  ) => {
    if (get().tutorialComplete) return;
    if (
      !Number.isInteger(initialEventIndex) ||
      initialEventIndex < 0 ||
      initialEventIndex >= MISSION_EVENTS.length
    ) {
      throw new Error("The initial mission event index is out of range.");
    }
    if (
      !Number.isFinite(countdownSeconds) ||
      countdownSeconds < 0 ||
      !Number.isFinite(recoveryDurationMs) ||
      recoveryDurationMs < 0
    ) {
      throw new Error("Mission timing values must be finite and non-negative.");
    }

    set({
      tutorialComplete: true,
      currentEventIndex: initialEventIndex,
      missionTestMode: testMode,
      countdownSeconds,
      recoveryDurationMs,
      countdownStartedAt: Date.now(),
    });
  },

  triggerEmergency: (event, eventIndex) => {
    const state = get();
    if (
      !state.tutorialComplete ||
      state.missionPhase !== "phase-01-normal" ||
      state.activeEmergency
    ) {
      return;
    }
    if (eventIndex !== state.currentEventIndex) {
      throw new Error(
        `Cannot trigger event ${event.id} at index ${eventIndex}; expected ${state.currentEventIndex}.`
      );
    }
    if (state.eventHistory.some((record) => record.eventId === event.id)) {
      return;
    }

    set((current) => ({
      activeEmergency: event,
      missionPhase: "phase-02-emergency",
      countdownStartedAt: null,
      selectedDecision: null,
      appliedResourceDelta: null,
      recoveryComplete: false,
      systemStatus: {
        ...current.systemStatus,
        ...event.initialFlags,
      },
      eventHistory: [
        ...current.eventHistory,
        {
          eventId: event.id,
          eventTitle: event.title,
          decision: null,
          resourceDelta: null,
          crewSafetyAfter: null,
        },
      ],
    }));

    get().addCommandEntry({
      timestamp: timestamp(),
      action: `EMERGENCY DETECTED: ${event.title}`,
      result: "Alert broadcast to all crew members",
      type: "critical",
    });
  },

  beginEmergencyAssessment: () => {
    const state = get();
    if (state.missionPhase !== "phase-02-emergency" || !state.activeEmergency) {
      return;
    }
    set({
      missionPhase: state.arjunBriefingComplete
        ? "phase-04-control"
        : "phase-03-arjun",
    });
    get().addCommandEntry({
      timestamp: timestamp(),
      action: "SITUATION ASSESSMENT INITIATED",
      result: state.arjunBriefingComplete
        ? "Mission control is reviewing the emergency"
        : "Routing to Mission Communicator Arjun Sharma",
      type: "warning",
    });
  },

  acceptCommand: () => {
    if (get().missionPhase !== "phase-03-arjun") return;
    set({ arjunBriefingComplete: true, missionPhase: "phase-04-control" });
    get().addCommandEntry({
      timestamp: timestamp(),
      action: "COMMAND AUTHORITY ACCEPTED",
      result: "Mission control interface activated — user assuming coordination role",
      type: "success",
    });
  },

  updateResources: (delta) => {
    set((state) => ({
      resources: {
        oxygen: clamp(state.resources.oxygen + (delta.oxygen ?? 0)),
        water: clamp(state.resources.water + (delta.water ?? 0)),
        power: clamp(state.resources.power + (delta.power ?? 0)),
        food: clamp(state.resources.food + (delta.food ?? 0)),
        radiationSafety: clamp(
          state.resources.radiationSafety + (delta.radiationSafety ?? 0)
        ),
      },
    }));
  },

  updateCrewSafety: (delta) => {
    set((state) => ({ crewSafety: clamp(state.crewSafety + delta) }));
  },

  setSystemFlag: (flags) =>
    set((state) => ({
      systemStatus: { ...state.systemStatus, ...flags },
    })),

  applyDecision: (decision) => {
    const state = get();
    if (
      state.missionPhase !== "phase-04-control" ||
      !state.activeEmergency ||
      state.selectedDecision
    ) {
      return;
    }
    if (!state.activeEmergency.decisions.some((option) => option.id === decision.id)) {
      throw new Error(
        `Decision "${decision.id}" is not available for ${state.activeEmergency.id}.`
      );
    }

    const nextResources: ResourceLevels = {
      oxygen: clamp(state.resources.oxygen + (decision.resourceDelta.oxygen ?? 0)),
      water: clamp(state.resources.water + (decision.resourceDelta.water ?? 0)),
      power: clamp(state.resources.power + (decision.resourceDelta.power ?? 0)),
      food: clamp(state.resources.food + (decision.resourceDelta.food ?? 0)),
      radiationSafety: clamp(
        state.resources.radiationSafety +
          (decision.resourceDelta.radiationSafety ?? 0)
      ),
    };
    const actualDelta: ResourceDelta = {
      oxygen: nextResources.oxygen - state.resources.oxygen,
      water: nextResources.water - state.resources.water,
      power: nextResources.power - state.resources.power,
      food: nextResources.food - state.resources.food,
      radiationSafety:
        nextResources.radiationSafety - state.resources.radiationSafety,
    };
    const crewSafety = clamp(state.crewSafety + decision.crewSafetyDelta);
    const latestRecord = state.eventHistory[state.eventHistory.length - 1];
    if (!latestRecord || latestRecord.eventId !== state.activeEmergency.id) {
      throw new Error("The active emergency is missing from the mission history.");
    }

    set({
      resources: nextResources,
      crewSafety,
      systemStatus: { ...state.systemStatus, ...decision.setFlags },
      selectedDecision: decision,
      appliedResourceDelta: actualDelta,
      missionPhase: "phase-05-recovery",
      recoveryComplete: false,
      eventHistory: [
        ...state.eventHistory.slice(0, -1),
        {
          ...latestRecord,
          decision,
          resourceDelta: actualDelta,
          crewSafetyAfter: crewSafety,
        },
      ],
    });

    get().addCommandEntry({
      timestamp: timestamp(),
      action: `DECISION EXECUTED: ${decision.shortLabel}`,
      result: decision.consequences,
      type: decision.outcome === "negative" ? "warning" : "success",
    });
  },

  setRecoveryComplete: () => {
    if (get().missionPhase === "phase-05-recovery") {
      set({ recoveryComplete: true });
    }
  },

  resumeOperations: () => {
    const state = get();
    if (
      state.missionPhase !== "phase-05-recovery" ||
      !state.selectedDecision ||
      !state.recoveryComplete
    ) {
      return;
    }

    const nextEventIndex = state.currentEventIndex + 1;
    const missionComplete =
      state.missionTestMode || nextEventIndex >= MISSION_EVENTS.length;

    get().addCommandEntry({
      timestamp: timestamp(),
      action: missionComplete
        ? state.missionTestMode
          ? "MISSION EVENT TEST COMPLETE"
          : "MISSION COMPLETED"
        : "RECOVERY COMPLETE",
      result: missionComplete
        ? state.missionTestMode
          ? "The selected emergency scenario has been resolved"
          : "All scheduled emergencies have been resolved"
        : "Outpost operations resumed; monitoring for the next event",
      type: "success",
    });

    set({
      missionPhase: missionComplete ? "phase-06-complete" : "phase-01-normal",
      currentEventIndex: nextEventIndex,
      countdownStartedAt: missionComplete ? null : Date.now(),
      activeEmergency: null,
      selectedDecision: null,
      appliedResourceDelta: null,
      recoveryComplete: false,
    });
  },

  addCommandEntry: (entry) =>
    set((state) => ({
      commandLog: [entry, ...state.commandLog].slice(0, 40),
    })),

  toggleEnvironmentLabels: () =>
    set((state) => ({ showEnvironmentLabels: !state.showEnvironmentLabels })),

  resetMission: () =>
    set({
      missionPhase: "phase-01-normal",
      tutorialComplete: false,
      currentEventIndex: 0,
      missionTestMode: false,
      countdownStartedAt: null,
      countdownSeconds: 15,
      recoveryDurationMs: 1400,
      arjunBriefingComplete: false,
      activeEmergency: null,
      eventHistory: [],
      resources: { ...DEFAULT_RESOURCES },
      crewSafety: INITIAL_CREW_SAFETY,
      systemStatus: createInitialSystemStatus(),
      selectedDecision: null,
      appliedResourceDelta: null,
      recoveryComplete: false,
      commandLog: [],
      showEnvironmentLabels: true,
    }),
}));
