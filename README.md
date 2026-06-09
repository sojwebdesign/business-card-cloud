# Contact Card (Business Card Cloud)

Digital business card builder for the Sojern Design Hub. Reps build a card on desktop, publish it to get a live URL + QR, then open that URL on their phone to add it to their Home Screen.

**Live path (when deployed):** `/business-card` on the Design Hub Webflow Cloud site.

## Quick start

```bash
npm install
npm run dev
# http://localhost:4321/business-card
```

## Scripts

| Command | Action |
|---------|--------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build → `./dist/` |
| `npm run preview` | Build + Wrangler dev (KV + API routes) |
| `npm run deploy` | Deploy to Webflow Cloud |
| `npm run cf-typegen` | Regenerate Cloudflare binding types |

## Workflow

1. **Basics** — name, title, email, optional headshot
2. **Template** — Sojern Branded
3. **Editor** — toggle fields, preview card
4. **Publish** — saves to Cloudflare KV, returns public + edit links
5. **Phone** — open public link in Safari → Add to Home Screen

### URLs after publish

| URL | Purpose |
|-----|---------|
| `/business-card/c/{slug}` | Public card (QR target, prospects save contact) |
| `/business-card/c/{slug}.vcf` | Direct vCard download |
| `/business-card/?edit={slug}&key={token}` | Edit link (bookmark privately) |

## Deploy to Webflow Cloud

1. Connect this repo in the Webflow Cloud dashboard (Design Hub site)
2. Set mount path to `/business-card`
3. `webflow auth login`
4. `npm run deploy`
5. After first deploy, Webflow assigns the real KV namespace ID — update `wrangler.json` if prompted in the dashboard

## Project structure

```
business-card-cloud/
├── src/
│   ├── pages/
│   │   ├── index.astro          # Builder UI
│   │   ├── c/[slug].astro       # Public card page
│   │   ├── c/[slug].vcf.ts      # vCard download
│   │   └── api/cards/           # Publish + edit API
│   └── lib/                     # KV store, vCard, slug helpers
├── public/                      # Client JS, styles, assets
├── docs/APPROACH.md             # Architecture notes
├── wrangler.json                # Worker + CARDS KV binding
└── webflow.json
```

## Related projects

- **Image Wizard (reference):** `sojwebdesign/image-wizard-cloud` — deployed at `/image-wizard`
- **Design Hub:** https://sojern.design
