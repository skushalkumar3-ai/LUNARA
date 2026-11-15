
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  createRef,
  type RefObject,
} from "react";
import { Html, useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { clone as cloneSkeleton } from
  "three/examples/jsm/utils/SkeletonUtils.js";

import {
  findFlatColonySite,
  sampleTerrainHeight,
  type TerrainMetadata,
} from "./colonyPlacement";
import type { SystemStatus } from "../mission/types";
import { useMissionStore } from "../store/missionStore";
import { CREW_ROSTER } from "./crewRoster";

const ASTRONAUT_URL = "/models/astronaut.glb";
const ROVER_URL = "/models/perseverance-rover.glb";

const HEIGHTMAP_URL = "/terrain/site04_heightmap.bin";
const METADATA_URL = "/terrain/site04_metadata.json";

interface TerrainData {
  elevations: Float32Array;
  metadata: TerrainMetadata;
}

interface ScreenRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface LabelOffset {
  x: number;
  y: number;
}

type CrewMember = (typeof CREW_ROSTER)[number];
const CREW = CREW_ROSTER;

const LABEL_PLACEMENT_CANDIDATES: readonly LabelOffset[] = [
  { x: 0, y: 0 },
  { x: 0, y: -48 },
  { x: 0, y: 48 },
  { x: -72, y: 0 },
  { x: 72, y: 0 },
  { x: -72, y: -48 },
  { x: 72, y: -48 },
  { x: -72, y: 48 },
  { x: 72, y: 48 },
  { x: 0, y: -96 },
  { x: 0, y: 96 },
  { x: -132, y: 0 },
  { x: 132, y: 0 },
  { x: -132, y: -48 },
  { x: 132, y: -48 },
];

function overlaps(a: ScreenRect, b: ScreenRect): boolean {
  return (
    a.left < b.right + 6 &&
    a.right > b.left - 6 &&
    a.top < b.bottom + 6 &&
    a.bottom > b.top - 6
  );
}

function offsetRect(rect: ScreenRect, offset: LabelOffset): ScreenRect {
  return {
    left: rect.left + offset.x,
    top: rect.top + offset.y,
    right: rect.right + offset.x,
    bottom: rect.bottom + offset.y,
  };
}

function fitOffsetToViewport(
  rect: ScreenRect,
  offset: LabelOffset,
  viewport: DOMRect
): LabelOffset | null {
  const minX = viewport.left + 8 - rect.left;
  const maxX = viewport.right - 8 - rect.right;
  const minY = viewport.top + 8 - rect.top;
  const maxY = viewport.bottom - 8 - rect.bottom;
  if (minX > maxX || minY > maxY) return null;

  return {
    x: Math.max(minX, Math.min(maxX, offset.x)),
    y: Math.max(minY, Math.min(maxY, offset.y)),
  };
}

function normalizeModel(
  source: THREE.Object3D,
  targetHeight: number
) {
  const model = cloneSkeleton(source);

  model.updateMatrixWorld(true);

  const bounds = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();

  bounds.getSize(size);
  bounds.getCenter(center);

  if (!Number.isFinite(size.y) || size.y <= 0) {
    throw new Error("Invalid astronaut or rover model dimensions.");
  }

  const scale = targetHeight / size.y;

  model.scale.setScalar(scale);

  model.position.set(
    -center.x * scale,
    -bounds.min.y * scale,
    -center.z * scale
  );

  model.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;

      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];

      materials.forEach((material) => {
        material.depthWrite = true;
      });
    }
  });

  return model;
}

// --------------------------------------------------
// ASTRONAUT LOCATOR EFFECT
// --------------------------------------------------

function AstronautGlow() {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.5) * 0.12;

    if (ringRef.current) {
      ringRef.current.scale.setScalar(pulse);
    }

  });

  return (
    <group>
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.04, 0]}
      >
        <ringGeometry args={[0.8, 1.05, 48]} />
        <meshBasicMaterial
          color="#00eaff"
          transparent
          opacity={0.75}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0, 0.07, 0]}>
        <circleGeometry args={[0.72, 32]} />
        <meshBasicMaterial
          color="#00dfff"
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0, 3.1, 0]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshBasicMaterial color="#00eaff" />
      </mesh>
    </group>
  );
}

// --------------------------------------------------
// ASTRONAUT
// --------------------------------------------------

