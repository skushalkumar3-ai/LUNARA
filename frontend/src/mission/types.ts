export interface SystemStatus {
  redWarningLights: boolean;
  solarArrayUnstable: boolean;
  astronautExposure: boolean;
  crewSheltered: boolean;
  habitatShield: boolean;
  backupPower: boolean;
  criticalSystemsMode: boolean;
  waterReserve: boolean;
  waterRepair: boolean;
  waterRationing: boolean;
  oxygenReserve: boolean;
  oxygenRepair: boolean;
  oxygenConservation: boolean;
  temperatureMode:
    | "normal"
    | "emergency"
    | "support"
    | "isolated"
    | "conserve";
}
