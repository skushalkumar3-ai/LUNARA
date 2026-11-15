const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const defaultBaseUrl = import.meta.env.DEV
  ? "/api"
  : "https://lunara-api-vmwk.onrender.com/api";

export const API_BASE_URL = (configuredBaseUrl || defaultBaseUrl).replace(
  /\/+$/,
  ""
);
