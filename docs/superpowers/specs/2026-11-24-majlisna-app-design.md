# Majlisna Web App: Design Spec

Date: 2026-11-24
Sources: Capstone Project 1 progress deck and SLR (AI in Event Management for Personalized Experiences), IBS485 Assignment 3 business plan, Majlsna income statement / balance sheet workbook.

## Goal

A polished, working prototype of Majlisna (مجلسنا), the proposed digital platform for UAE government majlises, that the team can demo for Capstone and Venture Creation, and extend in Capstone Project 2. It must show the full date-request → approval → vendor-booking loop, the 8% commission model, and AI features traced back to the SLR themes.

## Constraints

- Hosted on GitHub Pages (static files, no server). Repo: `khalifarashid/Majlisna`.
- Prototype only: every screen states it is sample data and not an official government service (matches the business plan's own caution). No real government logos, no real vendor brands, no real payments.
- Bilingual English / Arabic with full RTL layout.
- No secrets in the repo.

## Architecture

- Vite + React 18 + TypeScript, Tailwind CSS v4, Framer Motion, lucide-react icons, react-router (HashRouter for Pages).
- State: one store (React context + reducer) persisted to `localStorage`, synced across open tabs with `BroadcastChannel`. A resident tab and a staff tab update each other live. "Reset demo" restores seed data.
- Domain logic lives in pure modules under `src/domain/` (unit-tested with Vitest): request state machine, date-clash detection, alternative-date suggestion, commission split, forecast model, break-even.
- AI: `src/ai/` calls the Claude Messages API straight from the browser using a key the viewer pastes in Settings (kept in that browser's `localStorage` only). Without a key, a scripted fallback answers so the demo always works. The AI never approves or rejects anything. Staff decide.
- Deploy: GitHub Actions workflow builds and publishes to Pages on push to `main`.

## Roles and screens

A role switcher (Resident / Majlis staff / Vendor / Business) sits in the app header.

### Resident (mobile-first, bottom tab bar)
- **Home**: greeting, "Picked for you" AI event recommendations with a one-line reason, upcoming events, majlis announcements.
- **Majlises**: list of sample Abu Dhabi majlises; detail with capacity, amenities, and an availability calendar.
- **Wedding planner**: choose majlis → choose date (booked days blocked) → submit free request → status timeline: Pending → Approved / Rejected (with reason) / Alternative date suggested (accept or decline). Once approved, the vendor marketplace unlocks.
- **Vendors**: four categories with the plan's price points: Arabic coffee & hospitality AED 2,100; Al Ayyala performance AED 1,000; photography & filming AED 1,750; catering AED 4,200 (30 guests). Add to plan → demo checkout showing vendor 92% / Majlisna 8%.
- **Assistant**: bilingual chat ("Ask Majlisna") grounded in the app's majlis, event and vendor data.
- **Profile**: interests (drive recommendations), language, AI privacy toggles (use my interests; AI features on/off), report a community issue.

### Majlis staff (desktop layout)
- KPIs: pending requests, approved this month, average response time.
- Request queue with clash flags (two requests for the same majlis and date). Detail panel: approve / reject with reason / suggest alternative date (system proposes nearest free dates; staff pick).
- Month calendar of confirmed bookings. Post announcements and events.

### Vendor
- Verified profile (licence check status), incoming orders → confirm → mark completed.
- Earnings: gross, 8% Majlisna fee, net payout.
- AI review summary (sentiment and themes).

### Business
- Live metrics from orders in the app: completed orders, gross bookings, commission.
- Forecast model with sliders (majlises, orders per majlis, average service price, commission rate) → revenue, cost, net income, break-even orders. Base case reproduces the workbook exactly: 2026 revenue AED 27,150, net (AED 98,450); 2027 revenue AED 543,000, net AED 105,200; break-even 694 (2026) and 2,419 (2027) orders.
- Pro forma income statement and balance sheet tables for 2026 / 2027 with the workbook's caveats.

## AI features (each tagged with its SLR theme)

| Feature | SLR theme |
|---|---|
| Personalized event picks with a reason | Theme 1 ML, Theme 2 personalization |
| Ask Majlisna assistant (EN/AR) | Theme 1 NLP |
| Event and decor idea generator (palette, setup, timeline) | Theme 1 generative AI, Theme 2 visualize ideas |
| Vendor review sentiment summary | Theme 1 participant feedback |
| Clash flags + alternative dates for staff (deterministic) | Theme 1 NLP/scheduling, Theme 3 human review |

Privacy and trust (Theme 2/3): AI is opt-in per feature, explains its picks, and humans make every decision.

## Error handling

- AI call fails or no key → scripted fallback plus a small notice; never blocks a flow.
- Corrupt or old `localStorage` → versioned store; mismatched version resets to seed.
- Invalid actions (booking vendors before approval, double-requesting a booked date) are prevented in the domain layer and in the UI.

## Testing

- Vitest unit tests for the domain modules, including the workbook base-case numbers.
- `npm run build` must pass (type-check included).
- Browser check: phone and desktop widths, English and Arabic, full request → approve → book → vendor complete → business metrics loop.

## Out of scope (Capstone 2)

Real accounts, cross-device sync (Supabase or similar), real payments, government integration, maps API.
