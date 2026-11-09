# Third-party licenses and dependencies

## Application runtime and build

FORMA has **no third-party runtime or npm build dependencies**. The delivered application uses browser-standard APIs and native ECMAScript modules. There is no package lockfile because no package installation is needed.

| Dependency | Version | License | Repository | Purpose | Internet required at runtime | User data transmitted |
|---|---|---|---|---|---|---|
| None | — | — | — | No bundled third-party runtime packages | No | No |

## Optional GitHub Pages workflow

The included `.github/workflows/pages.yml` uses the following GitHub-maintained Actions only when the repository is deployed through GitHub Actions. They are not downloaded by or bundled into the application, and do not execute in the user's browser. Their upstream repositories publish the actions under the MIT License.

| Action | Reference used | License | Official repository | Purpose |
|---|---|---|---|---|
| actions/checkout | `v4` | MIT | https://github.com/actions/checkout | Checks out the repository on the CI runner |
| actions/setup-node | `v4` | MIT | https://github.com/actions/setup-node | Selects Node.js on the CI runner |
| actions/upload-pages-artifact | `v3` | MIT | https://github.com/actions/upload-pages-artifact | Packages the static output for Pages |
| actions/deploy-pages | `v4` | MIT | https://github.com/actions/deploy-pages | Publishes the Pages artifact |

The workflow uses GitHub's built-in workflow token and requires no user-supplied API key or secret. GitHub Pages itself is an optional hosting provider, not a runtime dependency. For non-GitHub static hosting, deploy the contents of `dist/` directly.

## Platform APIs

IndexedDB, localStorage, Service Workers, Web App Manifest, Pointer Events, MediaDevices/getUserMedia, Notification, Vibration and Web Audio are browser APIs, not bundled libraries. Availability varies by browser and device.

The project does not currently include MediaPipe Tasks Vision, Chart.js, Lucide or an external icon/font library. Icons are inline SVG paths maintained in this repository. Typeface selection uses system font stacks.
