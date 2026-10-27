ROOMO ADMIN FILES

Install the entire admin folder inside your existing roomo-frontend folder.
Expected structure:
roomo-frontend/admin/admin.html
roomo-frontend/admin/dashboard.html
roomo-frontend/admin/rooms-listings.html
roomo-frontend/admin/reports.html
roomo-frontend/admin/css/admin.css
roomo-frontend/admin/js/admin.js

Keep the folder structure intact. CSS, JavaScript, navigation links, login redirect, and logout redirect are relative to this admin folder.

Start the backend on port 5001 and frontend with npm run dev.
Open http://localhost:5173/admin/admin.html to sign in.

The existing backend supports listing creation and status changes. Full property editing and real booking/revenue reports require additional backend work.

EDIT PROPERTY FEATURE
- Rooms Listings now has an Edit button for each property.
- Before using Edit, add the PATCH /api/admin/properties/:id endpoint from backend-admin-edit-route.js to roomo-backend/src/routes/admin.js.
- Restart the backend after updating the route.
