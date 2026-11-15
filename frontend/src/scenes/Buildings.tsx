
import { useEffect, useMemo, useState } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

import {
  findFlatColonySite,
  type TerrainMetadata,
} from "./colonyPlacement";

const MODEL_URL = "/models/lunara-colony.glb";
const TARGET_FOOTPRINT = 60;

const HEIGHTMAP_URL = "/terrain/site04_heightmap.bin";
const METADATA_URL = "/terrain/site04_metadata.json";

interface TerrainData {
  elevations: Float32Array;
  metadata: TerrainMetadata;
}

function ColonyModel({ data }: { data: TerrainData }) {
  const { scene } = useGLTF(MODEL_URL);

  const colony = useMemo(() => {
    const clone = scene.clone(true);

    clone.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    bounds.getSize(size);
    bounds.getCenter(center);

    const footprint = Math.max(size.x, size.z);

    if (!Number.isFinite(footprint) || footprint <= 0) {
      throw new Error("Invalid lunar colony model dimensions.");
    }

    const scale = TARGET_FOOTPRINT / footprint;
    const site = findFlatColonySite(
      data.elevations,
      data.metadata
    );

    clone.scale.setScalar(scale);

    clone.position.set(
      site.x - center.x * scale,
      site.height - bounds.min.y * scale,
      site.z - center.z * scale
    );

    clone.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
        object.frustumCulled = true;
      }
    });

    clone.updateMatrixWorld(true);

    console.log("LUNARA colony placement:", {
      dimensions: size.toArray(),
      scale,
      site,
    });

    return clone;
  }, [scene, data]);

  return <primitive object={colony} />;
}

export default function Buildings() {
  const [terrainData, setTerrainData] =
    useState<TerrainData | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTerrainData() {
      try {
        const [heightResponse, metadataResponse] =
          await Promise.all([
            fetch(HEIGHTMAP_URL),
            fetch(METADATA_URL),
          ]);

        if (!heightResponse.ok || !metadataResponse.ok) {
          throw new Error("Could not load terrain files.");
        }

        const [buffer, metadataJson] = await Promise.all([
          heightResponse.arrayBuffer(),
          metadataResponse.json(),
        ]);

        const metadata = metadataJson as TerrainMetadata;
        const elevations = new Float32Array(buffer);

        if (
          elevations.length !== metadata.width * metadata.height
        ) {
          throw new Error("Heightmap dimensions do not match.");
        }

        if (!cancelled) {
          setTerrainData({ elevations, metadata });
          setError(null);
        }
      } catch (err) {
        console.error("Colony loading failed:", err);

        if (!cancelled) {
          setError("Could not position the lunar colony.");
        }
      }
    }

    loadTerrainData();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    console.error(error);
    return null;
  }

  if (!terrainData) return null;

  return <ColonyModel data={terrainData} />;
}

useGLTF.preload(MODEL_URL);
