# PASOLA Signature Estate · pasola.fr

Production repo for the PASOLA Signature Estate website.

## Stack

- **Static HTML / CSS / vanilla JS** — no build step required for R1
- **Cloudflare Pages** — hosting + DDoS + edge SSL + global CDN
- **Cloudinary** — video + image CDN with on-the-fly transforms
- **EmailJS** — form submissions to inbox (no backend, R1)
- **Cloudflare Workers + R2 + D1** — data room natif (R2)
- **Schema.org JSON-LD** — institutional SEO

Mobile-first. Desktop overrides via `min-width: 769px`. Chrome-only.

## URL convention · validated

All URLs in English regardless of language. Language signaled by `/en/` prefix only.

```
/                               Homepage FR (canonical)
/en/                            Homepage EN

/the-place/                     FR · The Place
/en/the-place/                  EN

/residences/                    FR & EN
/architecture/                  FR & EN
/makers/                        FR & EN
/library/                       FR & EN
/news/                          FR & EN
/contact/                       FR & EN
/register-interest/             FR & EN

/capital-partners/              FR & EN — header + footer
/capital-partners/data-room/    NDA-gated R2 (CF Workers native)

/legal-notices/, /privacy/, /cookies/   FR & EN
```

## Structure

```
/
├── index.html                  Homepage FR (canonical)
├── en/index.html               Homepage EN (R1)
├── the-place/                  R1 coming-soon · R2 full
├── residences/                 R1 coming-soon · R2 full
├── architecture/               R1 coming-soon · R2 full
├── makers/                     R1 coming-soon · R3 full
├── library/                    R1 coming-soon · R2 full
├── news/                       R1 coming-soon · R3 full
├── contact/                    R1 live
├── register-interest/          R1 live
├── capital-partners/
│   ├── index.html              R1 landing public
│   ├── thesis/                 R2
│   └── data-room/              R2 · Workers + R2 storage + D1 logs
├── legal-notices/, privacy/, cookies/
├── styles/main.css             Mobile-first
├── scripts/main.js             Vanilla JS
├── assets/                     Favicons, og-image
├── workers/                    CF Workers source (R2)
├── sitemap.xml + robots.txt
└── .gitignore + README.md
```

## Coming-soon strategy (R1)

Pages declared but not yet developed (Vision, The Place, Residences, Architecture, Library, News, Makers) ship in R1 as **real editorial coming-soon pages**, not redirects. Each:
- Same chrome (header, nav, footer) as homepage
- Brief editorial intro of what's coming (1-2 paragraphs in PASOLA voice)
- Register-interest CTA inline
- Footer with legal + language switch

Decision rationale: maintains brand register on every URL hit, keeps Google indexing meaningful, gives prospects a complete experience even on incomplete pages.

## Capital Partners surface

Per validated decision: CP visible **in both header (discrete, last item)** and **footer**. Header link in same Outfit 11px tracking 0.22em as nav, with subtle "→" indicator marking institutional track.

## Data room · Cloudflare Workers native (R2)

**Architecture:**
- `/capital-partners/access-request/` — public form for NDA + access request
- Worker receives form, emails Jonathan for manual validation
- On approval, Worker generates JWT magic-link (7-day validity)
- Email sent to prospect with magic-link
- Worker validates JWT, sets HttpOnly cookie, serves data room
- Documents in **R2** object storage (IM, financials, contracts, hi-res photos)
- Access logs in **D1** SQL (who/what/when/IP)

**Cost:** ~5 EUR/month for the volume expected. No subscription lock-in.

**Trade-off accepted:** No native page-by-page tracking. If becomes critical mid-fundraising, add Cloudflare Web Analytics + custom event tracking (~2 days).

## Local development

```sh
# R1 static
python3 -m http.server 8000

# R2 with Workers
npm install -g wrangler
wrangler dev
```

## Deploy

```sh
git add .
git commit -m "Update copy"
git push origin main
```

Cloudflare project settings:
- Framework: None
- Build command: empty (R1)
- Build output: `/`

## Assets pipeline

**Video.** Cloudinary `cloud_name=ds85vc2ul`. Hero URL:
```
https://res.cloudinary.com/ds85vc2ul/video/upload/q_auto,f_auto,w_1920/PASOLA_Sumba_Teaser_2MB_1_zdla86.mp4
```

**Audio.** `bg-music.mp3` currently served from `pasola.fr/bg-music.mp3`. To internalize: copy to `/assets/bg-music.mp3`.

**Photos.** Spirit/Vision served from `pasola.fr/*.jpg`. Same internalization recommendation.

**Favicons.** Interim v2 (biseau 22°). Substitute on illustrator delivery per `pasola-interim-emblem-system-v2.html` checklist.

## Brand discipline (per brand-book-v1.1)

- No "villa" — use "résidence"
- No price disclosure publicly
- No adjective stacks
- No "Marapu" (cultural interdiction)
- Tonal family: Aman / Mareterra / Singita
- Anti-pattern: Rinjani Bay

## Roadmap

| Wave | Timing | Scope |
|---|---|---|
| **R1** | 2-3 weeks | Homepage FR + EN, capital-partners landing, register-interest, contact, coming-soon × 7, legal, admin login skeleton |
| **R2** | 4-6 weeks post-R1 | Full pages Vision/The Place/Residences (+ 3 zones)/Architecture/Library, **data room CF native**, admin dashboard |
| **R3** | 2-3 months post-R2 | Makers, Facts & Figures, booklets soft-gate, news archive, NDA gallery, illustrator emblem swap |

## Versioning

- `main` → production (pasola.fr)
- `develop` → preview (develop.pasola-web.pages.dev)

## License

All rights reserved · PASOLA Signature Estate · Jonathan Beraud + Jennifer Beraud · 2026.
