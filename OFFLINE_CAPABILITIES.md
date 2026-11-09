# Offline capabilities

After the initial successful load and service-worker installation, the application shell and core static assets are cached for offline use.

| Feature | Offline status | Notes |
|---|---|---|
| Navigation and themes | Works | Cached application shell |
| Exercise library | Works | Catalogue is bundled locally |
| Workout builder | Works | Uses local browser storage |
| Live workout and timers | Works while page is active | Timer uses timestamps; background throttling varies by browser |
| Progress and calendar | Works | Stored data remains local to the browser profile |
| Import/export | Works | Uses browser file APIs |
| Camera preview | Device-dependent | Requires camera permission and a secure context; no internet request is made by the app |
| Pose estimation / automatic rep counting | Not included | No model download or remote inference |
| Scheduled workout reminders | Best-effort while FORMA is running or suspended in a browser tab | Uses the local Notification API and page timers; delivery can be throttled or missed when the browser suspends the page. Not guaranteed after FORMA/browser is fully closed; no push service or background scheduling backend exists. Works offline after permission is granted and assets are cached. |
| Account/cloud synchronization | Not included | No account or backend exists |

A first visit requires a network connection to load the static site. Once cached, core app files should load without connectivity. The browser may evict cached assets or local storage under storage pressure; export a backup periodically.
