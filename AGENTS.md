# AGENTS.md — AI Onboarding Guide

> **Read this file first.** It orients any AI model to this project in under 2 minutes.

## Project

**Healthy Nutrition Plan** — a health & nutrition **mobile-only** app. Features a landing page and a food photo scan that estimates calories, protein, fat, carbs, sugar, and salt, plus a BMI check.

## Non-Negotiable Conventions

Enforced via `.cursor/rules/project-conventions.mdc`:

1. **Ask before acting** — clarify ambiguous or important decisions with the user before implementing.
2. **Mobile-only** — no desktop layout. Max ~430px centered frame on all screen sizes.
3. **Keep docs synced** — update this file and `docs/` on every meaningful change.

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI | Static HTML + CSS + vanilla JS |
| Server | Node.js + Express (`server/`) |
| Food analysis | Gemini Vision API (or mock mode) |
| Assets | SVG logos in `assets/` |
| Fonts | Outfit (EN) + Vazirmatn (FA) + Cairo (AR) |

## How to Run

```bash
cd server
cp .env.example .env   # optional: set GEMINI_API_KEY for real analysis
npm install
npm start
```

Open **http://localhost:3000/scan.html** (must use localhost — camera API needs it).

## File Map

```
nutritionPlan/
├── AGENTS.md
├── index.html              ← Landing page
├── scan.html               ← Food photo scan feature
├── bmi.html                ← Redirects to landing BMI
├── plan.html               ← Meal planner
├── reports.html            ← Week/month/6-month/year nutrition reports + charts
├── css/
│   ├── app.css             ← Shared mobile shell + tokens
│   └── scan.css            ← Scan page styles
├── js/
│   ├── i18n.js             ← FA / EN / AR translations + language switcher
│   ├── bmi.js              ← BMI calculator on landing
│   ├── reports.js          ← Week/month/6-month/year reports + charts
│   ├── account.js          ← Demo login / premium / planner storage
│   ├── plan.js             ← Planner, facts, BMI page
│   └── scan.js             ← Camera, upload, API call, results
├── assets/
│   ├── logo.svg
│   └── logo-icon.svg
├── server/
│   ├── index.js            ← Express server + static files
│   ├── analyzeFood.js      ← Gemini Vision integration
│   ├── mockAnalyze.js      ← Demo data when no API key
│   ├── package.json
│   └── .env.example
├── docs/
│   ├── ARCHITECTURE.md
│   └── CHANGELOG.md
└── .cursor/rules/
    └── project-conventions.mdc
```

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Server status + analyze mode |
| POST | `/api/estimate-plate` | Estimate all plate items with grams (manual mode) |
| POST | `/api/analyze-food` | Upload photo + optional confirmed `items` JSON |

### Response shape

```json
{
  "foodName": { "fa": "...", "en": "..." },
  "calories": 520,
  "protein": 32,
  "fat": 14,
  "saturatedFat": 3.5,
  "carbs": 48,
  "fiber": 5,
  "sugar": 4,
  "salt": 1.2,
  "portionNote": { "fa": "...", "en": "..." },
  "confidence": "medium",
  "source": "gemini | mock",
  "components": [
    { "name": { "fa": "...", "en": "..." }, "grams": 150, "calories": 225, "sugar": 0.5 }
  ]
}
```

BMI is calculated on the client from height (cm) and weight (kg), stored in `localStorage` key `hnp-bmi-profile`.

## Mobile Layout Pattern

All pages use `.app-shell` (max-width 430px, centered).

## Design Tokens

| Token | Value |
|-------|-------|
| Green primary | `#22c55e` |
| Green dark | `#15803d` |
| Max width | 430px |
| Min touch target | 44px |

## Owner Preferences

- UI language: **FA / EN / AR** via switcher (`js/i18n.js`, saved in `localStorage` as `hnp-lang`)
- Decisions: user wants approval on important choices
- No desktop layout ever
