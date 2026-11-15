interface CrewMember {
  id: number;
  name: string;
  role: string;
  responsibilities: string;
  activity: string;
  offset: [number, number];
  labelClass?: string;
  rotation: number;
  patrolRadius: number;
  speed: number;
}

export const CREW_ROSTER: CrewMember[] = [
  { id: 1, name: "Alex Morgan", role: "Mission Commander", responsibilities: "Leads the lunar mission and coordinates the crew.", activity: "Coordinating outpost operations", offset: [-37, -18] as [number, number], labelClass: "crew-marker--shift-right", rotation: 0.4, patrolRadius: 3.5, speed: 0.16 },
  { id: 2, name: "Dr. Sarah Williams", role: "Lunar Geologist", responsibilities: "Collects lunar samples and studies geological formations.", activity: "Surveying nearby geological formations", offset: [-37, 22] as [number, number], labelClass: "crew-marker--shift-left", rotation: 1.2, patrolRadius: 2.5, speed: 0.12 },
  { id: 3, name: "Michael Carter", role: "Lunar Engineer", responsibilities: "Maintains the habitat, equipment and solar systems.", activity: "Inspecting habitat systems", offset: [0, -38] as [number, number], rotation: Math.PI, patrolRadius: 3, speed: 0.14 },
  { id: 4, name: "David Brooks", role: "Lunar Rover Pilot", responsibilities: "Operates the rover and explores distant lunar regions.", activity: "Preparing a rover survey route", offset: [43, 25] as [number, number], rotation: -0.6, patrolRadius: 5, speed: 0.18 },
  { id: 5, name: "Arjun Sharma", role: "Communicator", responsibilities: "Monitors base systems and manages mission communications.", activity: "Monitoring life-support telemetry", offset: [43, -22] as [number, number], rotation: Math.PI / 2, patrolRadius: 2, speed: 0.1 },
] as const;
