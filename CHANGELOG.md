# Changelog

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
