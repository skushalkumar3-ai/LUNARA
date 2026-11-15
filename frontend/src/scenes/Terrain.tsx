import {
  findFlatColonySite,
  isInsideColonyClearance,
} from "./colonyPlacement";
import { useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

const TERRAIN_SIZE = 120;
const SEGMENTS = 1024;
const HEIGHT_SCALE = 0.002;

const HEIGHTMAP_URL = "/terrain/site04_heightmap.bin";
const METADATA_URL = "/terrain/site04_metadata.json";
const HILLSHADE_URL = "/terrain/site04_hillshade.png";

interface TerrainMetadata {
  width: number;
  height: number;
  meanElevation: number;
}

function createLunarTerrain(
  elevations: Float32Array,
  metadata: TerrainMetadata
) {
  const geometry = new THREE.PlaneGeometry(
    TERRAIN_SIZE,
    TERRAIN_SIZE,
    SEGMENTS,
    SEGMENTS
  );

  const positions = geometry.attributes.position;

  for (let i = 0; i < positions.count; i++) {
    const column = i % (SEGMENTS + 1);
    const row = Math.floor(i / (SEGMENTS + 1));
    const elevation = elevations[row * metadata.width + column];

    positions.setZ(
      i,
      (elevation - metadata.meanElevation) * HEIGHT_SCALE
    );
  }

  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  return geometry;
}

function sampleTerrainHeight(
  elevations: Float32Array,
  metadata: TerrainMetadata,
  x: number,
  z: number
) {
  const gridX = THREE.MathUtils.clamp(
    ((x + TERRAIN_SIZE / 2) / TERRAIN_SIZE) *
      (metadata.width - 1),
    0,
    metadata.width - 1
  );

  const gridY = THREE.MathUtils.clamp(
    ((TERRAIN_SIZE / 2 - z) / TERRAIN_SIZE) *
      (metadata.height - 1),
    0,
    metadata.height - 1
  );

  const x0 = Math.floor(gridX);
  const y0 = Math.floor(gridY);
  const x1 = Math.min(x0 + 1, metadata.width - 1);
  const y1 = Math.min(y0 + 1, metadata.height - 1);

  const tx = gridX - x0;
  const ty = gridY - y0;

  const a = elevations[y0 * metadata.width + x0];
  const b = elevations[y0 * metadata.width + x1];
  const c = elevations[y1 * metadata.width + x0];
  const d = elevations[y1 * metadata.width + x1];

  const top = THREE.MathUtils.lerp(a, b, tx);
  const bottom = THREE.MathUtils.lerp(c, d, tx);
  const elevation = THREE.MathUtils.lerp(top, bottom, ty);

  return (elevation - metadata.meanElevation) * HEIGHT_SCALE;
}


function createRocks(
  elevations: Float32Array,
  metadata: TerrainMetadata
) {
  const site = findFlatColonySite(elevations, metadata);

  return Array.from({ length: 110 }, (_, i) => {
    const x = Math.sin(i * 127.1) * 48;
    const z = Math.cos(i * 311.7) * 48;

    const size =
      0.15 + Math.abs(Math.sin(i * 17.3)) * 0.65;

    const groundHeight = sampleTerrainHeight(
      elevations,
      metadata,
      x,
      z
    );

    return {
      id: i,
      x,
      z,
      size,
      groundHeight,
    };
  })
    .filter(
      (rock) =>
        !isInsideColonyClearance(rock.x, rock.z, site)
    )
    .map((rock, index) => ({
      id: index,
      position: [
        rock.x,
        rock.groundHeight + rock.size * 0.3,
        rock.z,
      ] as [number, number, number],
      scale: [
        rock.size * 1.3,
        rock.size * 0.8,
        rock.size,
      ] as [number, number, number],
      rotation: [
        rock.id * 0.7,
        rock.id * 1.3,
        rock.id * 0.4,
      ] as [number, number, number],
    }));
}


export default function Terrain() {
  // Load continuous NASA LOLA hillshade
  const hillshadeSource = useLoader(
    THREE.TextureLoader,
    HILLSHADE_URL
  );

  const hillshade = useMemo(() => {
    const texture = hillshadeSource.clone();
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
    return texture;
  }, [hillshadeSource]);

  useEffect(() => {
    return () => {
      hillshade.dispose();
    };
  }, [hillshade]);

  const [elevations, setElevations] =
    useState<Float32Array | null>(null);

  const [metadata, setMetadata] =
    useState<TerrainMetadata | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTerrain() {
      try {
        const [heightResponse, metadataResponse] =
          await Promise.all([
            fetch(HEIGHTMAP_URL),
            fetch(METADATA_URL),
          ]);

        if (!heightResponse.ok || !metadataResponse.ok) {
          throw new Error("Could not load NASA terrain files.");
        }

        const [buffer, metadataJson] = await Promise.all([
          heightResponse.arrayBuffer(),
          metadataResponse.json(),
        ]);

        const terrainMetadata =
          metadataJson as TerrainMetadata;

        const heightData = new Float32Array(buffer);

        if (
          heightData.length !==
          terrainMetadata.width * terrainMetadata.height
        ) {
          throw new Error(
            "Heightmap dimensions do not match metadata."
          );
        }

        if (
          terrainMetadata.width !== SEGMENTS + 1 ||
          terrainMetadata.height !== SEGMENTS + 1
        ) {
          throw new Error("Unexpected heightmap resolution.");
        }

        if (!cancelled) {
          setElevations(heightData);
          setMetadata(terrainMetadata);
          setError(null);

          console.log(
            "NASA Shackleton Rim terrain loaded successfully!"
          );
        }
      } catch (err) {
        console.error("NASA terrain loading failed:", err);

        if (!cancelled) {
          setError("NASA terrain could not be loaded.");
        }
      }
    }

    loadTerrain();

    return () => {
      cancelled = true;
    };
  }, []);

  const geometry = useMemo(() => {
    if (!elevations || !metadata) return null;

    return createLunarTerrain(elevations, metadata);
  }, [elevations, metadata]);

  const rocks = useMemo(() => {
    if (!elevations || !metadata) return [];

    return createRocks(elevations, metadata);
  }, [elevations, metadata]);

  useEffect(() => {
    return () => {
      geometry?.dispose();
    };
  }, [geometry]);

  return (
    <group>
      {/* Continuous NASA LOLA terrain */}
      {geometry && (
        <mesh
          geometry={geometry}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <meshStandardMaterial
            map={hillshade}
            color="#b8b8b8"
            roughness={1}
            metalness={0}
          />
        </mesh>
      )}

      {/* Loading indicator */}
      {!geometry && !error && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="#00ffff" />
        </mesh>
      )}

      {/* Error indicator */}
      {error && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshBasicMaterial color="red" />
        </mesh>
      )}

      {/* Lunar rocks */}
      {rocks.map((rock) => (
        <mesh
          key={rock.id}
          position={rock.position}
          scale={rock.scale}
          rotation={rock.rotation}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color="#55565b"
            roughness={1}
          />
        </mesh>
      ))}

      {/* Terrain foundation */}
      <mesh
        position={[0, -8.5, 0]}
        receiveShadow
      >
        <boxGeometry
          args={[TERRAIN_SIZE, 2, TERRAIN_SIZE]}
        />
        <meshStandardMaterial
          color="#292a2e"
          roughness={1}
        />
      </mesh>
    </group>
  );
}
