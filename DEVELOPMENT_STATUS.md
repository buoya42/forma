# FORMA development status

## Delivered in v1.7.1

- Moved synchronous pose inference out of the UI thread into a dedicated module Web Worker, transferring camera frames as ImageBitmap and returning only landmark data for drawing/counting.
- Added worker syntax validation and service-worker precaching; MediaPipe WASM/model assets remain cacheable for offline use after first download.

## Delivered in v1.7.0

- Added circuit templates with 1–20 rounds, automatic exercise/round advancement after configured sets and cursor-aware undo.
- Converted warm-up and cool-down checkboxes from passive reminders into guided, skippable session phases.
- Added optional actual reps per set, with source attribution for manual entries versus camera estimates.
- Added progress metrics for recorded reps, load × reps and per-exercise best reps/load based on real set logs.
- Extended backup validation for circuit rounds and set-level rep sources; added circuit flow and backup round-trip tests.

## Delivered in v1.6.0

- Integrated MediaPipe Pose Landmarker Lite for on-device video pose estimation, a live skeleton overlay and joint-angle readouts.
- Added movement-specific repetition estimates for squats, lunges, push-ups, wall push-ups, dumbbell bench press, curls, rows, shoulder press, lateral raises and triceps extensions.
- Added explicit technical-metrics consent before MediaPipe analysis; camera preview remains available without analysis consent. Video frames and body landmarks are not uploaded or recorded.
- Added camera access from compatible live-workout movements, manual confirmation before logging estimated reps, set-level rep history and undo support.
- Added service-worker caching for the pinned MediaPipe SDK/WASM assets and Lite model after first successful download, plus pose-angle, visibility, rep-cycle and set-log unit tests.

## Delivered in v1.2.0

- Renamed the featured preset to **Método Fluffo** and migrated exact legacy names in saved workouts, session history and scheduled labels.
- Added directional page transitions for section navigation and swipe navigation, gesture tracking feedback, and directional transitions when changing exercises in a live workout.
- Added tactile hover/press/focus feedback, animation preferences, and reduced-motion support.
- Added calendar-event reminder opt-in when a workout is assigned a time, notification permission request, local service-worker notifications, test notification and duplicate/missed-reminder handling.
- Added local reminder scheduling module with unit tests and service-worker notification click handling.
- Documented best-effort reminder timing and the lack of guaranteed closed-app notifications without push infrastructure.

## Delivered in v1.1.0

- Six built-in editable workout presets available in the Workouts section, including **Método Fluffo**.
- Presets open in the existing workout builder; they are only saved after user confirmation.
- Existing local data is not overwritten by the preset catalogue.

## Delivered in v1.0.0

- Responsive static application and theme system.
- Exercise library and custom exercise management.
- Local workout templates and live workout runner.
- Explicit set tracking, undo, elapsed timer, rest/custom timer and summaries.
- Progress history and training calendar.
- Local storage, JSON export/import and data deletion.
- Pointer Events gesture support and visible action alternatives.
- Camera permission flow with local preview only.
- PWA manifest, icons, versioned service worker and GitHub Pages workflow.
- Privacy, offline, dependency, contribution and deployment documentation.

## Known incomplete items

- Camera rep thresholds are heuristic estimates and have not yet been validated across a representative range of physical devices, camera angles, body types and movement speeds. Camera guidance is not a full form or safety assessment.
- Reliable scheduled notifications while FORMA is fully closed (would require a push service/backend).
- Full exercise-by-exercise English translation and richer long-term training analytics remain incomplete.
- Full English translation of all exercise and safety content.
- Physical-device QA on Android Chrome, iOS Safari and Firefox.

## Verification in this delivery environment

- `npm run check`: passed.
- `npm test`: 20 tests passed, including Método Fluffo name migration, reminder scheduling rules, reminder import persistence and reduced-motion transition checks.
- `npm run build`: passed.
- Static server HTTP checks: passed for `/`, manifest, service worker, application modules and stylesheet.
- Chromium browser automation: attempted but blocked by the container browser policy (`ERR_BLOCKED_BY_ADMINISTRATOR`) for local navigation. This is an environment limitation, not a passing browser test.

## Commands

- `npm run dev` — local static server.
- `npm test` — Node.js built-in tests.
- `npm run check` — source syntax checks.
- `npm run build` — production `dist/` output.
- `npm run preview` — preview production output.
