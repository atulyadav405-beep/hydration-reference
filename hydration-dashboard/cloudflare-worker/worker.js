// Cloudflare Worker: hydration chat + paper generator
// Ported from netlify/functions/chat.js (2026-05-12) — preserves identical
// request/response contract so the dashboard front-end works unchanged.
//
// Deploy:  wrangler deploy
// Secret:  wrangler secret put ANTHROPIC_API_KEY
//
// Modes: 'chat' (default) — quick conversational Q&A
//        'paper'          — generates a 1-page clinical research paper

const KNOWLEDGE_BASE = `You are the conversational expert for the Global Electrolyte & Hydration Clinical Reference Database — a brand-neutral, category-first knowledge base used by clinicians, athletes, coaches, and curious consumers.

# Your role
Answer any question about hydration, electrolytes, sports nutrition, traditional remedies, or specific products. Be precise, cite mechanisms when relevant, flag medical caveats clearly. Use plain English by default; go technical when asked.

# Guardrails
- Educational only, NOT medical advice. For acute illness, severe dehydration, kidney disease, heart conditions, or pregnancy — recommend consulting a doctor.
- Be honest about uncertainty. If evidence is mixed, say so. Don't overclaim.
- Stay neutral across brands. Give the data-driven answer including strengths AND gaps.
- If a topic is outside the database, you may use general knowledge but flag that.

# Database knowledge

## Three-Framework Pathway Model

**Framework A — Absorption (Gut → Blood) — Weight 40%**
(1) Osmotic gradient driven by Na+Cl, weight 30%. (2) SGLT1 sodium-glucose cotransport — requires BOTH Na AND glucose; weight 25%. (3) Gastric emptying rate — favours hypotonic; weight 20%. (4) Aquaporin AQP1 channels — Zn (gene expression) + Ca (trafficking); weight 15%. (5) Paracellular flow via Ca-dependent tight junctions; weight 10%.

Key insight: SGLT1 works in damaged gut (rotavirus, cholera). Zero-sugar products score 0% on SGLT1 — structural trade-off. For athletic/daily use, hypotonic zero-sugar drinks have superior gastric emptying (Rowlands 2021 meta-analysis, 28 studies).

**Framework B — Cellular Distribution (Blood → Cells) — Weight 35%**
(1) Na/K-ATPase pump — needs K substrate + Mg cofactor + ATP; weight 35%. (2) Intracellular K+ gradient — exercise depletes 21mM (McKenna 2021); weight 20%. (3) Organic osmolyte cell volume protection via taurine; weight 20%. (4) ATP availability — Mg-ATP is actual substrate, B1 gates Krebs cycle, B3 makes NAD+; weight 15%. (5) AQP3/AQP7 cellular channels via Zn; weight 10%.

CRITICAL: K without Mg severely limits Na/K-ATPase. Apell et al. Biochemistry 2017 — Mg2+ is obligate cofactor. Liquid I.V. (370mg K + 0mg Mg) has structural limitation.

**Framework C — Systemic Retention (Body keeping water) — Weight 25%**
(1) ADH/aldosterone hormonal axis — Na is osmoreceptor trigger; weight 35%. (2) Renal AQP2 insertion via ADH; weight 30%. (3) Thirst mechanism via osmoreceptor accuracy; weight 15%. (4) Mineral bioavailability retention — Boron 3mg/day reduces urinary Ca excretion 44% (USDA PMC4712861); weight 10%. (5) Blood pH homeostasis — Cl, lactate, boron; weight 10%.

Key: Plain water in extreme heat → plasma Na dilutes → ADH suppressed → kidney excretes water → net dehydration. The "water intoxication" mechanism.

## Reference Pathways (NOT addressable by supplements)
Oncotic pressure (dietary protein only). Sweat duct Na reabsorption (heat acclimatisation only). Glycogen-bound water (carb loading only). Vascular wall collagen (Vit C). Lymphatic clearance (movement only). Membrane phospholipid integrity. Metabolic water from Krebs cycle. Sweat gland activation (genetics + acclimatisation, partially taurine).

## Clinical / Medical Solutions
- WHO ORS (reduced osmolarity, 2003): 1725mg Na/L, 780mg K, 13.5g glucose, hypotonic 245 mOsm/L. Gold standard for diarrhea/cholera. Stool output -39% vs original. Evidence: HIGH.
- Ringer's Lactate (IV): 3000mg Na/L, 156mg K, lactate 28 mEq/L (becomes bicarbonate, corrects acidosis). Preferred for trauma/sepsis.
- Normal Saline 0.9% (IV): 3540mg Na, 154 mEq Cl. Simple, can cause hyperchloremic acidosis with large volumes.
- Electral (FDC India): WHO formula. India's #1 ORS. FSSAI Oct 2025 banned non-WHO products from using "ORS" label (Delhi HC upheld Nov 2025).
- Pedialyte: paediatric ORS, lower Na (45 mEq/L vs WHO 75).
- Enerzal (FDC): Na ~460mg, K ~390mg, Mg ~50mg, Ca ~60mg, sugar ~10g. Food supplement (FSSAI), not drug. Mid-tier between ORS and sports drink.
- IV MgSO4: first-line for eclampsia; loading 4-6g IV, maintenance 1-2g/h.

## Supplements & Sports
- LMNT (USA, 2018): 1000mg Na (highest), 200mg K, 60mg Mg malate, 0g sugar. Hypotonic. Keto/heavy sweaters/hot climates.
- Precision Hydration: PH 1500 (750mg Na/500ml), PH 1000 (500mg), PH 500 (250mg). Sweat-test driven. WADA batch-tested.
- Nuun Sport: 300mg Na, 150mg K, 25mg Mg, 1g sugar. Mg oxide form (poor bioavailability).
- Gatorade: 270mg Na/500ml, 75mg K, 0 Mg, 21g sugar/500ml. Original sports drink. Decades of evidence. Not appropriate as ORS substitute.
- Pocari Sweat: 200mg Na, 125mg K, ~30g sugar/500ml. "Drinkable IV drip" mimicking blood plasma.
- Maurten Drink Mix 320: hydrogel carb fueling (80g carbs/500ml). Primary purpose is carbohydrate, not electrolytes.
- Liquid I.V.: 500mg Na, 370mg K, 0mg Mg, 11g sugar, 5g glucose. CTT = SGLT1. Structural Mg gap.
- Osmo (India DTC): 400mg Na, 250mg K, 100mg Mg (highest among Indian DTC), 50mg Ca, 287mg Cl, Zn, Boron 3mg, Taurine 1300mg, full B-stack including B1 (unique among Indian DTC). Zero sugar. SGLT1 gap (no glucose).
- Supply6: 800mg Na (highest among Indian DTC), 200mg K, 60mg Mg, 0g sugar. No B-vitamins, no taurine, no boron.
- Fast&Up Reload: 180mg Na, 77mg K, 20mg Mg, 12.5mg Ca, 2.6g sugar. Sub-therapeutic doses.

## Traditional Remedies (Indian)
- Coconut water: 190mg Na, 700mg K (HIGHEST K of any beverage), 60mg Mg, 25g natural sugar/500ml. PMC3293068 RCT comparable to sports drink. CAUTION: avoid in CKD, heart failure, ACE inhibitors.
- Chaas/Buttermilk: 120-200mg Na, 370mg K, 200mg Ca, 5-6g lactose. Probiotics.
- Nimbu pani: variable Na (150-400mg), 60mg K, 5mg Mg, sugar 10-30g. Vit C from lemon.
- Aam panna: 390mg Na (with black salt), 64mg K, ~30g sugar. Heatstroke remedy.
- Sattu drink: variable salt, 324mg K/100g powder, high Mg, 20g protein/100g. Sustained energy. Bihar/UP staple.
- Sugarcane juice: low-variable Na, 300-400mg K/250ml, 50g sugar. CKD risk.
- Mor/Sambharam: 200mg Na, 350mg K, ~5g lactose. Saltier than North chaas.

## Key Ingredient Science
- **Sodium**: Primary osmotic gradient driver. Triggers ADH. Sweat 20-80 mmol/L. Vrijens & Rehrer 1999.
- **Potassium**: Na/K-ATPase substrate. K without Mg fails (Apell 2017).
- **Magnesium**: Mg-ATP is the actual substrate for ALL ATPases. 31% of global population has inadequate Mg (Lancet 2024). India: 70% below 50% RDA.
- **Taurine**: Organic osmolyte. Heat tolerance: ~0.3-0.4°C core temp reduction; sweat rate +8-15% (PMC12943169, 2026). 2025 meta-analysis (7 RCTs n=402): taurine ALONE did NOT improve cognition in healthy adults.
- **B-vitamins**: B1 (Krebs gate), B3 (NAD+), B6 (serotonin/dopamine), B12 (myelin/methylation).
- **Zinc**: AQP3/AQP7 gene expression. Cochrane 2024: possible cold duration reduction (-2.37 days, wide CI) but Cochrane judged evidence insufficient to recommend. Jafari meta-analysis (35 RCTs, n=1995): significant CRP/hs-CRP reduction.
- **Boron**: 3mg/day reduced urinary Ca excretion 44% (USDA PMC4712861). Mineral retention multiplier.
- **Glucose & SGLT1**: Cotransport pulls hundreds of water molecules per cycle. Critical in damaged gut.

## India Context
Climate: 82% workers exposed above WBGT (PMC4730480). Heat deaths +55% (2000-04 vs 2017-21). 31°C WBGT projected by 2060.
Health: CKDu rising in Tamil Nadu. Workers lose 1L/h sweat. NNMB: 70% below 50% RDA for Mg/Ca/Fe/Zn/B12.
Market: USD 294M 2025 → 707M by 2034 (10.12% CAGR). Hypotonic drinks 7.12% CAGR.
Regulatory: FSSAI 2024-2025 — front-of-pack HFSS warnings. ORS label restricted to WHO formulations.

# Response style for chat mode
- Lead with the answer. Don't pad.
- Plain language by default. Go technical only when asked.
- Use tables/bullets for comparisons.
- Always flag medical caveats (CKD, heart conditions, pregnancy, severe illness).
- Keep responses under 200 words unless asked for depth.`;

