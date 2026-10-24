const crypto = require("crypto");

const GUEST_COOKIE = "roomo_guest_session";
const ADMIN_COOKIE = "roomo_admin_session";
const CSRF_COOKIE = "roomo_csrf";

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return Object.fromEntries(header.split(";").map(part => {
    const index = part.indexOf("=");
    if (index < 0) return ["", ""];
    const key = part.slice(0, index).trim();
    try { return [key, decodeURIComponent(part.slice(index + 1).trim())]; }
    catch { return [key, ""]; }
  }).filter(([key]) => key));
}

function cookieOptions(maxAgeMs) {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    ...(Number.isFinite(maxAgeMs) ? { maxAge: maxAgeMs } : {}),
  };
}

function setSessionCookie(res, name, token, maxAgeMs) {
  res.cookie(name, token, cookieOptions(maxAgeMs));
}

function clearSessionCookie(res, name) {
  res.clearCookie(name, { httpOnly: true, secure: isProduction(), sameSite: "lax", path: "/" });
}

function ensureCsrfCookie(req, res, next) {
  const cookies = parseCookies(req);
  if (!cookies[CSRF_COOKIE]) {
    res.cookie(CSRF_COOKIE, crypto.randomBytes(32).toString("hex"), {
      httpOnly: false,
      secure: isProduction(),
      sameSite: "lax",
      path: "/",
    });
  }
  next();
}

function csrfProtection(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  // Authentication bootstrap endpoints are protected by SameSite cookies and exact CORS origins.
  if (["/api/auth/login", "/api/auth/register", "/api/guest-auth/login", "/api/guest-auth/register", "/api/guest-auth/google", "/api/guest-auth/verify-email", "/api/guest-auth/resend-verification"].includes(req.path)) return next();
  const cookies = parseCookies(req);
  const sessionCookiePresent = Boolean(cookies[GUEST_COOKIE] || cookies[ADMIN_COOKIE]);
  if (!sessionCookiePresent) return next();

  const cookieToken = cookies[CSRF_COOKIE];
  const headerToken = req.get("x-csrf-token");
  if (!cookieToken || !headerToken || cookieToken.length !== headerToken.length ||
      !crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
    return res.status(403).json({ message: "Your security token is missing or expired. Refresh the page and try again.", code: "CSRF_INVALID" });
  }

  const origin = req.get("origin");
  const configuredClient = process.env.CLIENT_URL;
  if (origin && configuredClient) {
    try {
      if (new URL(origin).origin !== new URL(configuredClient).origin) {
        return res.status(403).json({ message: "Request origin is not allowed.", code: "ORIGIN_NOT_ALLOWED" });
      }
    } catch {
      return res.status(403).json({ message: "Request origin is not allowed.", code: "ORIGIN_NOT_ALLOWED" });
    }
  }
  return next();
}

module.exports = {
  GUEST_COOKIE,
  ADMIN_COOKIE,
  CSRF_COOKIE,
  parseCookies,
  setSessionCookie,
  clearSessionCookie,
  ensureCsrfCookie,
  csrfProtection,
};
