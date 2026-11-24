# Majlisna · مجلسنا

A working prototype of **Majlisna**, a digital platform for UAE government majlises. Residents request a majlis date, the government majlis team decides, and families book trusted local services (Arabic coffee, Al Ayyala, photo and film, catering) and pay in one app. Majlisna earns 8% on completed paid services.

**Live demo:** https://khalifarashid.github.io/Majlisna/

> Student prototype for Zayed University (IDS-493 Capstone Project 1 and IBS485 Venture Creation) by Ahmed Almazrouei and Salem Alrumaithi. All majlises, vendors and people are sample data. It is not an official government service.

## What's inside

| View | What you can do |
|---|---|
| **Resident** (phone) | See AI-picked events and announcements, browse majlises and their availability, request a wedding date, follow the decision, book vendors, pay (demo), review services, ask the bilingual assistant, get decor ideas, report a community issue, control AI and privacy settings. |
| **Majlis team** | Review the request queue with date-clash flags, approve, decline with a reason, or suggest the nearest free evenings; see the bookings calendar; handle community reports; post announcements. |
| **Vendor** | Confirm or decline orders, mark them completed, see payouts after the 8% fee, read reviews and an AI summary of them. |
| **Business** | Live commission from activity in the demo, a forecast model with sliders and a break-even chart, and the 2026/2027 pro forma income statement and balance sheet. |

The views share one store and sync across browser tabs: open the Resident view in one tab and the Majlis team view in another, send a request, and watch it arrive.

## AI features and the research behind them

Every AI feature traces back to a theme from our systematic literature review (PRISMA 2020: 537 records → 56 full texts → 25 studies).

| Feature | Review theme |
|---|---|
| Personalised event picks, each with a reason | Theme 1–2: machine learning and personalisation |
| "Ask Majlisna" assistant in Arabic and English | Theme 1: natural language processing |
| Decor palette, setup and run-of-show ideas | Theme 1–2: generative AI |
| Review sentiment summary for vendors | Theme 1: participant feedback analysis |
| Date-clash flags and nearest free dates for staff | Theme 1 and 3: scheduling with human review |

AI never approves anything; the majlis team decides every request. Residents can switch personalisation off, and then their interests are never used or sent.

### Demo AI (default) and optional Claude

Out of the box, every AI feature runs on the built-in **demo AI** (`src/ai/demo.ts`): rules and prepared answers computed from the app's live data, labelled "AI demo". The assistant understands common questions in English and Arabic (prices by category, guest capacity, a named majlis, events by topic or weekend, payments and refunds, request status, verification, privacy) and replies in the language it was asked in.

Optionally, a viewer can add their own **Anthropic API key** in **Settings** to switch to real Claude answers. GitHub Pages has no server, so the key is stored only in that browser's `localStorage` and sent only to `api.anthropic.com`.

- Model: `claude-opus-5-5`, with server-side refusal fallback enabled.
- The Anthropic SDK is loaded only after a key is added, so visitors without one never download it.
- For demos, use a key with a spending limit and remove it from shared computers.

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5173/Majlisna/
npm test         # domain and store unit tests
npm run build    # type-check + production build into dist/
```

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which tests, builds and publishes to GitHub Pages. One-time setup: in the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.

## Project structure

```
src/
  domain/      rules and numbers, no UI: request lifecycle, scheduling, commission, forecast, seed data
  store/       one reducer + provider, persisted to localStorage, synced across tabs
  ai/          key handling, lazy Claude client, the four AI features with fallbacks
  i18n/        English/Arabic provider and labels
  components/  design system: logo, Sadu band, arches, calendar, primitives
  views/       landing, resident, staff, vendor, business, settings
docs/superpowers/  design spec and implementation plan
```

The forecast in `src/domain/forecast.ts` reproduces the team's workbook exactly; `forecast.test.ts` checks every headline figure (revenue AED 27,150 and AED 543,000; net (AED 98,450) and AED 105,200; break-even 694 and 2,419 orders).

## Next steps (Capstone Project 2)

Real accounts and roles, a backend for cross-device data (for example Supabase), a licensed payment provider with split payouts, government integration for the approval dashboard, a server-side AI proxy, and usability testing with residents, majlis staff and vendors.

## Design

Majlis green and Dallah gold from the Majlisna logo, Al Sadu weave patterns, and the majlis arch as the recurring shape. Reem Kufi for Latin headings, El Messiri for Arabic headings, IBM Plex Sans Arabic for the interface, IBM Plex Mono for figures. Chart colours were checked for colour-blind safety.
