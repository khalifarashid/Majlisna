# Majlisna Web App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Majlisna prototype (resident app, majlis staff dashboard, vendor portal, business dashboard, Claude-powered AI) as a static React site deployed to GitHub Pages.

**Architecture:** Pure, tested domain modules (`src/domain`) hold every rule and number. One persisted store (`src/store`) exposes typed actions to views and syncs tabs over `BroadcastChannel`. Views are split per role under `src/views/<role>`. AI calls go through one client (`src/ai/client.ts`) with a scripted fallback.

**Tech Stack:** Vite 7, React 18, TypeScript 5, Tailwind CSS 4 (`@tailwindcss/vite`), Framer Motion (`motion`), lucide-react, react-router-dom 6 (HashRouter), Vitest, @fontsource fonts, GitHub Actions Pages.

**Spec:** `docs/superpowers/specs/2026-11-24-majlisna-app-design.md`

## Global Constraints

- Static hosting only; Vite `base: '/Majlisna/'`; HashRouter.
- Every view shows the prototype notice: sample data, not an official government service.
- English and Arabic; `dir="rtl"` when Arabic; use logical CSS properties (`ms-`, `me-`, `ps-`, `pe-`, `start`, `end`).
- No secrets committed. Claude API key only in viewer `localStorage` (`majlisna.aiKey`).
- Money in AED, integers or 2 decimals, formatted with `Intl.NumberFormat`.
- Commission rate default 0.08; vendor share = 1 − rate.
- Price points: coffee 2100, ayyala 1000, photo/film 1750, catering 4200 (30 guests); average 2262.5.
- Brand: deep green `#1E4636`-family + gold `#B08A3E`-family + warm sand neutrals.

---

## File Structure

```
index.html                      fonts preload, meta, root
vite.config.ts                  base path, react + tailwind plugins, vitest config
.github/workflows/deploy.yml    build + deploy Pages
public/favicon.svg              logo mark
src/main.tsx                    mount, providers
src/App.tsx                     HashRouter routes
src/styles.css                  tailwind import, @theme tokens, base, sadu pattern utilities
src/domain/types.ts             all domain types
src/domain/money.ts             formatAED, splitCommission
src/domain/forecast.ts          workbook model, breakEven
src/domain/requests.ts          request transitions, clash detection, suggestDates
src/domain/recommend.ts         deterministic interest scoring (AI fallback + baseline)
src/domain/seed.ts              sample majlises, events, vendors, reviews, requests, announcements
src/store/reducer.ts            pure reducer (tested)
src/store/StoreProvider.tsx     context, persistence, BroadcastChannel, useStore()
src/i18n/strings.ts             EN/AR dictionary
src/i18n/I18nProvider.tsx       lang, dir, t(), useI18n()
src/ai/client.ts                askClaude(), key mgmt, AiError
src/ai/features.ts              recommendEvents, chatAssistant, generateIdeas, summarizeReviews
src/components/*                Logo, Sadu, ui primitives, Calendar, RoleSwitcher, PrototypeBanner, AiBadge, Toasts
src/views/Landing.tsx           hero + role entry
src/views/resident/*            shell + Home, Majlises, MajlisDetail, Planner, Vendors, Checkout, Assistant, Profile
src/views/staff/*               StaffDashboard, RequestPanel, StaffCalendar, Compose
src/views/vendor/VendorPortal.tsx
src/views/business/*            BusinessDashboard, ForecastModel, ProForma
src/views/Settings.tsx          AI key, reset demo, language
```

---

### Task 1: Scaffold, tooling, deploy workflow

**Files:** Create `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles.css`, `.github/workflows/deploy.yml`, `.gitignore`, `README.md`.

**Produces:** `npm run dev`, `npm run build`, `npm test` scripts.

