/** Shared API configuration for the ROOMO React staging app. */
export const API_BASE_URL = import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api";

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`, {
    ...options,
    headers: { ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) },
    cache: options.cache || "no-store"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "The request could not be completed.");
  return data;
}
