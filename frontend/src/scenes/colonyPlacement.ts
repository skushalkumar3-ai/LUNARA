
import * as THREE from "three";

export const TERRAIN_SIZE = 120;
export const HEIGHT_SCALE = 0.002;
export const COLONY_FOOTPRINT = 54;
export const CLEARANCE_MARGIN = 5;

export interface TerrainMetadata {
  width: number;
  height: number;
  meanElevation: number;
}

export interface ColonySite {
  x: number;
  z: number;
  height: number;
  variation: number;
}

export function sampleTerrainHeight(
  elevations: Float32Array,
  metadata: TerrainMetadata,
  x: number,
  z: number
): number {
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

  return (
    THREE.MathUtils.lerp(top, bottom, ty) -
    metadata.meanElevation
  ) * HEIGHT_SCALE;
}

export function findFlatColonySite(
  elevations: Float32Array,
  metadata: TerrainMetadata
): ColonySite {
  const half = COLONY_FOOTPRINT / 2;
  const safeLimit = TERRAIN_SIZE / 2 - half - CLEARANCE_MARGIN;
  const CENTER_LIMIT = 15;

  let best: ColonySite | null = null;
  let bestScore = Infinity;

  // Scan possible colony locations.
  for (
  let x = -Math.min(safeLimit, CENTER_LIMIT);
  x <= Math.min(safeLimit, CENTER_LIMIT);
  x += 2
) {
  for (
    let z = -Math.min(safeLimit, CENTER_LIMIT);
    z <= Math.min(safeLimit, CENTER_LIMIT);
    z += 2
  ) {
      let minHeight = Infinity;
      let maxHeight = -Infinity;

      // Sample the proposed colony footprint.
      for (let sx = -half; sx <= half; sx += 9) {
        for (let sz = -half; sz <= half; sz += 9) {
          const height = sampleTerrainHeight(
            elevations,
            metadata,
            x + sx,
            z + sz
          );

          minHeight = Math.min(minHeight, height);
          maxHeight = Math.max(maxHeight, height);
        }
      }

      const variation = maxHeight - minHeight;

      // Slight preference for sites closer to the terrain center.
      const distancePenalty = Math.sqrt(x * x + z * z) * 0.015;
      const score = variation + distancePenalty;

      if (score < bestScore) {
        bestScore = score;

        best = {
          x,
          z,
          height: sampleTerrainHeight(
            elevations,
            metadata,
            x,
            z
          ),
          variation,
        };
      }
    }
  }

  if (!best) {
    throw new Error("Could not find a suitable colony location.");
  }

  console.log("LUNARA selected flat site:", best);

  return best;
}

export function isInsideColonyClearance(
  x: number,
  z: number,
  site: ColonySite
): boolean {
  const half =
    COLONY_FOOTPRINT / 2 + CLEARANCE_MARGIN;

  return (
    Math.abs(x - site.x) < half &&
    Math.abs(z - site.z) < half
  );
}
