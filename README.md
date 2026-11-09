# FORMA — Fitness Companion

FORMA is a local-first fitness web application designed for phones, tablets and desktop browsers. It can be installed as an Android PWA and deployed to static hosting such as GitHub Pages. It does not require registration, API keys, a backend or paid services.

## Features implemented

- First-run welcome and guided setup for training profile, available equipment, units, language, appearance, animations and optional reminders. Existing installations keep their local data and skip the introduction.
- Spanish and English interface labels; dark, light and system themes.
- Responsive navigation and swipe gestures with visible button alternatives.
- Exercise library with search, category/equipment/difficulty filters, favorites, custom exercises, edit, hide and restore.
- Curated workout presets, including **Método Fluffo** in honour of the person behind the original idea, plus bodyweight, dumbbell, lower-body, core and mobility templates. Presets open in the editor and are only saved when the user chooses.
- Workout templates with reordering, repetitions/time targets, configurable rest, optional load, notes, circuit rounds and guided warm-up/cool-down phases.
- Active sessions with pause/resume, elapsed-time recovery, explicit set completion, optional actual-rep logging, undo, previous/next movement, circuit auto-advance and session summaries. Completed sets can feed per-exercise best-rep/load records.
- Rest/custom countdown timer, with optional sound and vibration where supported.
- Progress and session history derived from locally completed sessions only.
- Monthly calendar for planned sessions, rest days, rescheduling and completed-session history.
- Optional local notifications for scheduled workouts with an explicit time, browser permission, duplicate protection and a test-notification action.
- Animated page transitions for swipe and button navigation, live-workout exercise changes, tactile control feedback and a reduced-motion setting.
- IndexedDB persistence with a localStorage fallback, JSON export/import and local-data deletion.
- PWA manifest, app icons and versioned service-worker asset caching.
- Optional camera-based pose tracking with MediaPipe Pose Landmarker Lite: a live 33-point skeleton overlay and estimated rep counting for squats, lunges, push-ups, wall push-ups, dumbbell bench press, curls, rows, shoulder press, lateral raises and triceps extensions. Analysis starts only after camera permission and separate technical-metrics consent; video and body landmarks are processed on-device and are not recorded or uploaded. Estimated reps are added to a set only when the user confirms.

## Circuit, warm-up and training records

Circuit templates can be configured for 1–20 rounds. During a live circuit, FORMA advances automatically after the configured sets for each movement and starts the next round after the final exercise. A manual undo returns to the movement and round where the set was recorded. Optional warm-up and cool-down choices now open guided phases before/after the workout; both can be skipped.

Actual repetitions can be entered optionally when completing a set or recorded from the camera counter. The progress summary displays total logged reps, estimated camera reps, load × reps for sets with an entered load, and the best logged reps/load by movement. These records are based on the stored set log; older sessions without per-set rep data are not retroactively estimated.

## Camera pose assistance

Open **Settings → Privacy → Camera assistance**, or choose **Cámara y repeticiones** during a supported live exercise. Grant camera permission, select the movement, review the technical-metrics notice and opt in before starting MediaPipe. The Lite model estimates landmarks locally, draws a skeleton overlay and counts full movement cycles. During a matching live exercise, manually confirm the estimated count to record it with that set; reps are never silently added to workout history.

For tracking, keep the phone steady, use good lighting and position it according to the in-app camera-angle hint. Results are estimates, not a form or safety verdict. Pose inference runs in a dedicated Web Worker so synchronous model calls do not block the main UI thread. The first analysis activation downloads the pinned MediaPipe SDK/WASM files and Lite model and therefore requires internet access. The service worker caches successful downloads for later offline use, unless the browser evicts them. MediaPipe may send aggregate technical usage/performance metrics to Google after separate explicit consent; camera frames and body landmarks are not sent.

## Local development

Requires Node.js 20 or newer. There are no npm runtime or development dependencies.

```bash
npm run dev
```

Open the URL printed by the server (normally `http://localhost:4173`).

```bash
npm test       # Node built-in unit tests
npm run check  # JavaScript syntax checks
npm run build  # create dist/
npm run preview
```

For offline/PWA testing, use localhost or HTTPS. Service workers are not available on ordinary `file://` URLs.

## GitHub Pages

1. Push the repository to GitHub.
2. In **Settings → Pages**, choose GitHub Actions as the source.
3. Add the workflow in `.github/workflows/pages.yml` (included).
4. The app uses relative asset paths and a relative manifest/service-worker scope, so repository subpaths are supported.

The workflow builds the static files and publishes `dist/`. No secrets are required. Browser reminders are local best-effort timers: they can be delayed by background throttling and are not guaranteed after the app/browser is fully closed.

## Replit

Import the repository, open the Shell and run `npm run dev`. The project is static and does not require a persistent Replit backend. For a deployable static artifact, run `npm run build` and publish `dist/` using a static deployment target.

## Architecture

- `src/main.js` — application state, views and interaction orchestration.
- `src/data.js` — exercise catalogue, six editable workout presets and initial settings.
- `src/engine.js` — session timing, progression and history primitives.
- `src/storage.js` — IndexedDB/localStorage and import validation.
- `src/gestures.js` — Pointer Events gesture recognition and swipe feedback.
- `src/pose.js` — pose landmark angle analysis and movement-specific repetition state machines.
- `src/pose-runtime.js` — lazy loading of the pinned MediaPipe browser runtime and Lite model.
- `src/reminders.js` — local reminder time validation and due/upcoming reminder selection.
- `src/styles.css` — responsive design system and themes.
- `sw.js` — offline shell and asset caching.

The implementation intentionally uses browser-native JavaScript modules instead of a React/Vite dependency chain. This keeps the delivered project dependency-free and directly compatible with static hosts. The feature modules remain separated and can be migrated to TypeScript/React later if a larger team needs that structure.

## Safety note

Exercise information is educational and general. It is not medical advice, diagnosis or a substitute for a qualified coach. Choose comfortable ranges and loads, and stop if you experience pain, dizziness or unusual discomfort. FORMA does not promise body-shape or weight outcomes.

## Known limitations

- Camera rep thresholds are heuristic estimates, not validated biomechanical measurements or professional form coaching. Automatic counting supports only the movements listed above; other exercises remain manual. Results vary with camera angle, occlusion, lighting, speed and individual technique.
- Notifications are permission-gated but there is no reliable closed-app scheduled reminder mechanism. Background timer behavior depends on the browser and device.
- Gesture handling covers horizontal navigation and workout navigation/instructions; not every platform-specific edge gesture or fully physics-based sheet motion is implemented.
- Circuit/custom workout structures are stored as template metadata; the current live runner executes the ordered exercise list, not multi-round circuit automation.
- Session records capture explicitly completed sets and configured targets/loads; per-repetition sensor-based tracking and automatic personal-record detection are not implemented.
- English translation currently covers primary navigation, controls and core settings; parts of the exercise catalogue, safety copy and calendar labels remain Spanish.
- The current progress view summarizes sessions, elapsed time and completed sets; per-repetition sensor-based tracking and automatic personal-record detection are not implemented.
- Cross-browser testing must be completed on physical Android Chrome, iOS Safari and Firefox devices before broad production rollout.