function Astronaut({
  source,
  member,
  position,
  data,
  selected,
  labelRef,
  anchorNodes,
  compactLabel,
  onSelect,
  sheltering = false,
  systemStatus,
}: {
  source: THREE.Object3D;
  member: CrewMember;
  position: THREE.Vector3;
  data: TerrainData;
  selected: boolean;
  labelRef: RefObject<HTMLDivElement | null>;
  anchorNodes: RefObject<Map<number, THREE.Group>>;
  compactLabel: boolean;
  onSelect: () => void;
  sheltering?: boolean;
  systemStatus: SystemStatus;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const group = groupRef.current;
    const anchors = anchorNodes.current;
    if (group) anchors.set(member.id, group);
    return () => {
      anchors.delete(member.id);
    };
  }, [anchorNodes, member.id]);

  const astronaut = useMemo(
    () => normalizeModel(source, 2.5),
    [source]
  );

  const startX = position.x;
  const startZ = position.z;
  const crewStatus = systemStatus.astronautExposure
    ? "RADIATION EXPOSURE"
    : systemStatus.crewSheltered
      ? "CREW SHELTERED"
      : systemStatus.habitatShield
        ? "SHIELD PROTECTED"
        : null;

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;

    const time =
      state.clock.elapsedTime * member.speed + member.id * 1.7;

    // When sheltering, crew moves slowly toward colony center.
    const effectiveRadius = sheltering ? member.patrolRadius * 0.25 : member.patrolRadius;
    const effectiveStartX = sheltering ? startX * 0.15 : startX;
    const effectiveStartZ = sheltering ? startZ * 0.15 : startZ;

    const x =
      effectiveStartX + Math.sin(time) * effectiveRadius;

    const z =
      effectiveStartZ + Math.cos(time * 0.7) * effectiveRadius;

    const terrainY = sampleTerrainHeight(
      data.elevations,
      data.metadata,
      x,
      z
    );

    group.position.set(x, terrainY + 0.06, z);

    // Turn gradually as the astronaut moves.
    group.rotation.y =
      Math.atan2(
        Math.cos(time) * effectiveRadius,
        Math.sin(time) * effectiveRadius
      ) + member.rotation;

    // Subtle movement while working.
    group.position.y +=
      Math.abs(Math.sin(time * 2)) * 0.025;
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, member.rotation, 0]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <AstronautGlow />
      <primitive object={astronaut} />
      <Html
        position={[0, 4.2, 0]}
        center
        zIndexRange={[8, 1]}
        eps={0.01}
        style={{ pointerEvents: "auto" }}
      >
        <div
          className={`crew-marker ${compactLabel ? "crew-marker--compact" : ""} ${member.labelClass ?? ""}`}
          data-screen-label-priority="0"
          ref={labelRef}
        >
          <button
            type="button"
            className="crew-marker__button"
            aria-expanded={selected}
            aria-label={`View ${member.name}, ${member.role}`}
            onClick={(event) => {
              event.stopPropagation();
              onSelect();
            }}
          >
            <span className="crew-marker__dot" />
            <span className="crew-marker__text">
              <span className="crew-marker__name">{member.name}</span>
              <span className="crew-marker__role">{member.role}</span>
              {crewStatus && (
                <span
                  className={`crew-marker__mission-status ${
                    systemStatus.astronautExposure
                      ? "crew-marker__mission-status--warning"
                      : "crew-marker__mission-status--secure"
                  }`}
                >
                  {crewStatus}
                </span>
              )}
              <span className="crew-marker__responsibilities">
                {member.responsibilities}
              </span>
            </span>
          </button>
          {selected && (
            <section className="crew-card" aria-label={`${member.name} details`}>
              <div className="crew-card__heading">
                <span>CREW PROFILE</span>
                <span className="crew-card__status">
                  <i />
                  ACTIVE
                </span>
              </div>
              <h3>{member.name}</h3>
              <p className="crew-card__role">{member.role}</p>
              <p>{member.responsibilities}</p>
              <div className="crew-card__activity">
                <span>CURRENT ACTIVITY</span>
                {member.activity}
              </div>
            </section>
          )}
        </div>
      </Html>
    </group>
  );
}

// --------------------------------------------------
// PERSEVERANCE ROVER
// --------------------------------------------------

function Perseverance({
  source,
  position,
  data,
}: {
  source: THREE.Object3D;
  position: THREE.Vector3;
  data: TerrainData;
}) {
  const rover = useMemo(
    () => normalizeModel(source, 4.5),
    [source]
  );

  const groupRef = useRef<THREE.Group>(null);

  const startX = position.x;
  const startZ = position.z;

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;

    const time = state.clock.elapsedTime * 0.12;
    const radius = 3;

    const x = startX + Math.cos(time) * radius;
    const z = startZ + Math.sin(time) * radius;

    const y = sampleTerrainHeight(
      data.elevations,
      data.metadata,
      x,
      z
    );

    group.position.set(x, y + 0.05, z);
    group.rotation.y = -time + Math.PI / 2;
  });

  return (
    <group ref={groupRef} position={position}>
      <primitive object={rover} />
    </group>
  );
}

