# FORMA interface themes

FORMA is a browser-native PWA. Its interface families are web implementations inspired by the official platform design systems; they are not native SwiftUI or Jetpack Compose views.

## Automatic defaults

- Apple browsers and Apple touch devices: **Liquid Glass**.
- Android browsers: **Material 3 Expressive**.
- Other browsers: **Material 3 Expressive** as the neutral fallback.
- **Automatic** remains the default preference. A saved manual choice always overrides platform detection.

Detection checks the user agent, legacy platform identifier, modern User-Agent Client Hints when available, and touch points. The touch-point check covers iPadOS Safari's desktop-style Macintosh user agent.

## Official implementation references

### Apple — Liquid Glass

- [Liquid Glass overview and adoption guidance](https://developer.apple.com/documentation/technologyoverviews/liquid-glass)
- [Apple's Landmarks SwiftUI sample: Building an app with Liquid Glass](https://developer.apple.com/documentation/swiftui/landmarks-building-an-app-with-liquid-glass)

Apple's sample uses SwiftUI and native platform materials. A standard web PWA cannot call SwiftUI's `glassEffect` APIs. FORMA therefore translates the relevant visual principles into CSS: layered translucent materials, saturation, backdrop blur, specular highlights, rounded controls, and reduced-transparency fallbacks.

### Google — Material 3 Expressive

- [Material 3 in Jetpack Compose](https://developer.android.com/develop/ui/compose/designsystems/material3)
- [Official AndroidX Compose Material 3 source](https://android.googlesource.com/platform/frameworks/support/+/androidx-main/compose/material3/material3/)
- [Material Components Android: motion system](https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md)
- [Material Color Utilities source and dynamic-color model](https://github.com/material-foundation/material-color-utilities)

Jetpack Compose's Material 3 implementation is native Android code, not browser components. FORMA adapts its color-role approach, expressive shape hierarchy, pill controls, tonal surfaces and emphasized motion into CSS.

## Important PWA limitation

A website cannot access Android's private wallpaper-derived system palette through the standard browser APIs, and cannot render Apple's native Liquid Glass material or native controls exactly. FORMA currently uses its own brand-seeded colors and web-supported blur/transparency effects. The two themes are intentionally close visual adaptations, not pixel-identical native system UIs. A truly native match would require separate SwiftUI and Jetpack Compose applications.
