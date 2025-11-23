# Copilot Instructions for MenuFinder

## Project Overview
MenuFinder is a Node.js/Express web application for searching restaurants by cuisine, allergens, and location. It features a public-facing search/map UI and an admin panel for adding restaurants. Data is stored in local JSON files (`restaurantes.json`, `leads.json`).

## Architecture & Data Flow
- **Backend (`server.js`)**: Serves static files, exposes REST API endpoints for restaurant search, details, admin creation, and newsletter/reservation actions. Reads/writes to JSON files for persistence.
- **Frontend (`public/`)**: Contains `index.html` (main UI), `admin.html` (admin panel), `main.js` (UI logic, map, search, modals), and `style.css`.
- **Data Files**: `restaurantes.json` (restaurant records), `leads.json` (newsletter leads).

## Key Patterns & Conventions
- **API Endpoints**:
  - `GET /api/restaurantes?q=...` — Search/filter restaurants by name/cuisine
  - `GET /api/restaurantes/:id` — Get restaurant details
  - `POST /api/admin/restaurantes` — Add new restaurant (admin panel)
  - `POST /api/suscribir` — Newsletter signup, sends code via email
  - `POST /api/reservar` — Reservation (simulated)
- **Restaurant Object**: Includes `nombre`, `cocina`, `direccion`, `precio`, `alergenos`, `descripcion`, `coords`, `puntuacion`, `resenas`, `menu` (with categories).
- **Admin Panel**: Uses address autocomplete (OpenStreetMap Nominatim API) and requires valid coordinates for new entries.
- **Frontend Map**: Uses Leaflet.js for map display and markers. Results update dynamically based on search.
- **Newsletter Codes**: Code sent depends on cuisine preference (`MENU10`, `PASTA10`, etc.).

## Developer Workflows
- **Start Server**: `npm start` (production) or `npm run dev` (with nodemon)
- **No build step**: Static files served directly; no transpilation.
- **Data Persistence**: All changes (admin, newsletter) are written to JSON files. No database.
- **Email Sending**: Uses Gmail via Nodemailer; credentials must be set in `server.js`.

## Integration Points
- **External APIs**: OpenStreetMap Nominatim for address autocomplete (admin panel)
- **Email**: Gmail SMTP via Nodemailer for newsletter codes
- **Map**: Leaflet.js (frontend only)

## Project-Specific Notes
- **Spanish language**: Most UI and code comments are in Spanish.
- **No authentication**: Admin panel is open, but requires valid address selection.
- **Error Handling**: Minimal; most endpoints return `{ status: 'ok' }` or error JSON.
- **Static Data**: Restaurant and lead data are not synced with any external service.

## Example: Adding a Restaurant
1. Open `admin.html` in browser.
2. Fill out form, select address from autocomplete.
3. Submit — triggers `POST /api/admin/restaurantes`, updates `restaurantes.json`.

## Key Files
- `server.js`: Express server, API logic
- `public/main.js`: Frontend logic, search/map
- `public/admin.html`: Admin panel UI
- `restaurantes.json`: Restaurant data
- `leads.json`: Newsletter leads

---
For questions or unclear patterns, review `server.js` and `public/main.js` for canonical examples.
