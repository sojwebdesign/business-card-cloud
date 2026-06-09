# Contact Sharing Approach — Research & Recommendation

> **Status:** Blinq analysis complete. Recommended architecture below.
> The scaffold app does **not** implement sharing yet.

## Goal

Blinq-comparable experience for **Sojern sales at conferences**:
- Reps create branded cards, share via QR, recipients save contact info easily
- Cards should be **editable** (same QR/link after updates)
- Ideally accessible from the rep's phone without fumbling (Wallet / homescreen)

---

## How Blinq actually works (not app-to-app)

[Blinq](https://blinq.me/solutions/digital-business-card) is **not** an app-required exchange like AirDrop between two Blinq users. The model is:

| Role | Experience |
|------|------------|
| **Card owner (sales rep)** | Creates card in **mobile app** or **[web dashboard](https://dash.blinq.me)**. Shares via QR, link, Wallet, widget, Watch, NFC, email. |
| **Recipient (prospect)** | Scans QR or opens link → **mobile web page** in browser → taps **Save Contact** → `.vcf` to address book. **No app required.** |

Sources: [Blinq FAQ](https://blinq.me/solutions/digital-business-card), [Android save flow](https://support.blinq.me/en/articles/68045-saving-a-contact-to-an-android-device), [Wallet guide](https://support.blinq.me/en/articles/68011-add-your-blinq-card-to-apple-wallet).

### The core technical insight: dynamic URL, not static vCard QR

Blinq's QR codes are **dynamic** — they encode a **stable URL** that redirects to the rep's hosted card page, not the contact data itself.

- Edit card in app/dashboard → hosted page updates → **same QR still works**
- Recipients who re-visit the link see current info
- This is how [“always stay up-to-date”](https://blinq.me/) works without reprinting QR codes

The mobile app is primarily a **convenience layer** for owners (quick share, save QR to photos, Wallet, widgets). The **web dashboard** can do the same editing ([Blinq editing guide](https://support.blinq.me/en/articles/68024-editing-your-blinq-digital-business-card)).

### Apple Wallet role

Wallet is for the **owner's quick access**, not recipient storage:

1. Rep adds Blinq card to Apple/Google Wallet from the app ([instructions](https://support.blinq.me/en/articles/68011-add-your-blinq-card-to-apple-wallet))
2. Pass lives next to boarding passes — double-tap / lock screen access
3. Pass displays a QR (or similar) that recipients scan
4. Recipient still lands on the **web card page** to save contact

Wallet passes are generated and signed on **Blinq's backend** (PassKit infrastructure we don't see). Logo background color on the card affects Wallet pass styling ([image editing docs](https://support.blinq.me/en/articles/68025-editing-your-blinq-card-images)).

### What Blinq adds beyond basics (enterprise)

- NFC physical cards (chip encodes same card URL)
- CRM sync (Salesforce, HubSpot, etc.)
- SSO / team admin
- Email signatures, Zoom backgrounds with embedded QR
- Analytics (scan counts)
- Multiple cards per person

We don't need most of this for conference MVP.

---

## What matters for Sojern sales at conferences

### Must-have
1. **Fast in-person share** — rep shows QR, prospect scans, saves contact in &lt;10 seconds
2. **Sojern branding** — logo, colors, professional layout
3. **Editable card** — title/phone/email change without new QR
4. **No recipient app** — works on any iPhone/Android camera
5. **Works from rep's phone** — bookmark, homescreen, or saved QR image

### Nice-to-have (phase later)
- Apple Wallet for lock-screen access (conference floors, spotty WiFi for *owner* UI)
- Google Wallet
- CRM export
- Conference badge QR embed
- Analytics

### Acceptable trade-off (per stakeholder)
- If Wallet is hard, rep can **save QR to Photos** + bookmark card URL — still conference-viable
- Creating a new card is OK as fallback, but **URL-based cards make editing easy** so this rarely matters

---

## Recommended architecture for Sojern (Blinq-like, no native app)

**Build a web app on Design Hub / Webflow Cloud** — extend the existing `business-card-cloud` scaffold. No iOS/Android app required for v1.

```
┌─────────────────────────────────────────────────────────────────┐
│  DESIGN HUB — Card Builder (authenticated or internal link)      │
│  /business-card                                                  │
│  • Enter contact info + photo                                    │
│  • Pick Sojern template + accent                                 │
│  • Save → generates slug + persistent URL                        │
│  • Download QR PNG, copy link, edit anytime                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ save
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  CLOUDFLARE KV (or D1) — card data by slug                       │
│  { fullName, title, company, email, phone, website, photo, ... } │
└──────────────────────────┬──────────────────────────────────────┘
                           │ read
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  PUBLIC CARD PAGE — mobile-first                                 │
│  /business-card/c/{slug}                                         │
│  • Branded card view (matches preview)                           │
│  • [Save to Contacts] → serves .vcf (vCard 3.0)                  │
│  • Optional: tap-to-call, tap-to-email                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
   QR encodes URL                      Recipient saves .vcf
   (dynamic, never changes)           to phone contacts
```

### Why this matches Blinq's seamless path

| Blinq | Sojern equivalent |
|-------|-------------------|
| Hosted card page | `/business-card/c/{slug}` Astro route |
| Dynamic QR | QR encodes card URL (generated client- or server-side) |
| Save Contact button | API route returns `text/vcard` `.vcf` download |
| App / dashboard edit | Same builder URL; load existing slug to edit |
| Wallet quick access | **Phase 2** — `.pkpass` with QR barcode pointing to same URL |

### Conference day flow (rep)

1. **Before event:** Build card on laptop or phone browser at Design Hub. Download QR to Photos. Bookmark card page.
2. **At booth:** Open bookmark (shows their card + big QR) OR show saved QR image from Photos.
3. **Prospect scans:** Lands on Sojern-branded mobile page → **Save to Contacts** → done.
4. **Job title changed?** Edit in builder → same QR/link works at next event.

### Recipient flow (prospect)

1. Scan QR with phone camera (no app)
2. Mobile web page opens (needs network — typical at conferences)
3. Tap **Save to Contacts**
4. iOS: contact sheet → Add Contact. Android: download `.vcf` → import ([same as Blinq](https://support.blinq.me/en/articles/68045-saving-a-contact-to-an-android-device))

---

## Phased build plan

### Phase 1 — MVP (matches 80% of Blinq for conferences) ⭐ Start here

**Effort:** Small–medium. Fits existing Astro + Cloudflare stack.

- [ ] Persist cards to **Cloudflare KV** (slug → JSON)
- [ ] Public route `GET /business-card/c/[slug]` — mobile card page
- [ ] `GET /business-card/c/[slug].vcf` — vCard download
- [ ] Dynamic QR generation (URL-encoded, downloadable PNG)
- [ ] Edit flow: `?edit={slug}` or `/business-card/edit/{slug}` loads saved data
- [ ] Copy link + download QR buttons in editor
- [ ] Sojern branding locked (templates, colors)

**Owner phone access without Wallet:**
- Bookmark public card page (shows large QR)
- Save QR PNG to Camera Roll
- Optional: PWA manifest → "Add to Home Screen"

### Phase 2 — Apple / Google Wallet (Blinq parity for lock-screen)

**Effort:** Medium–high. Requires Apple Developer Program ($99/yr).

- [ ] Cloudflare Worker endpoint to generate signed `.pkpass`
- [ ] Pass barcode = card URL (stays updatable when recipient scans)
- [ ] "Add to Apple Wallet" button in builder
- [ ] Google Wallet pass (separate format, parallel work)

**Note:** Installed Wallet passes don't auto-refresh visual fields without push update infrastructure. For conferences, what matters is the **QR on the pass points to the live URL** — recipient always gets current data when they scan. Rep may need to re-add pass if *their displayed name/title on the pass face* must change (acceptable rare case).

### Phase 3 — Team / conference extras

- [ ] Admin: list all rep cards, deactivate on employee exit
- [ ] Slug convention: `firstname-lastname` or SSO-derived
- [ ] Email signature HTML snippet with QR
- [ ] Print-ready QR for badge inserts
- [ ] Basic scan analytics (KV counter or Analytics Engine)

### Explicitly defer

- Native iOS/Android app (web + PWA covers owner needs)
- NFC hardware cards
- CRM integrations
- Recipient "share back" flow (Blinq feature for two-way exchange)

---

## vCard vs URL QR — when to use each

| Approach | Updates | Recipient offline | Conference fit |
|----------|---------|-------------------|----------------|
| **URL QR (recommended)** | ✅ Same QR forever | ❌ Needs network to load page | ✅ Best default |
| **vCard embedded in QR** | ❌ Must regenerate QR | ✅ Scan works offline | Backup option |
| **Hybrid** | ✅ | Partial | URL QR primary + "Save Contact" serves .vcf on page |

**Recommendation:** URL QR primary. The public page's **Save Contact** button delivers the `.vcf` — same outcome as Blinq, with dynamic updates.

---

## Build vs buy

| Option | Pros | Cons |
|--------|------|------|
| **Blinq Business** | Ships tomorrow, Wallet, CRM, support | Per-seat cost, data outside Sojern, less brand control |
| **Sojern web app (recommended)** | Design Hub integration, full brand control, no per-seat SaaS | Engineering time, Wallet is phase 2 |

For a branded internal sales tool embedded in [sojern.design](https://sojern.design), **building Phase 1 on Webflow Cloud** is the right call. Wallet in Phase 2 if reps strongly want lock-screen access.

---

## Decided

| Decision | Choice |
|----------|--------|
| **Slug format** | Public readable slug (e.g. `jane-smith`) |
| **Search indexing** | Card pages **not indexed** (noindex + robots.txt) |
| **Edit access** | Anyone with the **edit link** (secret token in URL) |
| **Storage** | Cloudflare KV via Webflow Cloud binding |
| **Owner phone access (v1)** | Add to Home Screen (PWA) + saved QR image; Wallet in Phase 2 |

### SEO / privacy (slug is public but unlisted)

"Not indexed" ≠ private. It means Google/Bing won't list the page, but anyone with the URL can still open it.

**Implementation:**
- `<meta name="robots" content="noindex, nofollow">` on all `/c/{slug}` pages
- `X-Robots-Tag: noindex` response header
- `robots.txt` disallow: `/business-card/c/`
- Do not link card pages from public Design Hub navigation or sitemap
- Edit URL includes secret token: `/business-card/edit/jane-smith?key={random}` — separate from public view URL

### Edit link model

- **Public view:** `/business-card/c/jane-smith` (shareable, scan target)
- **Edit:** `/business-card/edit/jane-smith?key=abc123...` (only shown once at card creation; rep bookmarks this)
- No login/SSO for v1 — possession of edit link = permission to edit

### Home screen / lock screen (not a true iOS Widget)

| Method | Home screen | Lock screen | Build effort |
|--------|-------------|-------------|--------------|
| **Add to Home Screen (PWA)** | ✅ App-like icon | ❌ | Low — web manifest + instructions |
| **QR saved to Photos** | ✅ (in Photos app) | ❌ | None — download in builder |
| **Bookmark card page** | ✅ | ❌ | None |
| **iOS/Android Widget** | ❌ for web apps | ❌ | Requires native app |
| **Apple Wallet pass** | ✅ (in Wallet) | ✅ double-tap side button | Phase 2 — PassKit signing |

Blinq's "widget" is a **native app feature**. Our web equivalent is **Add to Home Screen** — opens the card/QR in one tap, no Safari chrome. True lock-screen access needs **Apple Wallet** (Phase 2).

### Webflow Cloud KV

Yes — KV is provisioned through Webflow Cloud when you declare a binding in `wrangler.json`. No separate Cloudflare dashboard setup required.

```json
"kv_namespaces": [
  { "binding": "CARDS", "id": "..." }
]
```

Webflow Cloud auto-generates the namespace ID on deploy. See [Webflow Cloud KV docs](https://developers.webflow.com/webflow-cloud/storing-data/key-value-store).

---

## References

- [Blinq — Digital Business Card](https://blinq.me/solutions/digital-business-card)
- [Blinq — Apple & Google Wallet](https://blinq.me/solutions/digital-business-card/apple-and-google-wallet)
- [Blinq Help — Add to Apple Wallet](https://support.blinq.me/en/articles/68011-add-your-blinq-card-to-apple-wallet)
- [Blinq Help — Editing cards](https://support.blinq.me/en/articles/68024-editing-your-blinq-digital-business-card)
- [Blinq Help — Android save contact](https://support.blinq.me/en/articles/68045-saving-a-contact-to-an-android-device)
- [Blinq — Dynamic QR codes](https://blinq.me/blog/how-to-create-and-use-a-dynamic-qr-code)
- [Apple PassKit Developer Guide](https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/PassKit_PG/)
- [vCard QR — platform behavior](https://linked.codes/blog/qr-code-add-contact-to-phone)
