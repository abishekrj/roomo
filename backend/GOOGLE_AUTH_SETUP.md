# ROOMO guest authentication setup

Guest accounts are separate from property-owner accounts. Guest endpoints are under `/api/guest-auth`; the existing owner endpoints under `/api/auth` remain available for owner workflows.

## 1. Install the Google verification library

From the backend directory:

```bash
npm install
```

This installs `google-auth-library` and updates `package-lock.json`.

## 2. Configure Google sign-in

1. Open the Google Cloud Console: https://console.cloud.google.com/
2. Create or select a project.
3. Configure the OAuth consent screen with the app name ROOMO and the requested support/contact details.
4. Create an OAuth client ID of type **Web application**.
5. Under **Authorized JavaScript origins**, add the origin used by the frontend, normally `http://localhost:5173`. Add the actual production website origin when deploying.
6. Copy the client ID. It is a public client identifier, not a client secret.

Add this variable to `roomo-backend/.env`:

```env
GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

Keep the existing `DATABASE_URL` and `JWT_SECRET` values. Do not commit `.env` or put a Google client secret in frontend code.

## 3. Update the database

After pulling the branch, from `roomo-backend` run:

```bash
npx prisma generate
npx prisma db push
npm install
```

The schema adds a `guest_users` table for guest profiles, password hashes, and Google account IDs. Existing owner accounts and properties are not migrated or deleted.

## 4. Restart the backend and frontend

Restart the backend on port 5001 and the Vite frontend. Open `roomo-signup.html` to register a guest with email/password or Google, and `roomo-login.html` to sign in.

If `GOOGLE_CLIENT_ID` is not configured, email/password authentication still works and the Google button explains what configuration is missing.

## API routes

- `POST /api/guest-auth/register` — guest email registration
- `POST /api/guest-auth/login` — guest email sign-in
- `POST /api/guest-auth/google` — verify Google ID credential and sign in/register
- `GET /api/guest-auth/config` — returns the public Google client ID for the frontend
- `GET /api/guest-auth/me` — validate the guest session

Google ID credentials are verified by the backend against the configured client ID. Guest JWTs have a separate audience and are rejected by owner/admin middleware.
