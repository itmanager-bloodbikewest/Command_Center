# Blood Bike West — Command Centre

A React + Vite web app for logging and tracking Blood Bike West transport runs.
Controllers/dispatchers log calls and manage the run log; riders see their assigned
runs and record pickup/dropoff/home times. Data is stored in Google Sheets via a
Google Apps Script web app; push notifications use Firebase Cloud Messaging.

## Tech stack

- React 19 + Vite
- Google Apps Script backend (Google Sheets as the data store)
- Firebase Cloud Messaging (push notifications)
- Deployed on Netlify

## Local development

```bash
npm install
npm run dev
```

Create a `.env` file based on `.env.example` and fill in the values:

```
VITE_APPS_SCRIPT_URL=...        # the Apps Script web-app URL (backend)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
```

## Build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build locally
```

## Deployment

Deployed on Netlify (config in `netlify.toml`). The `main` branch serves
production; the `dev` branch is a separate preview deploy. Environment variables
are set per deploy context in the Netlify dashboard.

## Project structure

```
src/
  App.jsx            Root: theme provider + session gate
  MainApp.jsx        App state, data loading, layout, view routing
  constants.js       Shared data constants
  lib/               api, datetime, session, theme (pure modules)
  ui/                Shared UI primitives
  components/        Reusable components (LoginScreen, RunCard, etc.)
  views/             Screen-level views (log, new-call form, detail, rider list)
```
