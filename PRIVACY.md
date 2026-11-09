# FORMA Privacy

FORMA is designed for local data ownership.

## What is stored

Workout templates, exercise preferences, custom exercises, scheduled sessions, completed session summaries and application preferences are stored in the current browser's IndexedDB database (`forma-local`). If IndexedDB is unavailable, FORMA attempts a localStorage fallback.

## What is not collected

The application has no account system, analytics SDK, advertising tracker, cloud database or third-party behavioral profiling. It does not send workout records to a server.

## Camera

The camera is off by default. It starts only after the user presses the camera action and grants browser permission. Pose analysis is a separate opt-in. MediaPipe Pose Landmarker Lite processes camera frames and estimates body landmarks on-device; video frames and landmarks are not recorded, stored, uploaded or transmitted to FORMA or Google. Closing the camera panel or navigating away stops the media tracks and releases the model.

Before starting pose analysis, FORMA asks the user to consent to MediaPipe's aggregate technical usage/performance metrics being sent to Google. This is separate from camera input: the metrics do not contain video frames or body landmark coordinates. The camera preview remains available without enabling pose analysis or accepting the metrics notice.

## Export, import and deletion

Use Settings → Your data to export a JSON copy, import a compatible copy or clear local application data. Import replaces the current local state after confirmation. Clearing browser site data can remove FORMA information. Browser storage is not an automatic backup.

## External network activity

The application loads its own static assets and, when hosted over HTTPS or localhost, registers its service worker. When the user explicitly starts pose analysis, the app downloads the pinned MediaPipe Tasks Vision browser runtime/WASM files from jsDelivr and the Pose Landmarker Lite model from Google Cloud Storage. Successful responses are cached by the service worker. MediaPipe processes input video on-device and does not send that input to its servers; its SDK may send aggregate technical usage/performance metrics to Google after the separate explicit consent. FORMA has no account system, cloud database, advertising tracker or independent analytics SDK.

## Permissions and reminders

Camera permission is optional. Notification permission is requested only after the user enables notifications in Settings. Planned workout dates, times, reminder flags and delivery markers remain in local browser storage. The notification itself may display the workout title. Notifications are displayed locally using the browser Notification API and the app service worker; no reminder data or notification payload is sent to a FORMA server. Sound and vibration are optional and depend on browser/device support.

Local reminders are best-effort. Browser throttling, device power management or fully closing the app/browser can prevent or delay delivery. Reliable closed-app delivery would require a push service/backend, which FORMA does not currently use.
