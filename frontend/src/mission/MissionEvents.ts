import type { DecisionOption, EmergencyEvent } from "../store/missionStore";
import type { SystemStatus } from "./types";

const decision = (
  id: string,
  label: string,
  shortLabel: string,
  description: string,
  consequences: string,
  resourceDelta: DecisionOption["resourceDelta"],
  crewSafetyDelta: number,
  outcome: DecisionOption["outcome"],
  setFlags: Partial<SystemStatus>
): DecisionOption => ({
  id,
  label,
  shortLabel,
  description,
  consequences,
  resourceDelta,
  crewSafetyDelta,
  outcome,
  setFlags,
});

export const MISSION_EVENTS: EmergencyEvent[] = [
  {
    id: "solar-radiation",
    title: "SOLAR RADIATION EMERGENCY",
    severity: "HIGH",
    description:
      "A solar proton event is raising radiation levels across the landing site. Crew outside the habitat are exposed and external operations must be reviewed.",
    detectedAt: "MISSION DAY 001 · 14:32:17 UTC",
    crewStatus: "ELEVATED RISK — EXTERNAL OPS SUSPENDED",
    affectedSystems: ["Radiation shielding", "EVA operations", "Solar array"],
    initialFlags: {
      redWarningLights: true,
      solarArrayUnstable: true,
      astronautExposure: true,
    },
    decisions: [
      decision(
        "solar-shelter",
        "OPTION A — MOVE CREW TO RADIATION SHELTER",
        "CREW SHELTER PROTOCOL",
        "Move the crew into the main habitat and suspend external operations until the radiation spike passes.",
        "Crew exposure is reduced. Life support uses additional oxygen and water while exterior work is paused.",
        { oxygen: -3, water: -2, power: -4, radiationSafety: 14 },
        13,
        "positive",
        {
          astronautExposure: false,
          crewSheltered: true,
          redWarningLights: false,
        }
      ),
      decision(
        "solar-shielding",
        "OPTION B — ACTIVATE EMERGENCY SHIELDING",
        "EMERGENCY SHIELDING ACTIVE",
        "Power the habitat shielding system to protect the crew while the solar event is in progress.",
        "Radiation protection improves substantially at a high power cost; the shield remains active.",
        { oxygen: -1, water: -1, power: -18, radiationSafety: 25 },
        20,
        "positive",
        {
          habitatShield: true,
          astronautExposure: false,
          crewSheltered: false,
          redWarningLights: false,
        }
      ),
      decision(
        "solar-continue",
        "OPTION C — CONTINUE NORMAL OPERATIONS",
        "NORMAL OPERATIONS CONTINUE",
        "Keep the crew at their current stations and monitor radiation levels without taking protective action.",
        "No supplies are spent, but crew exposure continues and radiation safety falls.",
        { oxygen: 0, water: 0, power: 0, radiationSafety: -24 },
        -22,
        "negative",
        { astronautExposure: true, redWarningLights: true }
      ),
    ],
  },
  {
    id: "power-failure",
    title: "POWER SYSTEM FAILURE",
    severity: "CRITICAL",
    description:
      "The outpost power bus has dropped below its safe operating threshold. Habitat systems remain online, but reserve capacity is falling.",
    detectedAt: "MISSION DAY 001 · 15:06:42 UTC",
    crewStatus: "CREW SAFE — POWER RESERVES DECLINING",
    affectedSystems: ["Power bus", "Solar array", "Habitat lighting"],
    initialFlags: { redWarningLights: true, solarArrayUnstable: true },
    decisions: [
      decision(
        "power-backup",
        "OPTION A — SWITCH TO BACKUP POWER",
        "BACKUP POWER ENGAGED",
        "Transfer critical habitat loads to the backup power bank while isolating the unstable bus.",
        "Power availability stabilizes, but reserve charge is consumed to keep life support online.",
        { oxygen: -1, water: 0, power: 7, food: 0, radiationSafety: 0 },
        5,
        "positive",
        {
          backupPower: true,
          solarArrayUnstable: false,
          redWarningLights: false,
          criticalSystemsMode: false,
        }
      ),
      decision(
        "power-prioritize",
        "OPTION B — PRIORITIZE CRITICAL SYSTEMS",
        "CRITICAL LOADS PRIORITIZED",
        "Reduce nonessential habitat loads and route available power to life support and communications.",
        "Power is conserved at the cost of comfort and noncritical research activity.",
        { oxygen: 0, water: -1, power: 11, food: -1, radiationSafety: 0 },
        2,
        "neutral",
        {
          criticalSystemsMode: true,
          redWarningLights: false,
        }
      ),
      decision(
        "power-repair-array",
        "OPTION C — ATTEMPT SOLAR ARRAY RECOVERY",
        "SOLAR ARRAY RECOVERY",
        "Rebalance the solar array and reconnect the affected power channel.",
        "Generation recovers without drawing on backup reserves, but the repair consumes water and exposes crew to field work.",
        { oxygen: -1, water: -2, power: 15, food: 0, radiationSafety: 0 },
        -3,
        "neutral",
        {
          solarArrayUnstable: false,
          backupPower: false,
          criticalSystemsMode: false,
          redWarningLights: false,
        }
      ),
    ],
  },
  {
    id: "water-recycling",
    title: "WATER RECYCLING FAILURE",
    severity: "HIGH",
    description:
      "The water recovery loop has stopped producing potable water. Storage is still available, but the outpost must protect its remaining supply.",
    detectedAt: "MISSION DAY 001 · 16:18:09 UTC",
    crewStatus: "CREW SAFE — POTABLE WATER PRODUCTION INTERRUPTED",
    affectedSystems: ["Water recovery loop", "Potable water storage", "Greenhouse"],
    initialFlags: { redWarningLights: true },
    decisions: [
      decision(
        "water-reserves",
        "OPTION A — ACTIVATE EMERGENCY WATER RESERVES",
        "WATER RESERVES ACTIVE",
        "Switch the habitat to its sealed emergency water reserve while isolating the failed recovery loop.",
        "Usable water rises immediately, but stored reserve capacity is reduced.",
        { oxygen: 0, water: 18, power: -5, food: 0, radiationSafety: 0 },
        6,
        "positive",
        {
          waterReserve: true,
          waterRepair: false,
          waterRationing: false,
          redWarningLights: false,
        }
      ),
      decision(
        "water-repair",
        "OPTION B — INITIATE RECYCLING SYSTEM REPAIR",
        "WATER LOOP REPAIR ACTIVE",
        "Send the engineering crew to restore filtration and restart the water recovery loop.",
        "The repair restores some water production and costs power while equipment is restarted.",
        { oxygen: -1, water: 11, power: -8, food: 0, radiationSafety: 0 },
        9,
        "positive",
        {
          waterRepair: true,
          waterReserve: false,
          waterRationing: false,
          redWarningLights: false,
        }
      ),
      decision(
        "water-ration",
        "OPTION C — IMPLEMENT WATER RATIONING",
        "WATER RATIONING ACTIVE",
        "Reduce nonessential water use and reserve potable supply for life support and crew needs.",
        "The supply lasts longer, but greenhouse output and crew comfort are reduced.",
        { oxygen: 0, water: 5, power: 2, food: -3, radiationSafety: 0 },
        -4,
        "neutral",
        {
          waterRationing: true,
          waterReserve: false,
          waterRepair: false,
          redWarningLights: false,
        }
      ),
    ],
  },
  {
    id: "oxygen-supply",
    title: "OXYGEN SUPPLY MALFUNCTION",
    severity: "CRITICAL",
    description:
      "The oxygen generation controller is reporting an unstable output. Current cabin levels are safe, but the reserve margin is shrinking.",
    detectedAt: "MISSION DAY 001 · 17:04:31 UTC",
    crewStatus: "CREW SAFE — OXYGEN OUTPUT UNSTABLE",
    affectedSystems: ["Oxygen generator", "Habitat atmosphere", "Life support"],
    initialFlags: { redWarningLights: true },
    decisions: [
      decision(
        "oxygen-reserves",
        "OPTION A — ACTIVATE EMERGENCY OXYGEN RESERVES",
        "OXYGEN RESERVES ACTIVE",
        "Route the habitat breathing loop to the emergency oxygen tanks and isolate the unstable generator.",
        "Cabin oxygen margin improves immediately, using the sealed reserve supply.",
        { oxygen: 16, water: 0, power: -4, food: 0, radiationSafety: 0 },
        8,
        "positive",
        {
          oxygenReserve: true,
          oxygenRepair: false,
          oxygenConservation: false,
          redWarningLights: false,
        }
      ),
      decision(
        "oxygen-repair",
        "OPTION B — REPAIR OXYGEN GENERATION",
        "OXYGEN GENERATOR REPAIR",
        "Have the crew repair the oxygen controller and restart the primary generation loop.",
        "Production recovers without using the full reserve, but repairs consume power and water.",
        { oxygen: 12, water: -2, power: -9, food: 0, radiationSafety: 0 },
        10,
        "positive",
        {
          oxygenRepair: true,
          oxygenReserve: false,
          oxygenConservation: false,
          redWarningLights: false,
        }
      ),
      decision(
        "oxygen-conserve",
        "OPTION C — REDUCE HABITAT OXYGEN CONSUMPTION",
        "OXYGEN CONSERVATION ACTIVE",
        "Suspend nonessential activity and reduce habitat consumption until the generator is stable.",
        "Oxygen is conserved, but crew activity and research output are constrained.",
        { oxygen: 7, water: 0, power: 3, food: -2, radiationSafety: 0 },
        -5,
        "neutral",
        {
          oxygenConservation: true,
          oxygenReserve: false,
          oxygenRepair: false,
          redWarningLights: false,
        }
      ),
    ],
  },
  {
    id: "habitat-temperature",
    title: "HABITAT TEMPERATURE FAILURE",
    severity: "HIGH",
    description:
      "A thermal-control fault is pushing the habitat outside its preferred operating range. Crew health and sensitive equipment are at risk if the fault persists.",
    detectedAt: "MISSION DAY 001 · 18:12:56 UTC",
    crewStatus: "CREW SAFE — THERMAL CONTROL OUTSIDE NOMINAL RANGE",
    affectedSystems: ["Thermal control", "Main habitat", "Research equipment"],
    initialFlags: { redWarningLights: true, temperatureMode: "emergency" },
    decisions: [
      decision(
        "temperature-support",
        "OPTION A — ACTIVATE EMERGENCY THERMAL CONTROL",
        "EMERGENCY THERMAL CONTROL",
        "Use the emergency heating and cooling loop to return the occupied habitat to a safe temperature.",
        "Crew protection improves, but thermal control draws heavily on the remaining power supply.",
        { oxygen: -1, water: -1, power: -13, food: 0, radiationSafety: 0 },
        11,
        "positive",
        {
          temperatureMode: "support",
          criticalSystemsMode: false,
          redWarningLights: false,
        }
      ),
      decision(
        "temperature-isolate",
        "OPTION B — ISOLATE THE AFFECTED HABITAT MODULE",
        "HABITAT MODULE ISOLATED",
        "Seal the affected module and move the crew into the thermally stable section of the habitat.",
        "The active crew area remains safer, while usable habitat space and research capacity are reduced.",
        { oxygen: -2, water: -1, power: -4, food: -1, radiationSafety: 0 },
        4,
        "positive",
        {
          temperatureMode: "isolated",
          crewSheltered: true,
          redWarningLights: false,
        }
      ),
      decision(
        "temperature-conserve",
        "OPTION C — REDUCE POWER CONSUMPTION",
        "THERMAL CONSERVATION ACTIVE",
        "Reduce nonessential power draw and preserve energy for the habitat's core thermal controls.",
        "Power reserves improve, but habitat temperature remains outside its preferred range.",
        { oxygen: 0, water: -2, power: 8, food: -2, radiationSafety: 0 },
        -8,
        "negative",
        {
          temperatureMode: "conserve",
          criticalSystemsMode: true,
          redWarningLights: true,
        }
      ),
    ],
  },
];

