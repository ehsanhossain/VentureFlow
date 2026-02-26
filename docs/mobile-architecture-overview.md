# 🏗️ VentureFlow Mobile Architecture Overview

## Current Stack

```
Frontend (React/Vite) → API → Laravel Backend → PostgreSQL
```

## Proposed Multi-Platform Stack

```
┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Web (React)    │  │  Android (Kotlin)│  │  iOS (Swift)     │
│  localhost:5173  │  │  Jetpack Compose │  │  SwiftUI         │
└────────┬────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                    │                      │
         └────────────────────┼──────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  Laravel API       │
                    │  (Sanctum tokens)  │
                    │  alpha.ventureflow │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │  PostgreSQL        │
                    └────────────────────┘
```

## Key Architecture Decisions

| Decision | Recommendation | Why |
|----------|----------------|-----|
| **Android** | Kotlin + Jetpack Compose | Modern, Google's recommended, concise syntax |
| **iOS** | Swift + SwiftUI | Apple's modern UI framework, declarative like Compose |
| **Auth** | Sanctum API tokens (not cookies) | Mobile apps can't use cookie-based sessions |
| **State** | Each app manages its own local state | Offline-first capability |
| **Push notifications** | Firebase (Android) + APNs (iOS) | Standard for each platform |

## Alternative: Cross-Platform (Saves Time)

Instead of 2 native codebases, you could use React Native or Flutter:

| Option | Pros | Cons |
|--------|------|------|
| **React Native** | Reuse React knowledge, share some web components | Performance slightly lower, bridge overhead |
| **Flutter (Dart)** | Beautiful UI, single codebase, fast | New language (Dart), can't share web code |
| **Native (Kotlin + Swift)** | Best performance, full platform access | 2 separate codebases, 2× dev time |

> For VentureFlow (mostly forms, tables, data display), **React Native** could be the most efficient since your team already knows React/TypeScript.

## CI/CD Would Look Like

```
main branch push
  ├── Web: GitHub Actions → Build React → Deploy to Plesk (existing)
  ├── Android: GitHub Actions → Build APK/AAB → Upload to Google Play Console
  └── iOS: GitHub Actions (macOS runner) → Build IPA → Upload to TestFlight/App Store
```

## Backend Changes Needed

- **Switch Sanctum from cookie-based to token-based auth** for mobile (add `Authorization: Bearer <token>` header support)
- **Add push notification endpoints** (device token registration)
- **API versioning** (`/api/v1/...`) to avoid breaking mobile while web evolves

## AI Coding Capabilities

| Language | Capability |
|----------|-----------|
| **Kotlin** | ✅ Yes — Jetpack Compose, Retrofit, Coroutines |
| **Swift/SwiftUI** | ✅ Yes — but can't run Xcode (no macOS environment) |
| **React Native** | ✅ Yes — and can test it locally |
| **Flutter/Dart** | ✅ Yes — can write and structure the code |

**Practical limitation**: Can't run iOS simulators (requires macOS/Xcode). For Android and React Native, can build and test more directly.

## Recommendation

If/when you decide to go mobile, start with **React Native** — you'd reuse your TypeScript skills, share API service code with the web frontend, and maintain one mobile codebase for both platforms. Native (Kotlin + Swift) would only be justified if you need heavy device-specific features (camera processing, AR, etc.) which VentureFlow doesn't need.

---

*This document is for planning reference only. No implementation has been started.*