// --------------------------------------------------
// CREW AND ROVER
// --------------------------------------------------

function LoadedCrew({
  data,
  sheltering,
  systemStatus,
}: {
  data: TerrainData;
  sheltering?: boolean;
  systemStatus: SystemStatus;
}) {
  const [selectedCrewId, setSelectedCrewId] = useState<number | null>(null);
  const { scene: astronautScene } = useGLTF(ASTRONAUT_URL);
  const missionHasStarted = useMissionStore(
    (state) => state.eventHistory.length > 0
  );
  const { camera, gl } = useThree();
  const anchorNodes = useRef(new Map<number, THREE.Group>());
  const [labelRefs] = useState(
    () =>
      new Map<number, RefObject<HTMLDivElement | null>>(
        CREW.map((member) => [member.id, createRef<HTMLDivElement>()])
      )
  );
  const appliedOffsets = useRef(new Map<number, LabelOffset>());
  const nextLayoutUpdate = useRef(0);
  const projectedAnchor = useRef(new THREE.Vector3());
  const layoutOrder = useMemo(
    () =>
      [...CREW].sort(
        (a, b) =>
          Number(b.id === selectedCrewId) - Number(a.id === selectedCrewId)
      ),
    [selectedCrewId]
  );

  useEffect(() => {
    const onRosterFocus = (event: Event) => {
      const id = (event as CustomEvent<{ id?: number }>).detail?.id;
      const anchor = anchorNodes.current.get(Number(id));
      if (!anchor) return;
      setSelectedCrewId(Number(id));
      const world = anchor.getWorldPosition(new THREE.Vector3());
      window.dispatchEvent(new CustomEvent("lunara:crew-camera-target", { detail: { id: Number(id), position: [world.x, world.y, world.z] } }));
    };
    window.addEventListener("lunara:focus-crew", onRosterFocus);
    return () => window.removeEventListener("lunara:focus-crew", onRosterFocus);
  }, []);

  useFrame(({ clock }) => {
    if (clock.elapsedTime < nextLayoutUpdate.current) return;
    nextLayoutUpdate.current = clock.elapsedTime + 0.12;

    const viewport = gl.domElement.getBoundingClientRect();
    if (viewport.width <= 0 || viewport.height <= 0) return;

    const occupiedRects = Array.from(
      document.querySelectorAll<HTMLElement>(
        "[data-screen-obstacle], .env-label, .mission-env-indicator, .tutorial-marker-label, .tutorial-marker-info"
      )
    )
      .filter(
        (node) =>
          node.offsetWidth > 0 &&
          node.offsetHeight > 0 &&
          getComputedStyle(node).visibility !== "hidden"
      )
      .map((node) => node.getBoundingClientRect());
    const placedRects: ScreenRect[] = [];

    for (const member of layoutOrder) {
      const node = labelRefs.get(member.id)?.current;
      const anchor = anchorNodes.current.get(member.id);
      if (!node || !anchor) continue;

      const wasVisible = node.dataset.layoutVisible === "true";
      anchor.localToWorld(projectedAnchor.current.set(0, 4.2, 0));
      const distance = camera.position.distanceTo(projectedAnchor.current);
      projectedAnchor.current.project(camera);
      const edgeLimit = wasVisible ? 1.12 : 0.98;
      const anchorVisible =
        projectedAnchor.current.z > -1 &&
        projectedAnchor.current.z < 1 &&
        Math.abs(projectedAnchor.current.x) < edgeLimit &&
        Math.abs(projectedAnchor.current.y) < edgeLimit &&
        distance < (wasVisible ? 340 : 320);
      if (!anchorVisible) {
        node.style.visibility = "hidden";
        node.dataset.layoutVisible = "false";
        continue;
      }

      const maxWidth = `${Math.max(
        120,
        Math.min(190, viewport.width - 16)
      )}px`;
      if (node.style.maxWidth !== maxWidth) node.style.maxWidth = maxWidth;

      const rect = node.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;

      const previousOffset = appliedOffsets.current.get(member.id) ?? {
        x: 0,
        y: 0,
      };
      const baseRect: ScreenRect = {
        left: rect.left - previousOffset.x,
        top: rect.top - previousOffset.y,
        right: rect.right - previousOffset.x,
        bottom: rect.bottom - previousOffset.y,
      };

      const currentRect = offsetRect(baseRect, previousOffset);
      const currentIsClear =
        currentRect.left >= viewport.left + 8 &&
        currentRect.right <= viewport.right - 8 &&
        currentRect.top >= viewport.top + 8 &&
        currentRect.bottom <= viewport.bottom - 8 &&
        !occupiedRects.some((occupied) => overlaps(currentRect, occupied)) &&
        !placedRects.some((placed) => overlaps(currentRect, placed));

      let chosenOffset: LabelOffset | null = currentIsClear
        ? previousOffset
        : null;
      let chosenRect = currentIsClear ? currentRect : null;
      let bestScore = Number.POSITIVE_INFINITY;

      if (!currentIsClear) {
        for (const candidate of LABEL_PLACEMENT_CANDIDATES) {
          const fittedOffset = fitOffsetToViewport(
            baseRect,
            candidate,
            viewport
          );
          if (!fittedOffset) continue;

          const candidateRect = offsetRect(baseRect, fittedOffset);
          if (placedRects.some((placed) => overlaps(candidateRect, placed))) {
            continue;
          }

          const movement =
            Math.abs(fittedOffset.x - previousOffset.x) +
            Math.abs(fittedOffset.y - previousOffset.y);
          const distanceFromAnchor =
            Math.abs(fittedOffset.x) + Math.abs(fittedOffset.y);
          const score = movement * 100 + distanceFromAnchor;
          if (score < bestScore) {
            chosenOffset = fittedOffset;
            chosenRect = candidateRect;
            bestScore = score;
          }
        }
      }

      if (!chosenOffset || !chosenRect) {
        chosenOffset = previousOffset;
        chosenRect = currentRect;
      }

      node.style.visibility = "visible";
      node.dataset.layoutVisible = "true";
      if (
        previousOffset.x !== chosenOffset.x ||
        previousOffset.y !== chosenOffset.y
      ) {
        node.style.translate = `${chosenOffset.x}px ${chosenOffset.y}px`;
        appliedOffsets.current.set(member.id, {
          x: chosenOffset.x,
          y: chosenOffset.y,
        });
      }
      placedRects.push(chosenRect);
    }
  });

  const {
    scene: roverScene,
    animations: roverAnimations,
  } = useGLTF(ROVER_URL);

  const site = useMemo(
    () => findFlatColonySite(data.elevations, data.metadata),
    [data]
  );

  const positions = useMemo(
    () =>
      CREW.map((member) => {
        const x = site.x + member.offset[0];
        const z = site.z + member.offset[1];

        return new THREE.Vector3(
          x,
          sampleTerrainHeight(
            data.elevations,
            data.metadata,
            x,
            z
          ) + 0.06,
          z
        );
      }),
    [site, data]
  );

  const roverPosition = useMemo(() => {
    const x = site.x + 32;
    const z = site.z + 36;

    return new THREE.Vector3(
      x,
      sampleTerrainHeight(
        data.elevations,
        data.metadata,
        x,
        z
      ) + 0.05,
      z
    );
  }, [site, data]);

  useEffect(() => {
    console.log(
      "LUNARA crew initialized:",
      CREW.map(({ name, role }) => ({ name, role }))
    );

    console.log(
      "Perseverance rover animation clips:",
      roverAnimations.map((clip) => clip.name)
    );
  }, [roverAnimations]);

  return (
    <>
      {CREW.map((member, index) => (
        <Astronaut
          key={member.id}
          source={astronautScene}
          member={member}
          position={positions[index]}
          data={data}
          selected={selectedCrewId === member.id}
          labelRef={labelRefs.get(member.id)!}
          anchorNodes={anchorNodes}
          compactLabel={missionHasStarted}
          sheltering={sheltering}
          systemStatus={systemStatus}
          onSelect={() =>
            setSelectedCrewId((selected) =>
              selected === member.id ? null : member.id
            )
          }
        />
      ))}

      <Perseverance
        source={roverScene}
        position={roverPosition}
        data={data}
      />
    </>
  );
}

// --------------------------------------------------
// TERRAIN DATA LOADER
// --------------------------------------------------

export default function CrewAndRover({
  sheltering,
  systemStatus,
}: {
  sheltering?: boolean;
  systemStatus: SystemStatus;
}) {
  const [data, setData] = useState<TerrainData | null>(null);
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
          throw new Error("Could not load terrain data.");
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
          setData({ elevations, metadata });
        }
      } catch (err) {
        console.error("Crew and rover loading failed:", err);

        if (!cancelled) {
          setError(
            "Could not load the astronaut and rover placement."
          );
        }
      }
    }

    loadTerrain();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    console.error(error);
    return null;
  }

  if (!data) return null;

  return (
    <LoadedCrew
      data={data}
      sheltering={sheltering}
      systemStatus={systemStatus}
    />
  );
}

useGLTF.preload(ASTRONAUT_URL);
useGLTF.preload(ROVER_URL);
