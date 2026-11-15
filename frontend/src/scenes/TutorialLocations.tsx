import { useEffect, useMemo, useState } from "react";
import { useGLTF } from "@react-three/drei";

import {
  resolveTutorialLocations,
  type TutorialLocation,
} from "./TutorialConfiguration";
import {
  findFlatColonySite,
  sampleTerrainHeight,
  type TerrainMetadata,
} from "./colonyPlacement";

const MODEL_URL = "/models/lunara-colony.glb";
const HEIGHTMAP_URL = "/terrain/site04_heightmap.bin";
const METADATA_URL = "/terrain/site04_metadata.json";

interface TerrainData {
  elevations: Float32Array;
  metadata: TerrainMetadata;
}

export default function useTutorialLocations(): {
  locations: TutorialLocation[] | null;
  arjunPosition: [number, number, number] | null;
  error: string | null;
} {
  const { scene } = useGLTF(MODEL_URL);
  const [terrainData, setTerrainData] = useState<TerrainData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTerrainData() {
      try {
        const [heightResponse, metadataResponse] = await Promise.all([
          fetch(HEIGHTMAP_URL),
          fetch(METADATA_URL),
        ]);

        if (!heightResponse.ok || !metadataResponse.ok) {
          throw new Error("Could not load tutorial terrain data.");
        }

        const [buffer, metadataJson] = await Promise.all([
          heightResponse.arrayBuffer(),
          metadataResponse.json(),
        ]);
        const metadata = metadataJson as TerrainMetadata;
        const elevations = new Float32Array(buffer);

        if (elevations.length !== metadata.width * metadata.height) {
          throw new Error("Tutorial heightmap dimensions do not match.");
        }

        if (!cancelled) {
          setTerrainData({ elevations, metadata });
          setError(null);
        }
      } catch (loadError) {
        console.error("Tutorial location data failed to load:", loadError);
        if (!cancelled) {
          setError("Tutorial location data could not be loaded.");
        }
      }
    }

    void loadTerrainData();
    return () => {
      cancelled = true;
    };
  }, []);

  const locations = useMemo(() => {
    if (!terrainData) return null;

    try {
      return resolveTutorialLocations(
        scene,
        terrainData.elevations,
        terrainData.metadata
      );
    } catch (locationError) {
      console.error("Tutorial model locations could not be resolved:", locationError);
      return null;
    }
  }, [scene, terrainData]);

  const arjunPosition = useMemo(() => {
    if (!terrainData) return null;
    const site = findFlatColonySite(
      terrainData.elevations,
      terrainData.metadata
    );
    const x = site.x + 43;
    const z = site.z - 22;
    const y = sampleTerrainHeight(
      terrainData.elevations,
      terrainData.metadata,
      x,
      z
    );
    return [x, y + 0.5, z] as [number, number, number];
  }, [terrainData]);

  return {
    locations,
    arjunPosition,
    error: error ?? (terrainData && !locations
      ? "Tutorial model locations could not be resolved."
      : null),
  };
}
