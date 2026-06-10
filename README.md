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
4. **Publish** — saves to Cloudflare KV, returns My card + Contact page links
5. **Phone** — open public link in Safari → Add to Home Screen

### URLs after publish

On production these resolve to `https://sojern.design/business-card/...` (not the long cosmic staging URL).

| URL | Purpose |
|-----|---------|
| `/business-card/{slug}/share` | **My card** — owner page with QR; add to Home Screen |
| `/business-card/{slug}` | **Contact page** — QR destination; Save to Contacts |
| `/business-card/{slug}.vcf` | vCard with name, photo, and contact fields |
| `/business-card/?token={magic}` | **Edit link** — one-time magic link emailed via Find my card |

Legacy `/?edit={slug}&key={token}` edit URLs still work for existing bookmarks but are no longer shown in the publish modal.

Set `PUBLIC_SITE_ORIGIN` in `wrangler.json` (or Webflow Cloud env) so copied links and QR codes use your production domain.

### Edit link security (Phase 1)

- **Find my card** — look up cards by email; request a secure edit link (no raw edit URLs in the UI)
- **Magic links** — single-use, 1-hour tokens stored in KV (`magic:{token}`)
- **Rate limits** — recover, delete, and edit-link requests are capped per email and IP
- **Invalidate old edit links** — editor sidebar rotates the edit key server-side

### Delete confirmation

Deleting from **Find my card** requires inbox access:

1. Click **Email delete confirmation**
2. Open the link in the email (`/?delete={token}`)
3. Confirm in the modal — link is single-use and expires in 1 hour

Deleting from the **editor** still works immediately when you have a valid edit key (active edit session).

### Admin cleanup

For spam or fake-email cards, use the admin tool at `/business-card/admin` or the API directly.

Set `DIGICARD_ADMIN_KEY` in Webflow Cloud (long random secret). The admin page never stores the key — enter it each session.

```bash
# List cards
curl -X POST https://sojern.design/business-card/api/admin/cards/list \
  -H 'Content-Type: application/json' \
  -d '{"adminKey":"YOUR_SECRET"}'

# Delete by slug
curl -X POST https://sojern.design/business-card/api/admin/cards/delete \
  -H 'Content-Type: application/json' \
  -d '{"adminKey":"YOUR_SECRET","slug":"example-slug"}'
```

Configure email delivery in Webflow Cloud (or `wrangler.json` vars for local preview):

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Resend API key for magic-link and delete-confirmation emails |
| `EDIT_LINK_EMAIL_FROM` | Sender, e.g. `Sojern DigiCard <digicard@sojern.design>` |
| `DIGICARD_ADMIN_KEY` | Secret for admin list/delete APIs and `/business-card/admin` |

Legacy `/c/` and `/s/` paths redirect to the shorter URLs automatically.

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
