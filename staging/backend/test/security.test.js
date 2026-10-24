const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const authenticateToken = require("../src/middleware/auth");
const { assertSecurityConfig } = require("../src/lib/securityConfig");
const sessionCookies = require("../src/lib/sessionCookies");

const secret = "test-only-roomo-jwt-secret-with-more-than-32-characters";

function mockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

function makeToken(claims = {}, options = {}) {
  return jwt.sign(
    { sub: "f20a1e76-2f5e-4c9c-9d42-2a2a4a8a09d1", ...claims },
    secret,
    {
      issuer: "roomo-api",
      audience: "roomo-admin",
      expiresIn: "1h",
      ...options,
    }
  );
}

function runAuth(token) {
  process.env.JWT_SECRET = secret;
  const req = { headers: token ? { authorization: `Bearer ${token}` } : { } };
  const res = mockResponse();
  let nextCalled = false;
  authenticateToken(req, res, () => { nextCalled = true; });
  return { req, res, nextCalled };
}

test("owner/admin middleware rejects missing bearer tokens", () => {
  const result = runAuth(null);
  assert.equal(result.res.statusCode, 401);
  assert.equal(result.nextCalled, false);
});

test("owner/admin middleware accepts a correctly issued admin-audience token", () => {
  const result = runAuth(makeToken());
  assert.equal(result.nextCalled, true);
  assert.equal(result.req.owner.sub, "f20a1e76-2f5e-4c9c-9d42-2a2a4a8a09d1");
});

test("owner/admin middleware rejects guest-audience tokens", () => {
  const result = runAuth(makeToken({}, { audience: "roomo-guest" }));
  assert.equal(result.res.statusCode, 401);
  assert.equal(result.nextCalled, false);
});

test("owner/admin middleware rejects a token from an unexpected issuer", () => {
  const result = runAuth(makeToken({}, { issuer: "untrusted-issuer" }));
  assert.equal(result.res.statusCode, 401);
  assert.equal(result.nextCalled, false);
});

test("owner/admin middleware rejects expired tokens", () => {
  const result = runAuth(makeToken({}, { expiresIn: -1 }));
  assert.equal(result.res.statusCode, 401);
  assert.equal(result.nextCalled, false);
});

test("owner/admin middleware rejects malformed tokens", () => {
  const result = runAuth("not.a.valid.jwt");
  assert.equal(result.res.statusCode, 401);
  assert.equal(result.nextCalled, false);
});

test("production configuration rejects a missing client URL", () => {
  assert.throws(() => assertSecurityConfig({
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://roomo:secret@localhost:5432/roomo",
    JWT_SECRET: secret,
  }), /CLIENT_URL/);
});

test("production configuration rejects a weak JWT secret", () => {
  assert.throws(() => assertSecurityConfig({
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://roomo:secret@localhost:5432/roomo",
    JWT_SECRET: "short-secret",
    CLIENT_URL: "https://roomo.example.com",
  }), /JWT_SECRET/);
});

test("production configuration requires HTTPS", () => {
  assert.throws(() => assertSecurityConfig({
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://roomo:secret@localhost:5432/roomo",
    JWT_SECRET: secret,
    CLIENT_URL: "http://roomo.example.com",
  }), /HTTPS/);
});

test("production configuration accepts required values with HTTPS and a strong secret", () => {
  assert.equal(assertSecurityConfig({
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://roomo:secret@localhost:5432/roomo",
    JWT_SECRET: secret,
    CLIENT_URL: "https://roomo.example.com",
  }), true);
});

test("development configuration still requires database and JWT secrets", () => {
  assert.throws(() => assertSecurityConfig({ NODE_ENV: "development" }), /DATABASE_URL and JWT_SECRET/);
});

test("session cookies are HttpOnly, SameSite=Lax, scoped to the app, and expire with the JWT", () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  let cookie;
  sessionCookies.setSessionCookie({ cookie(name, value, options) { cookie = { name, value, options }; } }, sessionCookies.GUEST_COOKIE, "signed-session", 60 * 60 * 1000);
  if (originalEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalEnv;
  assert.equal(cookie.name, "roomo_guest_session");
  assert.equal(cookie.value, "signed-session");
  assert.equal(cookie.options.httpOnly, true);
  assert.equal(cookie.options.secure, true);
  assert.equal(cookie.options.sameSite, "lax");
  assert.equal(cookie.options.path, "/");
  assert.equal(cookie.options.maxAge, 60 * 60 * 1000);
});

test("CSRF middleware rejects cookie-authenticated writes without a matching token", () => {
  const req = {
    method: "POST",
    path: "/api/admin/properties",
    headers: { cookie: "roomo_admin_session=signed; roomo_csrf=expected" },
    get(name) { return name.toLowerCase() === "x-csrf-token" ? "wrong" : undefined; },
  };
  const res = mockResponse();
  let nextCalled = false;
  sessionCookies.csrfProtection(req, res, () => { nextCalled = true; });
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.code, "CSRF_INVALID");
  assert.equal(nextCalled, false);
});

test("CSRF middleware accepts a cookie-authenticated write with a matching token", () => {
  const req = {
    method: "POST",
    path: "/api/admin/properties",
    headers: { cookie: "roomo_admin_session=signed; roomo_csrf=matching-token" },
    get(name) { return name.toLowerCase() === "x-csrf-token" ? "matching-token" : undefined; },
  };
  const res = mockResponse();
  let nextCalled = false;
  sessionCookies.csrfProtection(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});
