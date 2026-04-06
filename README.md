# Hindustan Pay

> Apna paisa, apna hisaab — Your money, your account.  
> A premium personal finance companion built for India.  


## Screenshots

| Screen | Description |
|--------|-------------|
| Home Dashboard | Balance card, 3D globe / donut fallback, quick actions, net worth |
| Transactions | Search, filters, swipe actions, bulk select & export |
| Goals | Savings, challenges, no-spend, budgets with gauges |
| Insights | Month chips, donut, trends, heatmap, category drill-down |
| Profile | Theme, accent, font size, categories, CSV/PDF export |
| Onboarding & PIN | Slides, PIN setup, biometric opt-in |
| Modals | Add/edit transaction, split, budgets, category management |

## Features

| Feature | Status | Notes |
|---------|--------|-------|
| Onboarding carousel | ✅ | Skip + completion flag |
| PIN + biometric | ✅ | Secure store, lock timeout |
| Home balance ticker | ✅ | Reanimated + runOnJS |
| Three.js globe + fallback | ✅ | GL timeout → donut |
| Pull to refresh | ✅ | Toast “Updated just now” |
| Net worth card | ✅ | All-time + monthly delta + sparkline |
| Upcoming recurring widget | ✅ | Next 7 days, top 3 |
| Transactions CRUD | ✅ | SQLite + Zustand |
| Search (regex-safe) | ✅ | Escape + try/catch |
| Swipe edit / duplicate / delete | ✅ | GestureHandler |
| Bulk select / delete / CSV share | ✅ | |
| Split transaction | ✅ | Parent id preserved |
| Categories (defaults + custom) | ✅ | Manage modal, DB-backed |
| Budgets | ✅ | Multi-month apply, alerts |
| Goals & contribute | ✅ | SQLite persistence |
| Insights & heatmap | ✅ | Month-scoped, drill-down modal |
| Notifications | ✅ | Budget, daily, weekly |
| Export CSV / PDF | ✅ | Share sheet |
| Accent + font size | ✅ | Settings store |
| Dark / light theme | ✅ | |

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Expo SDK 54 | Managed workflow, OTA-friendly |
| Language | TypeScript | Safety across DB + UI |
| Navigation | Expo Router | File-based routes, modals |
| State | Zustand | Small API, persist middleware |
| Database | expo-sqlite | On-device, offline-first |
| ORM | Drizzle | Typed queries, migrations path |
| Charts | Victory Native XL | Skia-backed charts |
| 3D | three + expo-gl | Globe; fallback when GL fails |
| Animations | Reanimated + Moti | 60fps UI |
| Gestures | RNGH | Swipeable rows, FAB |
| Auth surface | PIN + LocalAuthentication | No remote auth in demo |
| Notifications | expo-notifications | Local triggers |
| Storage | AsyncStorage + SecureStore | Settings vs secrets |
| Forms | react-hook-form + zod | Modal flows |
| Icons | @expo/vector-icons (MCI) | Consistent set |
| Dates | date-fns | Tree-shakeable |
| Export | expo-sharing, expo-print | CSV / PDF |

## Architecture

```
app/                 # Expo Router: auth, tabs, modals
src/
  components/      # UI, charts, home, goals, transactions
  constants/       # Theme, currencies, default categories
  db/              # client, init, schema, queries, migrate hook
  hooks/           # useTheme, useCurrency, category helpers
  store/           # Zustand stores
  types/           # Shared TS types
  utils/           # Insights, CSV, notifications, recurring
assets/
  images/          # Generated icons/splash (see script below)
  lottie/          # Empty states
```

## Getting Started

### Prerequisites

- Node 18+
- Xcode 15+ (iOS) / Android Studio Hedgehog+ (Android)

### Installation

```bash
git clone <repo>
cd Hindustan\\ Pay
npm install --legacy-peer-deps
npm run generate-assets
npx expo start
```

### Running

```bash
npx expo run:ios
npx expo run:android
npx expo start
```

Expo Go is limited (e.g. some GL / biometric behaviors).

## Design Decisions

1. **Dark-first UI** — Reduces glare for a finance app; light mode follows the same tokens.  
2. **Globe with fallback** — Three.js + expo-gl when available; timed fallback avoids blank screens on weak devices or Expo Go.  
3. **Drizzle + SQLite** — Typed schema, easy migrations, no extra native sync layer for this scope.  
4. **Zustand** — Less boilerplate than Redux for local UI + hydration.  
5. **Victory Native XL** — Performs well on device; empty states guard zero/empty series.  
6. **Expo Router** — Deep links and modals match product flows (add transaction, split, budgets).  
7. **Hashed / secured PIN** — PIN lives in SecureStore (see auth store), not plain prefs.  
8. **Glass-style cards** — Blur + borders for hierarchy without heavy chrome.

## Assumptions

1. Single user per install (no multi-account).  
2. Currency formatting is display-layer; amounts stored with transaction currency.  
3. Recurring expansion is client-side on refresh / background task.  
4. “Net worth” demo = sum(income) − sum(expense) over non-deleted rows.  
5. Category icons are MaterialCommunityIcons names stored as strings.

## Known Limitations

- expo-three peer friction (here: raw THREE + expo-gl).  
- Background fetch interval is OS-enforced.  
- PDF paths can differ on Android emulators vs devices.  
- HTML-to-PDF may need file permissions on some Android setups.  
- Three.js / GL unavailable in some Expo Go builds → fallback chart.

## Future Improvements

- Cloud sync (e.g. Supabase)  
- Bank import (Plaid / regional APIs)  
- AI spending nudges  
- Apple / Google Pay handoff  
- Family shared budgets  
- Home-screen widgets  
- Apple Watch / Wear companion  
- Desktop shell (Electron)

