import * as THREE from "three";

import {
  findFlatColonySite,
  sampleTerrainHeight,
  type TerrainMetadata,
} from "./colonyPlacement";

export type TutorialPoint = [number, number, number];

type SurfaceTargetConfig = {
  type: "surface";
  offset: [number, number];
};

type ModelTargetConfig = {
  type: "model";
  nodeName: string;
};

export interface TutorialStep {
  title: string;
  category: string;
  description: string;
  purpose: string;
  target: SurfaceTargetConfig | ModelTargetConfig;
  cameraOffset: TutorialPoint;
}

export interface TutorialLocation {
  focus: TutorialPoint;
  marker: TutorialPoint;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "LUNAR SURFACE",
    category: "TERRAIN & ELEVATION",
    description:
      "NASA LOLA elevation data shapes the local ridges, depressions and cratered relief.",
    purpose: "Surface features guide outpost siting and field research.",
    target: { type: "surface", offset: [-38, 0] },
    cameraOffset: [18, 13, 20],
  },
  {
    title: "MAIN HABITAT",
    category: "HABITATION SYSTEM",
    description:
      "The rigid-cylinder habitat is the outpost's primary enclosed living and research module.",
    purpose: "Provides protected space for research and accommodation.",
    target: { type: "model", nodeName: "001-rigid-cylinder-habitat" },
    cameraOffset: [13, 10, 16],
  },
  {
    title: "GREENHOUSE",
    category: "CONTROLLED AGRICULTURE",
    description:
      "The greenhouse module supports plant growth within a controlled environment.",
    purpose: "Enables agricultural research in lunar conditions.",
    target: { type: "model", nodeName: "008-greenhouse-module" },
    cameraOffset: [13, 10, 16],
  },
  {
    title: "SOLAR ARRAY",
    category: "ENERGY GENERATION SYSTEM",
    description:
      "The solar-array row collects sunlight using the outpost's photovoltaic equipment.",
    purpose: "Converts sunlight into electrical energy for the research outpost.",
    target: { type: "model", nodeName: "011-solar-array-row" },
    cameraOffset: [16, 11, 18],
  },
  {
    title: "COMMUNICATION EQUIPMENT",
    category: "COMMUNICATIONS & TELEMETRY",
    description:
      "The communications relay mast links the outpost with external networks.",
    purpose: "Supports communications and research telemetry.",
    target: { type: "model", nodeName: "017-comms-relay-mast" },
    cameraOffset: [18, 13, 20],
  },
];

export const OVERVIEW_CAMERA = {
  position: [100, 66, 0] as TutorialPoint,
  target: [0, 1, 0] as TutorialPoint,
};

function toWorld(
  point: THREE.Vector3,
  modelCenter: THREE.Vector3,
  modelBottom: number,
  scale: number,
  site: { x: number; z: number; height: number }
): TutorialPoint {
  return [
    site.x + (point.x - modelCenter.x) * scale,
    site.height + (point.y - modelBottom) * scale,
    site.z + (point.z - modelCenter.z) * scale,
  ];
}

export function resolveTutorialLocations(
  sourceScene: THREE.Object3D,
  elevations: Float32Array,
  metadata: TerrainMetadata
): TutorialLocation[] {
  const site = findFlatColonySite(elevations, metadata);
  const scene = sourceScene.clone(true);
  scene.updateMatrixWorld(true);

  const colonyBounds = new THREE.Box3().setFromObject(scene);
  const colonySize = new THREE.Vector3();
  const colonyCenter = new THREE.Vector3();
  colonyBounds.getSize(colonySize);
  colonyBounds.getCenter(colonyCenter);

  const footprint = Math.max(colonySize.x, colonySize.z);
  if (!Number.isFinite(footprint) || footprint <= 0) {
    throw new Error("Invalid lunar colony model dimensions.");
  }

  const scale = 60 / footprint;

  return TUTORIAL_STEPS.map((step) => {
    if (step.target.type === "surface") {
      const x = site.x + step.target.offset[0];
      const z = site.z + step.target.offset[1];
      const y = sampleTerrainHeight(elevations, metadata, x, z);
      return {
        focus: [x, y, z],
        marker: [x, y + 1.1, z],
      };
    }

    const object = scene.getObjectByName(step.target.nodeName);
    if (!object) {
      throw new Error(
        `Tutorial model node "${step.target.nodeName}" was not found.`
      );
    }

    const objectBounds = new THREE.Box3().setFromObject(object);
    const center = objectBounds.getCenter(new THREE.Vector3());
    const focus = toWorld(
      center,
      colonyCenter,
      colonyBounds.min.y,
      scale,
      site
    );
    const top = toWorld(
      new THREE.Vector3(center.x, objectBounds.max.y, center.z),
      colonyCenter,
      colonyBounds.min.y,
      scale,
      site
    );

    return {
      focus,
      marker: [top[0], top[1] + 0.45, top[2]],
    };
  });
}
