# Changelog

## 1.4.1 — 2026-11-09
- Improved Apple/iPadOS detection, including iPad Safari's desktop-style user agent, and made platform selection a tested module.
- Added the automatic/manual interface-style selector to first-run setup as well as Settings; users can switch between Liquid Glass and Material 3 Expressive at any time.
- Refined the Liquid Glass web treatment with layered translucency, saturation, backdrop blur, highlights and reduced-transparency fallbacks.
- Expanded the Material 3 Expressive web treatment with tonal color roles, expressive shapes, pill controls and emphasized interaction feedback.
- Preserved manual interface-style choices in imported backups and refreshed the PWA cache.
- Documented official Apple and Google implementation references and the limits of reproducing native system materials inside a web PWA.

## 1.4.0 — 2026-11-09
- Added platform-aware interface styling: Liquid Glass is the automatic default on Apple touch devices; Material 3 Expressive is the automatic default on Android and other platforms.
- Added a persistent manual interface-style selector so every user can switch between Liquid Glass and Material 3 Expressive at any time, independently of light/dark mode.
- Implemented web-native CSS adaptations inspired by Apple Human Interface Guidelines and Android Open Source Project guidance, with reduced-transparency and blur fallbacks.


## 1.3.1 — 2026-11-09
- Refined the welcome screen into a signature FORMA opening: editorial two-column hero, animated brand mark, atmospheric grid and glow, orbit rings, floating identity cards, staggered text reveal and subtle CTA light sweep.
- Improved mobile composition while retaining reduced-motion and animation-off support.

## 1.3.0 — 2026-11-09
- Added an animated first-run welcome and guided setup for profile, experience, preferred session length, units, equipment, language, theme and motion preferences.
- Existing installations with saved data skip onboarding automatically; users can reopen setup from Settings without losing workouts or history.
- Added an explicit optional reminder opt-in. Browser notification permission is requested only after the user chooses reminders and finishes setup; camera access remains separate and opt-in.
- Respects the system reduced-motion preference throughout the opening experience.

## 1.2.1 — 2026-11-09
- Replaced heart symbols with bookmark icons across exercise-library favorite controls and updated the Spanish and English helper text.
- Added the English preset display name **Fluffo Method**, while preserving **Método Fluffo** in Spanish and keeping the original eight exercises and editable, unset targets.
- Updated the package and service-worker cache version to 1.2.1.

## 1.2.0 — 2026-11-08
- Renamed the featured preset **Felix method** to **Método Fluffo** and added a one-time migration for previously saved templates, sessions and calendar labels with the old exact name.
- Added animated forward/backward transitions for navigation, swipe feedback, live-workout exercise transitions, tactile control feedback and an in-app animation toggle that respects the operating-system reduced-motion preference.
- Added optional scheduled workout reminders when a calendar item has a date and time, including browser permission handling, local notification display, duplicate protection, missed-reminder expiry, notification click-to-open and a test notification.
- Documented reminder limitations: delivery is best-effort while the app/page is running or suspended; fully closed-app delivery is not guaranteed without a push service/backend.
- Added unit tests for reminder date validation, due/upcoming/expired selection and import persistence.
- Bumped the PWA cache and package version to 1.2.0.

## 1.1.0 — 2026-11-08
- Added six editable workout presets, including **Felix method**, named in honour of the person who inspired the original exercise idea.
- Added bodyweight full-body, dumbbell upper-body, legs and glutes, core stability, and mobility presets.
- Presets are shown separately from saved templates; choosing one opens the builder and does not save or start a workout until the user confirms.
- Kept all sets, repetitions and durations unset in presets; users configure their own targets. Felix method explicitly avoids a mandatory 3–5 minute plank target.
- Preserved existing local workouts and history; bumped the service-worker cache to v1.1.0.

## 1.0.1 — 2026-11-08
- Replaced the FORMA lettermark with a dumbbell brand mark in the app shell and loading states.
- Updated SVG, PNG and PWA app icons to the dumbbell design.
- Bumped the service-worker cache version so installed apps can fetch the new assets.

## 1.0.0 — 2026-11-08

- Initial local-first FORMA implementation.
- Exercise library, workout templates, live sessions, timers, progress, calendar and settings.
- IndexedDB/localStorage persistence, JSON import/export and PWA caching.
- Documented limitations for pose estimation, background reminders and automated circuit execution.
