# SuryaLab

A simple diagnostic-lab management web app: patient/test entry, package
pricing, report generation (print / PDF / WhatsApp), collection summary,
and admin settings — all running client-side with `localStorage`, so it
works on free static hosting (GitHub Pages) or Render's static-site plan.

## Structure
```
SuryaLab/
  index.html         → routes to login or dashboard
  style.css           → shared design system
  app.js              → data layer (localStorage) + auth + shared UI chrome
  data/               → seed JSON (reference only; app.js seeds the same data)
  images/             → put your logo here
  pages/
    login.html
    dashboard.html
    test-entry.html   → patient registration + test/package selection
    report.html       → search patient, enter results, print/PDF/WhatsApp
    collection.html    → billing summary by date range
    settings.html      → admin: Test Master, Package Master, Users
```

## Demo login
- Admin: `admin` / `admin123`
- Staff: `staff` / `staff123`

Change these in `pages/settings.html` → Users (as admin) once you're live.

## Deploy
1. Push this folder to a new GitHub repository.
2. **GitHub Pages**: repo Settings → Pages → deploy from `main` branch, root folder.
3. **Render**: New → Static Site → connect the repo → build command empty,
   publish directory `/` (or the repo root).
4. Your site will be live at the URL Render/GitHub gives you.

## Notes / limitations
- Data is stored in the browser's `localStorage`, per device/browser — it is
  **not** shared between staff members on different phones. For a real
  multi-user lab you'll eventually want a small backend (e.g. a free
  Render web service + database) instead of localStorage. This version is
  meant to get you a fully working, deployable app first.
- PDF/print report layout can be restyled in `style.css` under
  `.report-ticket` to match your exact paper report.
