import { API_BASE_URL } from "./apiBaseUrl";

export type SpaceWeatherEventType = "FLR" | "SEP" | "GST" | "CME";
export type SpaceWeatherApiStatus = "live" | "partial" | "unavailable";

export interface SpaceWeatherEvent {
  id: string;
  type: SpaceWeatherEventType;
  start_time: string | null;
  peak_time: string | null;
  end_time: string | null;
  classification: string | null;
  link: string | null;
}

export interface SpaceWeatherResponse {
  data_source: string;
  retrieved_at: string;
  last_successful_retrieval: string | null;
  api_status: SpaceWeatherApiStatus;
  events: Record<SpaceWeatherEventType, SpaceWeatherEvent[]>;
  errors: Partial<Record<SpaceWeatherEventType, string>>;
}

export interface SpaceWeatherDateRange {
  startDate?: string;
  endDate?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSpaceWeatherEvent(value: unknown): value is SpaceWeatherEvent {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    (value.type === "FLR" ||
      value.type === "SEP" ||
      value.type === "GST" ||
      value.type === "CME") &&
    (typeof value.start_time === "string" || value.start_time === null) &&
    (typeof value.peak_time === "string" || value.peak_time === null) &&
    (typeof value.end_time === "string" || value.end_time === null) &&
    (typeof value.classification === "string" ||
      value.classification === null) &&
    (typeof value.link === "string" || value.link === null)
  );
}

function parseSpaceWeatherResponse(value: unknown): SpaceWeatherResponse {
  if (
    !isRecord(value) ||
    typeof value.data_source !== "string" ||
    typeof value.retrieved_at !== "string" ||
    (typeof value.last_successful_retrieval !== "string" &&
      value.last_successful_retrieval !== null) ||
    (value.api_status !== "live" &&
      value.api_status !== "partial" &&
      value.api_status !== "unavailable") ||
    !isRecord(value.events) ||
    !isRecord(value.errors)
  ) {
    throw new Error("LUNARA API returned an invalid space-weather response.");
  }

  const eventTypes: SpaceWeatherEventType[] = ["FLR", "SEP", "GST", "CME"];
  const events = {} as Record<SpaceWeatherEventType, SpaceWeatherEvent[]>;
  for (const type of eventTypes) {
    const category = value.events[type];
    if (!Array.isArray(category) || !category.every(isSpaceWeatherEvent)) {
      throw new Error("LUNARA API returned invalid space-weather events.");
    }
    events[type] = category;
  }

  const errors: Partial<Record<SpaceWeatherEventType, string>> = {};
  for (const type of eventTypes) {
    const message = value.errors[type];
    if (message !== undefined) {
      if (typeof message !== "string") {
        throw new Error("LUNARA API returned invalid space-weather errors.");
      }
      errors[type] = message;
    }
  }

  return {
    data_source: value.data_source,
    retrieved_at: value.retrieved_at,
    last_successful_retrieval: value.last_successful_retrieval,
    api_status: value.api_status,
    events,
    errors,
  };
}

export async function fetchSpaceWeather(
  signal: AbortSignal,
  dateRange: SpaceWeatherDateRange = {}
): Promise<SpaceWeatherResponse> {
  const query = new URLSearchParams();
  if (dateRange.startDate) query.set("startDate", dateRange.startDate);
  if (dateRange.endDate) query.set("endDate", dateRange.endDate);
  const queryString = query.size > 0 ? `?${query.toString()}` : "";
  const response = await fetch(`${API_BASE_URL}/space-weather${queryString}`, {
    headers: { Accept: "application/json" },
    signal,
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("LUNARA API returned an unreadable space-weather response.");
  }

  if (!response.ok) {
    const detail =
      isRecord(payload) && typeof payload.detail === "string"
        ? payload.detail
        : isRecord(payload) &&
            isRecord(payload.errors) &&
            Object.values(payload.errors).some(
              (message) => typeof message === "string"
            )
          ? String(
              Object.values(payload.errors).find(
                (message) => typeof message === "string"
              )
            )
          : `LUNARA space-weather request failed with HTTP ${response.status}.`;
    throw new Error(detail);
  }

  return parseSpaceWeatherResponse(payload);
}