export const DEFAULT_COUNTDOWN_SECONDS = 15;
export const DEFAULT_RECOVERY_DURATION_MS = 1400;

export interface MissionDeveloperSettings {
  testMode: boolean;
  initialEventIndex: number;
  countdownSeconds: number;
  recoveryDurationMs: number;
}

export function getMissionDeveloperSettings(search: string): MissionDeveloperSettings {
  const defaults: MissionDeveloperSettings = {
    testMode: false,
    initialEventIndex: 0,
    countdownSeconds: DEFAULT_COUNTDOWN_SECONDS,
    recoveryDurationMs: DEFAULT_RECOVERY_DURATION_MS,
  };

  if (!import.meta.env.DEV) return defaults;

  const params = new URLSearchParams(search);
  const eventId = params.get("missionEvent");
  if (eventId) {
    const eventIndex = MISSION_EVENTS.findIndex((event) => event.id === eventId);
    if (eventIndex < 0) {
      console.warn(`Unknown missionEvent "${eventId}"; starting at the first event.`);
    } else {
      defaults.testMode = true;
      defaults.initialEventIndex = eventIndex;
    }
  }

  const readDuration = (key: string, fallback: number) => {
    const rawValue = params.get(key);
    if (rawValue === null) return fallback;
    const value = Number(rawValue);
    if (!Number.isFinite(value) || value < 0) {
      console.warn(`Invalid ${key} value "${rawValue}"; using ${fallback}.`);
      return fallback;
    }
    return value;
  };

  defaults.countdownSeconds = readDuration(
    "missionCountdown",
    defaults.countdownSeconds
  );
  defaults.recoveryDurationMs = readDuration(
    "missionRecovery",
    defaults.recoveryDurationMs
  );
  return defaults;
}
