export interface BackendHealth {
  status: "ok";
  service: "lunara-api";
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(
  /\/$/,
  ""
);

export async function fetchBackendHealth(
  signal: AbortSignal
): Promise<BackendHealth> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) {
    throw new Error(`LUNARA API health check failed with HTTP ${response.status}.`);
  }

  const payload: unknown = await response.json();
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("status" in payload) ||
    payload.status !== "ok" ||
    !("service" in payload) ||
    payload.service !== "lunara-api"
  ) {
    throw new Error("LUNARA API returned an invalid health response.");
  }

  return { status: payload.status, service: payload.service };
}
