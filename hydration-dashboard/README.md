# Hydration Reference — Clinical Electrolyte Database

A brand-neutral clinical reference covering 30+ hydration products, 23 biological pathways,
peer-reviewed sources, India-specific context, and an AI chat + paper generator.

- **Consumer URL** (via Wellversed reverse proxy / iframe): https://wellversed.in/osmo/hydration
- **Canonical (GitHub Pages)**: https://atulyadav405-beep.github.io/hydration-reference/
- **Legacy (still works during migration)**: https://electrolytle.netlify.app

> Brand-neutrality posture: Osmo is one of 30 catalogued entries. Methodology is published, sources are exhaustive, caveats are symmetric. See `../../../00_neutrality-charter.md`.

---

## Architecture

```
┌────────────────────────────────────────┐        ┌──────────────────────────┐
│  GitHub Pages — static site            │        │  Cloudflare Worker        │
│  (index.html + assets)                 │  →→→   │  (worker.js)              │
│                                         │ fetch  │                          │
│  Consumer hits wellversed.in/osmo/      │        │  Anthropic API           │
│  hydration → reverse-proxied here       │        │  (Sonnet 4.6 / Haiku 4.5)│
└────────────────────────────────────────┘        └──────────────────────────┘
        ▲                                                      ▲
        │ git push                                              │ wrangler deploy
        │                                                       │
   ┌────┴───────┐                                          ┌────┴───────┐
   │  this repo │                                          │  worker.js │
   └────────────┘                                          └────────────┘
```

Two deploy targets, both free:
- **Static site → GitHub Pages.** Every push to `main` auto-publishes in ~30 seconds.
- **Chat function → Cloudflare Worker.** Independent deploy via `wrangler deploy`. Free tier = 100k requests/day.

---

## Files

| File | What it is |
|------|------------|
| `index.html` | The entire dashboard — data, framework model, science cards, AI chat widget, sources section. Single file. |
| `cloudflare-worker/worker.js` | The AI chat + paper-generator backend. Replaces the old Netlify Function. |
| `cloudflare-worker/wrangler.toml` | Cloudflare Worker config |
| `cloudflare-worker/README.md` | Worker deploy instructions |
| `netlify.toml` | Legacy Netlify config — keep during transition, delete after migration is verified |
| `netlify/functions/chat.js` | Legacy Netlify Function — keep as fallback during transition |
| `.gitignore` | Git ignore rules |

---

## How to deploy a change

### Front-end change (index.html)

```bash
cd /Users/grest/Documents/Claude/Projects/Clinical\ Dashboard/01_dashboard/hydration-dashboard
git add index.html
git commit -m "describe what you changed"
git push
```
GitHub Pages auto-publishes in ~30 seconds.

### Backend change (chat logic, knowledge base)

```bash
cd cloudflare-worker
# edit worker.js
wrangler deploy
```
Live globally in ~5 seconds.

---

## Manual local preview

```bash
cd /Users/grest/Documents/Claude/Projects/Clinical\ Dashboard/01_dashboard/hydration-dashboard
python3 -m http.server 8000
```
Open http://localhost:8000

The chat widget will call your deployed Cloudflare Worker URL (set in `CHAT_API_URL` at top of `<script>` block in index.html).

---

## Deploying onto wellversed.in/osmo/hydration

GitHub Pages serves at `atulyadav405-beep.github.io/hydration-reference/`.
To make the page appear at `wellversed.in/osmo/hydration`, the Wellversed website team needs ONE of:

1. **Reverse proxy** (preferred — clean URL, full SEO credit). Cloudflare Worker or Nginx rule that proxies `wellversed.in/osmo/hydration/*` → the GitHub Pages URL.
2. **Iframe embed** the GitHub Pages URL inside a `/osmo/hydration` page on Wellversed.
3. **Server-side fetch + cache** the HTML and serve it as a static page.

The `<link rel="canonical">` already points to `wellversed.in/osmo/hydration` — Google will credit that URL once the proxy is live.

---

## Cost (per month)

| Component | Cost |
|-----------|------|
| GitHub Pages | Free |
| Cloudflare Worker | Free up to 100k requests/day |
| Anthropic API (chat) | ~₹50–200/month depending on traffic |
| **Total** | **~₹50–200/month** |

---

## Detailed deploy guide

See `../deploy-instructions.md` for the full step-by-step from zero (no GitHub repo) to live site.