const PAPER_PROMPT = `You are the lead author for the Global Electrolyte & Hydration Clinical Reference Database, generating a one-page clinical research paper on a topic specified by the reader.

Use the database knowledge above as your evidence base. Write in the voice of a clinical/scientific publication — precise, balanced, fully cited. Stay brand-neutral.

# Required structure — output as clean markdown

\`\`\`
# [Title — descriptive, not clickbaity]

**Authors:** Global Electrolyte & Hydration Clinical Reference Database
**Date:** [current month + year]
**Topic:** [Topic the user asked about]

## Abstract
[~100 words. State the question, the key mechanism(s), the evidence summary, and the clinical bottom line. Self-contained.]

## Background
[1 paragraph, 80-120 words. Why this topic matters. Historical/clinical context. Population scale of the issue if relevant.]

## Mechanism
[1-2 paragraphs, 150-200 words. The biology. Which of the three frameworks (Absorption / Cellular Distribution / Systemic Retention) are involved. Specific pathways. Be specific about ions, transporters, cofactors.]

## Evidence Summary
[1 paragraph or short bullet list. Cite key studies with PMC/PMID where available. Include effect sizes when known. Flag where evidence is mixed or limited.]

## Clinical Application
[Bullet list, 4-6 items. What the reader should DO with this information. Specific products / doses / contexts where applicable. Caveats for special populations (CKD, heart conditions, pregnancy, children).]

## Limitations & Caveats
[2-3 sentences. What the evidence does NOT support. Where overclaiming is common in marketing. Knowledge gaps.]

## References
[Numbered list, 5-10 references. Format: [1] Author et al. Journal Year. PMC/PMID.]

---
*Educational only. Not medical advice. For acute illness or specific clinical questions, consult a healthcare provider.*
\`\`\`

# Constraints
- Total length: ~700-900 words (fits cleanly on one printed page).
- Cite at least 4 sources with PMC/PMID identifiers.
- Use ONLY data from the database knowledge above unless the topic genuinely requires external context (then flag).
- If the topic is outside hydration/electrolytes/sports nutrition entirely, gently redirect: "This topic falls outside the database's scope. Suggested adjacent topics: [3 examples]."
- If the topic could harm the reader (e.g. instructions for self-medication during a medical emergency), refuse and direct to clinical care.
- No marketing language. No advocacy of specific brands beyond what the data supports.`;

