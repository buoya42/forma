const APPLE_AGENT = /iphone|ipad|ipod|macintosh|mac os|macintel|visionos|apple vision/i;
const ANDROID_AGENT = /android/i;

/**
 * Classify the browser host without relying on a single user-agent field.
 * iPadOS may present a desktop Macintosh UA, so platform and touch points
 * are considered as well. Explicit Android identification takes precedence.
 */
export function detectPlatform({
  userAgent = '',
  platform = '',
  maxTouchPoints = 0,
  userAgentDataPlatform = ''
} = {}) {
  const ua = String(userAgent).toLowerCase();
  const legacyPlatform = String(platform).toLowerCase();
  const modernPlatform = String(userAgentDataPlatform).toLowerCase();

  if (ANDROID_AGENT.test(ua) || modernPlatform === 'android') return 'android';

  const appleAgent = APPLE_AGENT.test(ua);
  const applePlatform = /iphone|ipad|ipod|mac|darwin|vision/i.test(legacyPlatform)
    || /macos|ios|ipados|visionos/i.test(modernPlatform);
  const ipadDesktopMode = legacyPlatform === 'macintel' && Number(maxTouchPoints) > 1;

  if (appleAgent || applePlatform || ipadDesktopMode) return 'apple';
  return 'other';
}

/**
 * Resolve the selected design family. A saved manual choice always wins;
 * automatic mode recommends Liquid Glass for Apple and Material 3 otherwise.
 */
export function resolveInterfaceStyle(preference = 'auto', platform = 'other') {
  if (preference === 'liquid-glass' || preference === 'material-expressive') return preference;
  return platform === 'apple' ? 'liquid-glass' : 'material-expressive';
}
