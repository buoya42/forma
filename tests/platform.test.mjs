import test from 'node:test';
import assert from 'node:assert/strict';
import { detectPlatform, resolveInterfaceStyle } from '../src/platform.js';

test('detects iPhone and iPadOS Safari, including desktop-style iPad user agents', () => {
  assert.equal(detectPlatform({
    userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15'
  }),'apple');
  assert.equal(detectPlatform({
    userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15',
    platform:'MacIntel',
    maxTouchPoints:5
  }),'apple');
});

test('detects Android before generic platform fallbacks', () => {
  assert.equal(detectPlatform({
    userAgent:'Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36',
    userAgentDataPlatform:'Android'
  }),'android');
});

test('automatic interface style follows platform and manual choice always wins', () => {
  assert.equal(resolveInterfaceStyle('auto','apple'),'liquid-glass');
  assert.equal(resolveInterfaceStyle('auto','android'),'material-expressive');
  assert.equal(resolveInterfaceStyle('auto','other'),'material-expressive');
  assert.equal(resolveInterfaceStyle('material-expressive','apple'),'material-expressive');
  assert.equal(resolveInterfaceStyle('liquid-glass','android'),'liquid-glass');
});