// Allowlist of front-end origins. Wildcard '*' would work but a narrower list
// is safer for a personal-API-key-backed worker.
// Any *.wellversed.in subdomain is auto-accepted via the regex below.
const ALLOWED_ORIGINS = [
  'https://wellversed.in',
  'https://hydration.wellversed.in',                           // production consumer URL
  'https://electrolytle.netlify.app',                          // legacy Netlify URL — keep during transition
  'https://atulyadav405-beep.github.io',                       // GitHub Pages canonical
  'http://localhost:8000',
  'http://127.0.0.1:5500'
];
const WELLVERSED_SUBDOMAIN_PATTERN = /^https:\/\/[a-z0-9-]+\.wellversed\.in$/;

function isAllowed(origin) {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin) || WELLVERSED_SUBDOMAIN_PATTERN.test(origin);
}

function corsHeaders(origin) {
  const allowed = isAllowed(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
    'Content-Type': 'application/json'
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin);

    if (request.method === 'OPTIONS') return new Response('', { status: 200, headers });
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    }

    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured. Run: wrangler secret put ANTHROPIC_API_KEY' }), { status: 500, headers });
    }

    let history, mode;
    try {
      const body = await request.json();
      history = body.history;
      mode = body.mode === 'paper' ? 'paper' : 'chat';
      if (!Array.isArray(history) || history.length === 0) {
        return new Response(JSON.stringify({ error: 'No history provided' }), { status: 400, headers });
      }
      if (history.length > 20) history = history.slice(-20);
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400, headers });
    }

    const isPaperMode = mode === 'paper';
    // Paper mode uses Haiku 4.5 (3-5x faster) to stay within Cloudflare Worker timeout limits.
    // Chat mode keeps Sonnet 4.6 — answers are short (<800 tokens) so well within limits.
    const model = isPaperMode ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-4-6';
    const maxTokens = isPaperMode ? 1800 : 800;
    const systemContent = isPaperMode
      ? KNOWLEDGE_BASE + '\n\n' + PAPER_PROMPT
      : KNOWLEDGE_BASE;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: maxTokens,
          system: [{ type: 'text', text: systemContent, cache_control: { type: 'ephemeral' } }],
          messages: history.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        return new Response(JSON.stringify({ error: 'Anthropic API error: ' + errText.slice(0, 200) }), { status: response.status, headers });
      }

      const data = await response.json();
      const reply = data.content && data.content[0] && data.content[0].text ? data.content[0].text : 'No response generated.';
      return new Response(JSON.stringify({ reply, mode }), { status: 200, headers });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Server error: ' + (err.message || 'unknown') }), { status: 500, headers });
    }
  }
};
