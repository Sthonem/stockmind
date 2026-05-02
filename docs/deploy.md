# StockMind Deploy Checklist

## Backend — Railway

### One-time setup
- [ ] Push repo to GitHub
- [ ] Railway → New Project → Deploy from GitHub → root dir: `/backend`
- [ ] Add PostgreSQL plugin (optional — SQLite works too)
- [ ] Set environment variables:
  - `GROQ_API_KEY` — from console.groq.com (free)
  - `NEWS_API_KEY` — from newsapi.org (free, 100 req/day)
  - `TELEGRAM_BOT_TOKEN` — from @BotFather (optional)
  - `TELEGRAM_CHAT_ID` — your chat ID (optional)
  - `ENVIRONMENT` — set to `production`
  - `FRONTEND_URL` — set after Vercel deploy

### Verify backend is live
- `GET https://your-app.up.railway.app/health` → `{"status":"ok"}`
- `GET https://your-app.up.railway.app/api/v1/status` → shows feature flags

## Frontend — Vercel

### One-time setup
- [ ] Vercel → New Project → Import repo → root dir: `/frontend`
- [ ] Add environment variable:
  - `NEXT_PUBLIC_API_URL` = `https://your-railway-url.up.railway.app`
- [ ] Deploy

### After frontend is live
- [ ] Copy Vercel URL
- [ ] Go back to Railway → add `FRONTEND_URL` = Vercel URL
- [ ] Redeploy backend (so CORS picks up the new URL)

### Verify frontend is live
- Visit your Vercel URL → dashboard loads
- Top-right shows `Connected` status
- `GET https://your-vercel-app.vercel.app/api/health` → `{"status":"ok"}`

## Local development
```bash
# Backend
cd stockmind/backend
source .venv/bin/activate
python run.py   # starts on port 8001

# Frontend
cd stockmind/frontend
npm run dev     # starts on port 3000 or 3001
```

## After deploy — first run
1. Open the app
2. Create a portfolio
3. Add some positions (e.g. AAPL, NVDA, TSLA)
4. Click the sync button to fetch price history
5. Trigger risk calculation
6. Open AI Chat and ask about your portfolio
