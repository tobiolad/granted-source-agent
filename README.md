# Inscend GRANTED Lead Radar

Standalone React/Vite app for discovering, filtering, analyzing, and exporting grant and non-dilutive funding opportunities across Canada and the United States.

This version is fully independent. It does not use Base44.

## What it does

- Finds grants and funding programs using Gemini with Google Search grounding
- Stores grant records in browser localStorage
- Includes sample grants so the app works immediately
- Lets the user paste their own Gemini API key inside the app
- Analyzes individual grants with Gemini
- Filters by country, category, funding type, fit, and urgency
- Exports visible grants to CSV
- Deploys cleanly to Vercel

## Tech stack

- React
- Vite
- Gemini API
- Browser localStorage
- Vercel-ready static deployment

## Install

```bash
npm install
```

## Run locally

```bash
npm run dev
```

Open the localhost URL shown by Vite, usually:

```text
http://localhost:5173
```

## Add Gemini API key

1. Open the app
2. Find the Gemini Settings panel
3. Paste your Gemini API key
4. Click Save

The key is saved only in that browser using localStorage. It is not hardcoded and there is no server-side storage.

## Discover grants

Use the Grant Discovery panel:

- Enter keywords such as `startup grant Ontario`, `AI small business funding`, or `women founder grant`
- Select Canada, United States, or Canada/US
- Choose category and applicant type
- Run discovery

Gemini searches public web results and returns structured opportunities.

## Important notes

- Always verify deadlines and eligibility on the official program page before applying.
- Gemini can only read public web results.
- Some results may be incomplete if the official page does not clearly state amount, deadline, or eligibility.
- This is an MVP personal tool, not a grant compliance system.

## Build

```bash
npm run build
```

## Deploy to Vercel

1. Push this folder to GitHub
2. Go to Vercel
3. Import the GitHub repo
4. Deploy

No environment variables are required because the Gemini key is entered by the user in the app.

## Project structure

```text
src/
├── AgentPanel.jsx       # Grant discovery panel
├── GeminiSettings.jsx   # API key settings
├── Home.jsx             # Main dashboard
├── agent.js             # Gemini search-grounded grant discovery
├── gemini.js            # Gemini grant analysis
├── App.jsx
├── main.jsx
└── data/
    └── sampleGrants.js
```
