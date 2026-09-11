# Drift

A sleep forecast app for college students. Log what you did today — coffee, a
drink, a nap, stress — and Drift converts it into a live forecast of how
tonight's sleep looks, with a "what if?" sandbox to test a decision (that 8pm
Celsius, one more drink) before you actually do it.

It's built as a harm-reduction tool, not a wellness app: no judgment, no
advice-giving, and a hard privacy promise (never shared, sold, or reported).
See [docs/ROADMAP.md](docs/ROADMAP.md) for the product reasoning and what's shipped,
and [docs/GROWTH.md](docs/GROWTH.md) for the plan to first users.

Live at [drift-hs0w.onrender.com](https://drift-hs0w.onrender.com).

## Stack

- **Server:** Node + Express, sessions via `express-session` /
  `connect-pg-simple`, password hashing via `bcrypt`
- **Database:** Postgres (production runs on [Neon](https://neon.tech))
- **Frontend:** plain HTML/CSS/JS, no build step — `pages/*.html` +
  `js/*.js`, charts via Chart.js
- **Email:** SendGrid (Single Sender Verification), used for password-reset
  links only
- **Deploy:** Render, kept awake by a GitHub Actions cron ping
  (`.github/workflows/keep-alive.yml`) since the free tier spins down after
  15 minutes idle

## Local setup

You need a Postgres database — a local one is easiest and keeps testing away
from production data.

```bash
createdb drift_dev   # or any Postgres instance/database you already have
npm install
```

Copy `.env.example` to `.env` and fill in at least `DATABASE_URL`:

```bash
cp .env.example .env
```

```
DATABASE_URL=postgres://<you>@localhost:5432/drift_dev
SESSION_SECRET=<any random string — required in production, falls back to a dev default locally>
APP_URL=http://localhost:3000
```

`SENDGRID_API_KEY` and `EMAIL_FROM` can stay unset locally — without them,
password-reset links are logged to the server console instead of emailed,
which is enough to test the flow end-to-end.

Then run it:

```bash
npm run dev    # node --watch, restarts on file changes
# or
npm start
```

The server creates/migrates its own schema on boot (see `server/db.js`) —
no separate migration step needed. Visit `http://localhost:3000`.

## Project structure

```
server/     Express app, routes, Postgres access, mailer
  server.js   app setup, session config, static file serving, auth gate
  auth.js     register / login / logout / forgot & reset password
  events.js   CRUD for logged events
  profile.js  user profile (name, height/weight, target bedtime)
  db.js       Postgres pool + schema init/migration
  mailer.js   password-reset email via SendGrid

pages/      HTML pages (login, home, log, profile, password reset)
js/         frontend logic — decay engine, state, rendering, nav
css/        app.css
docs/       roadmap, growth plan, calibration/scoring research
```

## Core engine

The decay model (`js/decay.js`) is the actual product: each logged event
(caffeine, alcohol, nicotine, marijuana, naps, etc.) is converted into a
time-varying penalty on tonight's sleep score, summed at target bedtime.
Calibration notes and sourcing per substance are tracked in
[docs/ROADMAP.md §2–3](docs/ROADMAP.md), and the underlying research citations live in
[docs/SCORING.md](docs/SCORING.md) — also linked from the app itself ("the science
behind your score").

## Deployment

Production runs on Render with a Neon Postgres database. Required
environment variables on Render: `DATABASE_URL`, `SESSION_SECRET`,
`SENDGRID_API_KEY`, `EMAIL_FROM` (must exactly match a SendGrid Single
Sender–verified address), and `APP_URL` (no trailing slash — see
`server/mailer.js`, which strips one defensively but keep it clean anyway).
