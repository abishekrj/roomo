/** Shared API configuration for the ROOMO React staging app. */
export const API_BASE_URL = import.meta.env.VITE_ROOMO_API_URL || "http://localhost:5001/api";

function readCookie(name) {
  const prefix = name + "=";
  const item = document.cookie.split("; ").find(part => part.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : "";
}

export async function apiRequest(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const headers = {
    ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = readCookie("roomo_csrf");
    if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
  }
  const response = await fetch(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`, {
    ...options,
    method,
    headers,
    credentials: "include",
    cache: options.cache || "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "The request could not be completed.");
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data;
}
