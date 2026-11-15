import type { SpaceWeatherResponse } from "../services/nasaApi";

export interface SpaceWeatherActivityIndicator {
  label: string;
  explanation: string;
}

export function deriveSpaceWeatherActivity(
  response: SpaceWeatherResponse
): SpaceWeatherActivityIndicator {
  if (response.api_status === "unavailable") {
    return {
      label: "DATA UNAVAILABLE",
      explanation: "NASA DONKI observations could not be retrieved.",
    };
  }

  const eventCount = Object.values(response.events).reduce(
    (total, events) => total + events.length,
    0
  );
  if (eventCount === 0) {
    return {
      label: "NO RECENT EVENTS",
      explanation:
        "No events were returned for this period; this does not establish radiation conditions.",
    };
  }

  return {
    label: "EVENT ACTIVITY REPORTED",
    explanation:
      "Educational space-weather context only—not a radiation dose or a measurement at the fictional LUNARA landing site.",
  };
}