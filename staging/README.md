# ROOMO React staging

This directory is an isolated React + Vite application. It does not replace or modify the existing `roomo-frontend` application.

## Run locally

From the repository root:

```bash
cd staging
npm install
npm run dev
```

Vite prints the local staging URL. The current shared header and footer are the first migration slice. The legacy frontend remains the production/reference version while pages are migrated and tested individually.

## Build check

```bash
npm run build
```

## Migration order

1. Shared header and footer (current)
2. Homepage
3. Search component and results
4. Property detail page
5. Login, signup and guest bookings
6. Owner portal
7. Super-admin pages

Before moving any existing route to React, verify responsive layout, API behavior, authentication redirects, CMS-driven content, visitor counting, SEO and accessibility.
