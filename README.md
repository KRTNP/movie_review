# Movie Review Platform

เว็บแอปสำหรับค้นหาภาพยนตร์จาก TMDB, วิเคราะห์ sentiment ของรีวิว (TMDB + YouTube), และมีหน้า `Model Test` สำหรับทดสอบโมเดล AI โดยตรง

## Tech Stack
- Frontend: React + Vite + Tailwind (`movie-search`)
- Backend: Express (`server`)
- Serverless Entry (Vercel): `api/index.js`
- External APIs:
  - TMDB API
  - YouTube Data API v3
  - Sentiment API (external service)

## Project Structure
```txt
.
|-- api/
|   `-- index.js                 # Vercel serverless entry -> server/index.js
|-- movie-search/
|   |-- src/
|   |   |-- App.jsx              # Home + Model Test views
|   |   `-- components/
|   |-- .env                     # VITE_API_BASE (local)
|   `-- package.json
|-- server/
|   |-- index.js                 # Express app, mount all routes at /api
|   |-- routes/
|   |   |-- searchmovie.js       # /api/search, /api/discover, /api/genres, /api/actors
|   |   |-- reviewmovie.js       # /api/analyze/:movieId, /api/sentiment/test, /api/reviews/random
|   |   `-- ...
|   `-- .env.example
|-- package.json                 # root dependencies for backend runtime on Vercel
`-- vercel.json
```

## Key Features
- Movie discovery with filters: genre, year, rating, popularity, language, actor, sort
- Search suggestions (movie/actor)
- Movie detail modal with sentiment summary
- Aggregated sentiment from TMDB reviews + YouTube comments
- Model test page:
  - input text or headline+body
  - predict result label + confidence
  - latency (ms)
  - model version
  - random TMDB reviews with copy button

## Environment Variables

### Backend (`server/.env`)
```env
TMDB_API_KEY=...
YOUTUBE_API_KEY=...
SENTIMENT_API_URL=...
ANALYSIS_TTL_MS=1800000
ANALYSIS_MAX_ITEMS=200
ANALYSIS_MAX_CHARS=500
MODEL_META_TTL_MS=300000
```

### Frontend (`movie-search/.env`)
```env
VITE_API_BASE=http://localhost:8080/api
```

Production on Vercel (same project for frontend+backend):
- Recommended: `VITE_API_BASE=/api`
- Or leave empty if code already defaults to `/api`

## Run Locally

### 1) Backend
```bash
cd server
npm install
npm start
```
Backend runs at `http://localhost:8080`

### 2) Frontend
```bash
cd movie-search
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`

## Build & Lint
```bash
cd movie-search
npm run lint
npm run build
```

## Main API Endpoints
Base URL: `http://localhost:8080/api`

- `GET /search?q=<query>&page=1`
- `GET /discover?page=1&genre=&year=&rating=&popularity=&language=&actor=&sort=`
- `GET /genres?language=en`
- `GET /actors?query=<name>&page=1`
- `GET /analyze/:movieId`
- `POST /sentiment/test`
  - body: `{ "text": "..." }`
- `GET /reviews/random?count=5`

## Vercel Deployment
`vercel.json` is configured to:
- install root + frontend dependencies
- build frontend (`movie-search/dist`)
- route `/api/*` to `api/index.js`
- route non-API requests to SPA `index.html`

Before deploy:
1. Set all environment variables in Vercel Project Settings
2. Confirm `VITE_API_BASE` (`/api` recommended)
3. Deploy

## Notes
- YouTube quota/permission errors are expected if API key quota is exhausted or comments are disabled.
- Sentiment API downtime returns fallback error from backend.
- Analysis is cached in-memory by `ANALYSIS_TTL_MS`.

## License
Internal/Project-specific.
