const PLACEHOLDER_SECRET_PATTERNS = [
  /replace-with/i,
  /change-me/i,
  /your[-_ ]secret/i,
  /example/i,
  /placeholder/i,
];

function assertSecurityConfig(env = process.env) {
  if (!env.DATABASE_URL || !env.JWT_SECRET) {
    throw new Error("DATABASE_URL and JWT_SECRET must be configured.");
  }

  if (env.NODE_ENV === "production") {
    if (env.JWT_SECRET.length < 32 || PLACEHOLDER_SECRET_PATTERNS.some((pattern) => pattern.test(env.JWT_SECRET))) {
      throw new Error("In production, JWT_SECRET must be a strong random secret of at least 32 characters.");
    }

    if (!env.CLIENT_URL) {
      throw new Error("CLIENT_URL must be explicitly configured in production.");
    }

    let clientUrl;
    try {
      clientUrl = new URL(env.CLIENT_URL);
    } catch {
      throw new Error("CLIENT_URL must be a valid HTTPS URL in production.");
    }

    if (clientUrl.protocol !== "https:" || !clientUrl.host || clientUrl.username || clientUrl.password) {
      throw new Error("CLIENT_URL must be a valid HTTPS URL in production.");
    }
  }

  return true;
}

module.exports = { assertSecurityConfig };
