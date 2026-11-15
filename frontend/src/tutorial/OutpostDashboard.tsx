import { useEffect, useState, type ElementType, type SyntheticEvent } from "react";
import {
  Activity,
  ChevronDown,
  BatteryCharging,
  Droplets,
  Globe2,
  ClipboardList,
  Users,
  RadioTower,
  Leaf,
  Shield,
  Signal,
  Wind,
  Eye,
  EyeOff,
} from "lucide-react";
import { useMissionStore } from "../store/missionStore";
import { fetchBackendHealth } from "../services/backendApi";
import {
  fetchSpaceWeather,
  type SpaceWeatherEvent,
  type SpaceWeatherEventType,
  type SpaceWeatherResponse,
} from "../services/nasaApi";
import { deriveSpaceWeatherActivity } from "../systems/radiation";
import { CREW_ROSTER } from "../scenes/crewRoster";

const SPACE_WEATHER_CATEGORIES: {
  type: SpaceWeatherEventType;
  label: string;
}[] = [
  { type: "FLR", label: "SOLAR FLARE" },
  { type: "SEP", label: "SOLAR PARTICLES" },
  { type: "GST", label: "GEOMAGNETIC STORM" },
  { type: "CME", label: "CORONAL MASS EJECTION" },
];

function formatEventTime(value: string | null): string {
  if (!value) return "TIME NOT PROVIDED";
  const utcValue = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`;
  const timestamp = new Date(utcValue);
  if (Number.isNaN(timestamp.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(timestamp) + " UTC";
}

function latestEvent(events: SpaceWeatherEvent[]): SpaceWeatherEvent | null {
  return events[0] ?? null;
}

function SpaceWeatherPanel({
  data,
  loading,
  error,
}: {
  data: SpaceWeatherResponse | null;
  loading: boolean;
  error: string | null;
}) {
  const hasEvents = data
    ? Object.values(data.events).some((events) => events.length > 0)
    : false;
  const isConnected = Boolean(
    data && data.api_status !== "unavailable" && !error
  );
  const demoMode = !loading && !isConnected;
  const connectionStatus =
    demoMode
      ? "DEMO MODE · NO LIVE FEED"
      : loading || !data || data.api_status === "partial"
        ? "DATA UNAVAILABLE"
        : hasEvents
          ? "LIVE DATA"
          : "NO RECENT EVENTS";
  const statusColor =
    connectionStatus === "LIVE DATA"
      ? "text-emerald-300"
      : connectionStatus === "NO RECENT EVENTS"
        ? "text-cyan-200"
        : "text-amber-300";
  const activity = data ? deriveSpaceWeatherActivity(data) : null;
  return (
    <section
      aria-label="NASA space weather observations"
      className="border border-purple-200/[0.16] bg-[#0b111b]/90 px-3 py-2.5 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[9px] tracking-[0.15em] text-purple-200">
          NASA SPACE WEATHER
        </div>
        <div className={`shrink-0 text-[8px] tracking-[0.1em] ${statusColor}`}>
          {connectionStatus}
        </div>
      </div>
      <div className="mt-1 text-[8px] tracking-[0.12em] text-cyan-300/80">
        {demoMode
          ? "DEMO MODE · NO VERIFIED LIVE NASA DATA"
          : loading
            ? "CONNECTING TO NASA CCMC DONKI…"
            : data?.api_status === "partial"
              ? "PARTIAL NASA DONKI DATA · SOME CATEGORIES UNAVAILABLE"
              : "REAL NASA OBSERVATIONS · NASA CCMC DONKI · CONNECTION ONLINE"}
      </div>
      <div className="mt-2 space-y-1.5">
        {SPACE_WEATHER_CATEGORIES.map(({ type, label }) => {
          const event = data ? latestEvent(data.events[type]) : null;
          const categoryUnavailable = Boolean(
            error || data?.errors[type] || data?.api_status === "unavailable"
          );
          return (
            <div
              key={type}
              className="grid min-w-0 grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-start gap-x-2 border-t border-white/[0.06] pt-1.5"
            >
              <span className="min-w-0 break-words text-[8px] leading-3 tracking-[0.08em] text-slate-400">
                {label}
              </span>
              <span className="min-w-0 break-words text-right font-mono text-[8px] leading-3 text-slate-300 [overflow-wrap:anywhere]">
                {event
                  ? `${data?.events[type].length ?? 0} EVENT${data?.events[type].length === 1 ? "" : "S"} · ${event.classification ?? "OBSERVED"} | ${formatEventTime(event.start_time)}`
                  : categoryUnavailable
                    ? "DATA UNAVAILABLE"
                    : loading
                      ? "LOADING"
                      : data
                        ? "NO RECENT EVENTS"
                        : "DATA UNAVAILABLE"}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 border-t border-white/[0.06] pt-1.5 text-[8px] text-slate-500">
        {activity && (
          <>
            <span className="text-purple-200/80">
              SPACE-WEATHER ACTIVITY PROXY: {activity.label}
            </span>
            <p className="mt-1 leading-3">{activity.explanation}</p>
          </>
        )}
        {data &&
          Object.entries(data.errors).map(([type, message]) => (
            <p key={type} className="mt-1 text-amber-300">
              {type}: {message}
            </p>
          ))}
        <p className="mt-1">
          LAST SUCCESSFUL RETRIEVAL:{" "}
          {data?.last_successful_retrieval
            ? formatEventTime(data.last_successful_retrieval)
            : "NOT AVAILABLE"}
        </p>
        {error && <p className="mt-1 text-amber-300">{error}</p>}
      </div>
    </section>
  );
}

function ResourceCard({
  icon: Icon,
  label,
  value,
  color,
  barColor,
}: {
  icon: ElementType;
  label: string;
  value: number;
  color: string;
  barColor: string;
}) {
  return (
    <div className="min-w-0 border border-white/[0.08] bg-[#101722]/85 px-3 py-2.5 backdrop-blur-md">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-[9px] tracking-[0.12em] text-slate-400">
          <Icon size={14} className={`shrink-0 ${color}`} />
          <span className="truncate">{label}</span>
        </div>
        <div className="shrink-0 font-mono text-sm font-medium text-slate-100">
          {value}
          <span className="ml-0.5 text-[9px] text-slate-400">%</span>
        </div>
      </div>
      <div
        className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.08]"
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${barColor}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function OutpostDashboard({ challengeActive = false, panelRevealActive = false }: { challengeActive?: boolean; panelRevealActive?: boolean }) {
  const resources = useMissionStore((s) => s.resources);
  const crewSafety = useMissionStore((s) => s.crewSafety);
  const systemStatus = useMissionStore((s) => s.systemStatus);
  const commandLog = useMissionStore((s) => s.commandLog);
  const eventHistory = useMissionStore((s) => s.eventHistory);
  const activeEmergency = useMissionStore((s) => s.activeEmergency);
  const selectCrewMember = (id: number) => window.dispatchEvent(new CustomEvent("lunara:focus-crew", { detail: { id } }));
  const showLabels = useMissionStore((s) => s.showEnvironmentLabels);
  const toggleLabels = useMissionStore((s) => s.toggleEnvironmentLabels);
  const [backendStatus, setBackendStatus] = useState<
    "checking" | "connected" | "offline"
  >("checking");
  const [spaceWeather, setSpaceWeather] =
    useState<SpaceWeatherResponse | null>(null);
  const [spaceWeatherLoading, setSpaceWeatherLoading] = useState(true);
  const [spaceWeatherError, setSpaceWeatherError] = useState<string | null>(
    null
  );
  const [mobileModulesOpen, setMobileModulesOpen] = useState(false);
  const [exitExperienceOpen, setExitExperienceOpen] = useState(false);

  function keepOneDisclosureOpen(event: SyntheticEvent<HTMLDetailsElement>) {
    const current = event.currentTarget;
    if (!current.open) return;
    current.parentElement?.querySelectorAll<HTMLDetailsElement>(".dashboard-disclosure[open]").forEach((panel) => {
      if (panel !== current) panel.open = false;
    });
  }

  useEffect(() => {
    const controller = new AbortController();
    let retryTimer: number | undefined;
    let retryDelay = 5000;

    const checkBackend = async () => {
      try {
        await fetchBackendHealth(controller.signal);
        if (controller.signal.aborted) return;
        setBackendStatus("connected");
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        console.error("LUNARA API health check failed:", error);
        setBackendStatus("offline");
        retryTimer = window.setTimeout(() => void checkBackend(), retryDelay);
        retryDelay = Math.min(retryDelay * 2, 30000);
      }
    };

    void checkBackend();

    return () => {
      controller.abort();
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let retryTimer: number | undefined;
    let retryDelay = 5000;

    const loadSpaceWeather = async () => {
      try {
        const response = await fetchSpaceWeather(controller.signal);
        if (controller.signal.aborted) return;
        setSpaceWeather(response);
        setSpaceWeatherError(null);
        if (response.api_status !== "live") {
          if (response.api_status === "unavailable") {
            setSpaceWeatherError(
              Object.values(response.errors)[0] ?? "NASA DONKI is unavailable."
            );
          }
          retryTimer = window.setTimeout(
            () => void loadSpaceWeather(),
            retryDelay
          );
          retryDelay = Math.min(retryDelay * 2, 30000);
        }
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        console.error("NASA space-weather request failed:", error);
        setSpaceWeatherError(
          error instanceof Error ? error.message : "NASA DONKI is unavailable."
        );
        retryTimer = window.setTimeout(
          () => void loadSpaceWeather(),
          retryDelay
        );
        retryDelay = Math.min(retryDelay * 2, 30000);
      } finally {
        if (!controller.signal.aborted) setSpaceWeatherLoading(false);
      }
    };

    void loadSpaceWeather();

    return () => {
      controller.abort();
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    };
  }, []);

  const revealClass = (step: number) => panelRevealActive ? `dashboard-reveal dashboard-reveal--${step}` : "";

  if (challengeActive) {
    return (
      <aside className="nasa-live-dock nasa-live-dock--mission" data-screen-obstacle="true" aria-label="Always visible NASA space weather summary">
        <SpaceWeatherPanel data={spaceWeather} loading={spaceWeatherLoading} error={spaceWeatherError} />
      </aside>
    );
  }

  return (
    <>
      <header data-screen-obstacle="true" className={`absolute inset-x-0 top-0 z-20 flex items-center justify-between border-b border-white/[0.06] bg-gradient-to-b from-[#080d15]/90 to-transparent px-5 py-3.5 sm:px-7 ${revealClass(1)}`}>
        <div>
          <h1 className="text-lg font-semibold tracking-[0.28em]">LUNARA</h1>
          <p className="mt-0.5 text-[8px] tracking-[0.23em] text-cyan-300/80">
            LUNAR RESEARCH OUTPOST
          </p>
        </div>
        <div className="hidden items-center gap-5 text-[9px] tracking-[0.12em] text-slate-300 md:flex">
          <span className="flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                backendStatus === "connected"
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.65)]"
                  : backendStatus === "offline"
                    ? "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.65)]"
                    : "bg-amber-300"
              }`}
            />
            {backendStatus === "connected"
              ? "API CONNECTED"
              : backendStatus === "offline"
                ? "API OFFLINE"
                : "API CONNECTING"}
          </span>
          <span className="text-slate-400">MISSION DAY 001</span>
          <span className="flex items-center gap-2">
            <Signal size={14} className="text-cyan-400" />
            EARTH LINK
          </span>
          {/* Environment label toggle */}
          <button
            type="button"
            onClick={toggleLabels}
            title={showLabels ? "Hide location labels" : "Show location labels"}
            className="flex items-center gap-1.5 border border-cyan-200/20 bg-cyan-200/8 px-2.5 py-1 text-[8px] tracking-[0.12em] text-cyan-300/70 transition hover:border-cyan-200/40 hover:text-cyan-200"
          >
            {showLabels ? <EyeOff size={11} /> : <Eye size={11} />}
            {showLabels ? "HIDE LABELS" : "SHOW LABELS"}
          </button>
          <button type="button" onClick={() => setExitExperienceOpen(true)} className="border border-white/15 px-2.5 py-1 text-[8px] tracking-[0.12em] text-slate-300 transition hover:border-cyan-200/40 hover:text-white">END SESSION</button>
        </div>
      </header>

      <button className="dashboard-mobile-toggle" type="button" aria-expanded={mobileModulesOpen} onClick={() => setMobileModulesOpen((open) => !open)}>{mobileModulesOpen ? "CLOSE PANELS" : "MISSION PANELS"}</button>

      <aside className={`nasa-live-dock ${revealClass(2)}`} data-screen-obstacle="true" aria-label="Always visible NASA space weather summary">
        <SpaceWeatherPanel data={spaceWeather} loading={spaceWeatherLoading} error={spaceWeatherError} />
      </aside>

      <aside data-screen-obstacle="true" className={`dashboard-left-rail absolute left-3 top-[4.75rem] z-20 w-[min(216px,calc(100vw-24px))] space-y-1.5 sm:left-5 sm:top-20 ${mobileModulesOpen ? "dashboard-mobile-open" : ""} ${revealClass(3)}`}>
        <div className="dashboard-outpost-card border border-cyan-100/[0.12] bg-[#0b111b]/90 px-3 py-2.5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-[9px] tracking-[0.15em] text-cyan-300">
            <Activity size={13} />
            OUTPOST STATUS
          </div>
          <h2 className="mt-1.5 text-sm font-medium tracking-wide">Lunar Base Alpha</h2>
          <p className="mt-0.5 text-[9px] tracking-wide text-slate-500">ARTEMIS RESEARCH SECTOR</p>
        </div>
        <div className="dashboard-resource-cards">
        <ResourceCard
          icon={Wind}
          label="OXYGEN"
          value={resources.oxygen}
          color="text-cyan-400"
          barColor="bg-cyan-400"
        />
        <ResourceCard
          icon={Droplets}
          label="WATER"
          value={resources.water}
          color="text-blue-400"
          barColor="bg-blue-400"
        />
        <ResourceCard
          icon={BatteryCharging}
          label="POWER"
          value={resources.power}
          color="text-yellow-400"
          barColor="bg-yellow-400"
        />
        <ResourceCard
          icon={Leaf}
          label="FOOD"
          value={resources.food}
          color="text-green-400"
          barColor="bg-green-400"
        />
        <ResourceCard
          icon={Shield}
          label="RADIATION SAFETY"
          value={resources.radiationSafety}
          color="text-purple-400"
          barColor="bg-purple-400"
        />
        </div>
      </aside>
      <aside className={`dashboard-right-rail absolute right-3 top-[4.75rem] z-20 flex w-[min(286px,calc(100vw-24px))] flex-col gap-1.5 sm:right-5 sm:top-20 ${mobileModulesOpen ? "dashboard-mobile-open" : ""} ${revealClass(4)}`} data-screen-obstacle="true">
        <details className="dashboard-disclosure" data-screen-obstacle="true" onToggle={keepOneDisclosureOpen}>
          <summary><Users size={13} /> CREW ROSTER <ChevronDown size={13} className="dashboard-disclosure__chevron" /></summary>
          <div className="dashboard-disclosure__body">
            {CREW_ROSTER.map((member) => (
              <button type="button" className="dashboard-crew" key={member.id} onClick={() => selectCrewMember(member.id)} aria-label={`Focus ${member.name}`}>
                <span className="dashboard-crew__status" />
                <div><strong>{member.name}</strong><span>{member.role}</span><p>{member.responsibilities}</p></div>
              </button>
            ))}
            <p className="dashboard-note">CREW SAFETY SIMULATION · {crewSafety}%</p>
            <button type="button" className="dashboard-return-button" onClick={() => window.dispatchEvent(new Event("lunara:return-to-outpost-camera"))}>RETURN TO OUTPOST VIEW</button>
          </div>
        </details>
        <details className="dashboard-disclosure" data-screen-obstacle="true" onToggle={keepOneDisclosureOpen}>
          <summary><Activity size={13} /> SPACE WEATHER INTELLIGENCE <ChevronDown size={13} className="dashboard-disclosure__chevron" /></summary>
          <div className="dashboard-disclosure__body">
            <div className="dashboard-range-tabs"><span>RECENT ACTIVITY</span><span>30-DAY DONKI WINDOW</span></div>
            {spaceWeather ? (Object.entries(spaceWeather.events) as [SpaceWeatherEventType, SpaceWeatherEvent[]][]).flatMap(([type, events]) => events.map((event) => (
              <a className="dashboard-event" key={`${type}-${event.id}`} href={event.link ?? undefined} target={event.link ? "_blank" : undefined} rel={event.link ? "noreferrer" : undefined}>
                <span className={`dashboard-event__type dashboard-event__type--${type.toLowerCase()}`}>{type}</span>
                <span><strong>{event.classification ?? (type === "CME" ? "CME event" : `${type} event`)}</strong><small>START {formatEventTime(event.start_time)}{event.peak_time ? ` · PEAK ${formatEventTime(event.peak_time)}` : ""}</small></span>
              </a>
            ))) : <p className="dashboard-note">{spaceWeatherLoading ? "Loading NASA DONKI events…" : "NASA event data unavailable."}</p>}
            {spaceWeather && Object.values(spaceWeather.events).every((events) => events.length === 0) && !spaceWeatherLoading && <p className="dashboard-note">No events returned for the available DONKI query window.</p>}
            <p className="dashboard-note">REAL NASA OBSERVATIONS · DONKI event reports are not direct radiation measurements at this simulated lunar base. CME speed, direction, and Earth-directed status are not included in the available response.</p>
          </div>
        </details>
        <details className="dashboard-disclosure" data-screen-obstacle="true" onToggle={keepOneDisclosureOpen}>
          <summary><ClipboardList size={13} /> MISSION LOG <ChevronDown size={13} className="dashboard-disclosure__chevron" /></summary>
          <div className="dashboard-disclosure__body dashboard-disclosure__scroll">
            {commandLog.length ? commandLog.map((entry, index) => (
              <div className="dashboard-log-entry" key={`${entry.timestamp}-${index}`}><span>{entry.timestamp}</span><strong>{entry.action}</strong><p>{entry.result}</p></div>
            )) : <p className="dashboard-note">Mission activity will appear here.</p>}
            {activeEmergency && <p className="dashboard-note dashboard-note--warning">ACTIVE: {activeEmergency.title}</p>}
            {eventHistory.map((event) => <p className="dashboard-note" key={event.eventId}>MILESTONE · {event.eventTitle}{event.decision ? ` — ${event.decision.shortLabel}` : " — awaiting response"}</p>)}
          </div>
        </details>
        <details className="dashboard-disclosure" data-screen-obstacle="true" onToggle={keepOneDisclosureOpen}>
          <summary><RadioTower size={13} /> OUTPOST SYSTEMS <ChevronDown size={13} className="dashboard-disclosure__chevron" /></summary>
          <div className="dashboard-disclosure__body">
            {[
              ["MAIN HABITAT", systemStatus.habitatShield ? "SHIELD ACTIVE" : systemStatus.temperatureMode === "emergency" ? "THERMAL EMERGENCY" : "MONITORED"],
              ["GREENHOUSE", systemStatus.waterRepair ? "WATER LOOP REPAIR" : systemStatus.waterRationing ? "WATER RATIONING" : "MONITORED"],
              ["SOLAR ARRAY", systemStatus.solarArrayUnstable ? "UNSTABLE" : "MONITORED"],
              ["COMMUNICATIONS", backendStatus === "connected" ? "API LINK ONLINE" : backendStatus === "offline" ? "API LINK OFFLINE" : "CHECKING LINK"],
              ["ROVER", "PRESENT · STATUS NOT SIMULATED"],
              ["LIFE SUPPORT", `O₂ ${resources.oxygen}% · H₂O ${resources.water}%`],
            ].map(([name, status]) => <div className="dashboard-system-row" key={name}><span>{name}</span><strong>{status}</strong></div>)}
            <p className="dashboard-note">Only tracked simulation flags and resource values are shown. Unmodeled hardware telemetry is not available.</p>
          </div>
        </details>
      </aside>

      <footer className={`dashboard-bottom-bar absolute bottom-0 left-0 right-0 z-20 flex items-end justify-between sm:bottom-0 ${revealClass(5)}`}>
        <div className="dashboard-resource-strip" data-screen-obstacle="true">
          {([ ["O₂", resources.oxygen, "#67e8f9"], ["H₂O", resources.water, "#60a5fa"], ["PWR", resources.power, "#fbbf24"], ["FOOD", resources.food, "#4ade80"], ["RAD SAFE", resources.radiationSafety, "#c4b5fd"] ] as const).map(([label, value, color]) => <div className="dashboard-resource-strip__item" key={label}><span>{label}</span><strong>{value}%</strong><i><b style={{ width: `${value}%`, backgroundColor: color }} /></i></div>)}
        </div>
        <div className="dashboard-mission-card" data-screen-obstacle="true">
          <div className="text-[8px] tracking-[0.16em] text-cyan-300">
            CURRENT MISSION
          </div>
          <h3 className="mt-1.5 text-xs font-medium tracking-wide">Establish Lunar Outpost</h3>
          <p className="mt-1 text-[10px] leading-4 text-slate-400">
            Prepare habitat systems and maintain crew survival resources.
          </p>
        </div>
        <div data-screen-obstacle="true" className="hidden items-center gap-2 text-[9px] tracking-[0.1em] text-slate-400 md:flex">
          <Globe2 size={15} className="text-cyan-400" />
          LUNAR ENVIRONMENT SIMULATION
        </div>
      </footer>
      {exitExperienceOpen && <section className="exit-cinematic" role="dialog" aria-modal="true" aria-labelledby="exit-title">
        <div className="exit-cinematic__moon" />
        <div className="exit-cinematic__content">
          <p>LUNARA · LUNAR RESEARCH OUTPOST</p>
          <h2 id="exit-title">SESSION CONCLUDED</h2>
          <span>Thank you for supporting the crew. The outpost remains in standby.</span>
          <button type="button" onClick={() => setExitExperienceOpen(false)}>RETURN TO OUTPOST</button>
        </div>
      </section>}
    </>
  );
}
