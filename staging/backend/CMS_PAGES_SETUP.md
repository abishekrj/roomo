# ROOMO CMS Pages setup

CMS Pages adds five editable, SEO-focused landing pages for Tiruvannamalai. Content is stored in PostgreSQL in the `cms_pages` table. Drafts remain private; only published content is returned by the public endpoint.

## Apply the database migration

After pulling `feature/homepage-editor`:

```bash
cd /Users/abishek/Desktop/roomo-backend
npx prisma migrate deploy
npx prisma generate
npm run dev
```

This migration creates a new table and does not alter existing property, owner, reservation, or homepage records.

## Use the CMS

1. Start the frontend and backend.
2. Sign in to the admin panel and open **CMS Pages** in the sidebar.
3. The five recommended pages are created as drafts the first time the CMS is opened if no CMS pages exist.
4. Select **Edit** to update the page title, slug, SEO title and description, introduction, optional hero image URL, content sections and call to action.
5. Select **Save Draft** to keep edits private, or **Save & Publish** to make the current version visible.
6. Published page links appear in the shared footer. Each page is also accessible through its dedicated HTML file.

## Public endpoints

- `GET /api/cms-pages/:slug` — published page content only.
- `GET /api/admin/cms-pages` — list CMS pages (admin token required).
- `PUT /api/admin/cms-pages` and `PUT /api/admin/cms-pages/:id` — save a draft; send `publish: true` to publish at the same time.
- `POST /api/admin/cms-pages/:id/publish` — publish the saved draft.
- `DELETE /api/admin/cms-pages/:id` — delete a CMS page.

## Editorial notes

Use original, accurate content and verify local directions, distances, current prices, access rules and availability before publishing. The provided pages are starting drafts; review them against the latest local information and ROOMO's actual booking workflow.
