# Architecture

## Overview

Mobile-only nutrition app with static frontend and a local Node.js API server for food image analysis.

## User Flow — Food Scan

```
Auto mode:
  mode → photo → analyze → results (facts table + BMI)

Manual mode:
  mode → photo → AI estimates ALL plate items
  → user edits names/grams → Confirm
  → calculate nutrition → results (item sugar + facts table + BMI)
```

## Page Structure

```
index.html          → landing, links to scan.html
scan.html           → camera → preview → analyze → results
```

## Server

```
server/index.js
  ├── GET  /api/health
  ├── POST /api/analyze-food
  └── static files from project root
```

### Analyze modes

| Mode | Trigger | Behavior |
|------|---------|----------|
| `mock` | Default when no `GEMINI_API_KEY` | Returns random sample nutrition data |
| `gemini` | `GEMINI_API_KEY` set or `ANALYZE_MODE=gemini` | Gemini Vision analyzes image |

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-08-12 | Mobile-only, no desktop layout | Owner requirement |
| 2026-08-12 | Node.js local server for API | Owner choice; keeps API keys off frontend |
| 2026-08-12 | Gemini Vision for food analysis | User asked agent to choose; free tier available |
| 2026-08-12 | Mock mode default | Works immediately without API key |
| 2026-08-12 | Bilingual UI (FA + EN) on scan page | Owner preference |
| 2026-08-23 | Nutrition Facts table + per-item sugar + BMI on results | Owner request; BMI is client-only, not medical diagnosis |
| 2026-10-26 | Trilingual UI (FA / EN / AR) with one language at a time | Owner request; preference stored in localStorage |

## Security Notes

- API keys live in `server/.env` only — never in frontend
- Camera requires HTTPS or localhost
- Max upload 8MB

## Future (not built yet)

- User accounts / meal history
- Framework migration (React Native / PWA)
- Persian-only mode toggle