- [ ] Scaffold with `npm create vite@latest . -- --template react-ts`; install `tailwindcss @tailwindcss/vite motion lucide-react react-router-dom @fontsource/ibm-plex-sans-arabic @fontsource-variable/fraunces` and dev `vitest`.
- [ ] `vite.config.ts`: `base: '/Majlisna/'`, plugins `react()`, `tailwindcss()`, `test: { environment: 'node' }`.
- [ ] Deploy workflow: on push to `main` → `actions/checkout@v4`, `actions/setup-node@v4` (node 22, npm cache), `npm ci`, `npm test -- --run`, `npm run build`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3` (`dist`), `actions/deploy-pages@v4`; permissions `pages: write`, `id-token: write`.
- [ ] Run `npm run build` → expect success.
- [ ] Commit `chore: scaffold vite react app with pages deploy`.

### Task 2: Money + forecast domain (TDD)

**Files:** Create `src/domain/types.ts`, `src/domain/money.ts`, `src/domain/forecast.ts`; Test `src/domain/forecast.test.ts`, `src/domain/money.test.ts`.

**Produces:**
- `splitCommission(amount: number, rate = 0.08): { gross: number; fee: number; vendor: number }`
- `formatAED(n: number, lang: 'en'|'ar'): string`
- `type ForecastInputs = { orders: number; avgPrice: number; rate: number; hosting: number; opex: OpexLines }`
- `BASE_2026`, `BASE_2027: ForecastInputs`
- `runForecast(i: ForecastInputs): { gross: number; revenue: number; costOfServices: number; grossProfit: number; opexTotal: number; net: number; breakEvenOrders: number; perOrderCommission: number }`

- [ ] Tests (must fail first):
  - `splitCommission(1000)` → `{ gross: 1000, fee: 80, vendor: 920 }`
  - `runForecast(BASE_2026)` → gross 339375, revenue 27150, grossProfit 17150, opexTotal 115600, net −98450, breakEvenOrders 694, perOrderCommission 181
  - `runForecast(BASE_2027)` → gross 6787500, revenue 543000, grossProfit 525000, opexTotal 419800, net 105200, breakEvenOrders 2419
  - break-even uses `Math.ceil((opexTotal + hosting) / perOrderCommission)`
- [ ] Implement; run `npx vitest run src/domain` → PASS.
- [ ] Commit `feat(domain): commission split and workbook forecast model`.

### Task 3: Requests domain (TDD)

**Files:** Create `src/domain/requests.ts`; Test `src/domain/requests.test.ts`.

**Produces:**
- `type RequestStatus = 'pending' | 'approved' | 'rejected' | 'alternative' | 'cancelled'`
- `transition(req: DateRequest, action: RequestAction): DateRequest` (throws `InvalidTransition`)
  - pending → approve / reject(reason) / suggest(date) ; alternative → acceptAlternative (→ approved with new date) / declineAlternative (→ cancelled); pending → cancel
- `findClashes(requests: DateRequest[]): Map<string, string[]>` keyed `majlisId|date`, only active statuses (pending, approved, alternative)
- `isDateTaken(requests, majlisId, date): boolean` (approved only)
- `suggestDates(requests, majlisId, fromDate, count = 3, weekendsFirst = true): string[]` skipping approved dates and past dates

- [ ] Tests: approve sets `decidedAt`; reject without reason throws; suggest sets `alternativeDate`; acceptAlternative moves `date` and status approved; approving a request whose date is already approved for that majlis throws; clashes detect two pending same majlis/date; suggestDates skips taken dates and returns Thu/Fri/Sat first.
- [ ] Implement; tests PASS; commit `feat(domain): date request state machine and scheduling helpers`.

### Task 4: Seed data + store (TDD on reducer)

**Files:** Create `src/domain/seed.ts`, `src/domain/recommend.ts`, `src/store/reducer.ts`, `src/store/StoreProvider.tsx`; Test `src/store/reducer.test.ts`, `src/domain/recommend.test.ts`.

**Produces:**
- `State = { version: 1; role: Role; residentId: string; interests: string[]; aiPrefs: {...}; majlises; events; vendors; services; requests; orders; announcements; issues; reviews; rsvps: string[]; notifications }`
- Actions: `setRole`, `setInterests`, `toggleRsvp`, `submitRequest`, `staffDecide` (approve/reject/suggest), `residentRespond` (accept/decline alternative), `placeOrder` (requires approved request), `vendorUpdateOrder` (confirm/decline/complete), `postAnnouncement`, `reportIssue`, `addReview`, `markNotificationsRead`, `reset`.
- `useStore(): { state, dispatch }`, selectors `myRequests`, `activeApprovedRequest`.
- `scoreEvents(events, interests): {eventId, score, reasonKey}[]`

- [ ] Reducer tests: `placeOrder` before approval is ignored and returns same state; full loop submit → approve → placeOrder → confirm → complete gives one completed order with fee 8%; `reset` returns seed.
- [ ] StoreProvider: load `majlisna.state.v1` from localStorage (try/catch, version check), save on change, `BroadcastChannel('majlisna')` post + receive full state.
- [ ] Tests PASS; commit `feat(store): seeded persisted store with cross-tab sync`.

### Task 5: Design system + i18n

**Files:** `src/styles.css`, `src/i18n/*`, `src/components/{Logo,Sadu,ui,Calendar,PrototypeBanner,AiBadge,Toasts,RoleSwitcher}.tsx`.

- [ ] Tokens in `@theme`: colors (green 50–950, gold, sand, ink), fonts (`Fraunces Variable` display Latin, `IBM Plex Sans Arabic` UI + Arabic), radii, shadows; Sadu geometric pattern as inline SVG background utility.
- [ ] Logo: SVG majlis facade with arches + flag, wordmark EN + AR.
- [ ] I18n: `t(key)` with EN/AR maps; `<html lang dir>` updated; number formatting per lang.
- [ ] Build passes; commit `feat(ui): brand tokens, logo, bilingual primitives`.

### Task 6: Landing, shell, routing, settings

- [ ] Routes: `/` Landing, `/r/*` resident, `/staff`, `/vendor`, `/business`, `/settings`.
- [ ] Landing hero: logo, value prop, 4 role cards, research basis strip (537 → 56 → 25 studies, 4 themes), prototype notice.
- [ ] Settings: AI key field (masked, test button), model note, reset demo, language.
- [ ] Commit `feat: landing, role shell and settings`.

### Task 7: Resident views

- [ ] Phone-frame shell on desktop, full-screen on mobile; bottom tabs Home / Majlises / Plan / Assistant / Profile.
- [ ] Home, Majlises + detail calendar, Planner (stepper + status timeline + accept/decline alternative), Vendors (category tabs, add to plan), Checkout (split breakdown, demo pay → orders), Profile (interests, AI privacy, report issue, notifications).
- [ ] Commit `feat(resident): discovery, wedding planner and vendor booking`.

### Task 8: Staff dashboard

- [ ] KPI row, queue with clash badges and filters, RequestPanel (approve, reject + reason, suggest via `suggestDates` chips), month calendar, compose announcement/event.
- [ ] Commit `feat(staff): request review dashboard`.

### Task 9: Vendor portal

- [ ] Vendor picker (sample vendors), profile + verification, orders table with confirm/decline/complete, earnings (gross/fee/net), reviews + AI summary.
- [ ] Commit `feat(vendor): orders and earnings portal`.

### Task 10: Business dashboard

- [ ] Live metrics from store, forecast sliders bound to `runForecast`, 2026/2027 base toggle, break-even bar, pro forma income statement + balance sheet tables with caveats.
- [ ] Commit `feat(business): live metrics, forecast model and pro forma`.

### Task 11: AI

**Produces:** `askClaude({ system, messages, maxTokens, json? }): Promise<string>`; `hasAiKey()`; features with fallbacks.

- [ ] Client: `fetch('https://api.anthropic.com/v1/messages')` with headers `x-api-key`, `anthropic-version: 2023-06-01`, `anthropic-dangerous-direct-browser-access: true`; model `claude-haiku-5-5` for picks and summaries, `claude-sonnet-5-5` for chat and ideas; error mapping (401 bad key, 429 rate limit, network).
- [ ] Features: picks (JSON ids + reason), assistant (grounded context JSON, replies in user's language), ideas (JSON: title, palette hex[4], setup bullets, timeline), review summary (JSON: sentiment score, positives, concerns).
- [ ] Respect `aiPrefs`; show SLR theme tag on each AI surface.
- [ ] Commit `feat(ai): claude-powered picks, assistant, ideas and review insights`.

### Task 12: Verify + polish

- [ ] `npm test -- --run` and `npm run build` pass.
- [ ] Browser: 375px and 1440px, EN + AR; full loop across two tabs; no console errors.
- [ ] Motion pass (enter/exit, press feedback, reduced motion).
- [ ] Commit `polish: motion, responsive and rtl fixes`.

### Task 13: Ship

- [ ] Push `main` to `origin`; user sets Pages source to GitHub Actions; confirm site at `https://khalifarashid.github.io/Majlisna/`.
