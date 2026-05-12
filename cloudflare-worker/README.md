# Cloudflare Worker — Hydration Chat + Paper Generator

This Worker hosts the AI chat and one-page paper generator that powers the dashboard.
It's the same logic as the previous Netlify Function (`netlify/functions/chat.js`) but
runs on Cloudflare's free-tier serverless platform — required because GitHub Pages
cannot run server-side code.

## One-time setup (5 minutes)

1. **Make a free Cloudflare account** at https://dash.cloudflare.com/sign-up
2. **Install wrangler** (Cloudflare's CLI) — one Terminal command:
   ```bash
   npm install -g wrangler
   ```
3. **Login to Cloudflare from Terminal:**
   ```bash
   wrangler login
   ```
   (opens browser, click Authorize)
4. **From this folder, deploy the worker:**
   ```bash
   cd /Users/grest/Documents/Claude/Projects/Clinical\ Dashboard/01_dashboard/hydration-dashboard/cloudflare-worker
   wrangler deploy
   ```
5. **Add your Anthropic API key as a secret:**
   ```bash
   wrangler secret put ANTHROPIC_API_KEY
   ```
   Paste your `sk-ant-...` key when prompted.
6. **Copy the Worker URL** from the deploy output — it looks like:
   ```
   https://hydration-chat.<your-cf-subdomain>.workers.dev
   ```
7. **Update the dashboard:** open `../index.html`, search for `CHAT_API_URL`,
   replace the placeholder URL with your Worker URL. Save and redeploy the dashboard.

## Test the deployed worker

```bash
curl -X POST https://hydration-chat.<your-cf-subdomain>.workers.dev \
  -H "Content-Type: application/json" \
  -H "Origin: https://wellversed.in" \
  -d '{"history":[{"role":"user","content":"What is SGLT1?"}]}'
```
Should return `{"reply":"SGLT1 is...","mode":"chat"}`.

## Cost

Free up to 100,000 requests/day. Each chat request costs ~$0.001 in Anthropic API.

## Updating

After editing `worker.js`:
```bash
wrangler deploy
```
That's it — live in ~5 seconds globally.
