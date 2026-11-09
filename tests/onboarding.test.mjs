import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defaultState } from '../src/data.js';

const root=resolve(new URL('..',import.meta.url).pathname);

test('a brand-new install starts with a private, opt-in onboarding state', () => {
  const state=defaultState();
  assert.equal(state.onboardingComplete,false);
  assert.equal(state.preferences.notifications,false);
  assert.deepEqual(state.profile.equipment,['bodyweight','dumbbells']);
  assert.equal(state.profile.name,'');
});

test('the first-run wizard configures profile, equipment, language and optional reminders', async () => {
  const main=await readFile(resolve(root,'src/main.js'),'utf8');
  assert.match(main,/function onboardingPage\(\)/);
  assert.match(main,/data-form="onboarding"/);
  assert.match(main,/data-onboarding-step="0"/);
  assert.match(main,/data-onboarding-step="1"/);
  assert.match(main,/data-onboarding-step="2"/);
  assert.match(main,/onboardingNotificationsRequested \? await requestNotificationPermission\(\) : false/);
  assert.match(main,/data-action="open-onboarding"/);
});

test('existing saved installs skip onboarding and first-run motion respects reduced motion', async () => {
  const main=await readFile(resolve(root,'src/main.js'),'utf8');
  const css=await readFile(resolve(root,'src/styles.css'),'utf8');
  assert.match(main,/if\(firstRun\) state\.onboardingComplete=false/);
  assert.match(main,/const hasOnboardingFlag=Boolean\(savedState\) && typeof savedState\.onboardingComplete === 'boolean'/);
  assert.match(main,/else if\(!hasOnboardingFlag\) state\.onboardingComplete=true/);
  assert.match(css,/@keyframes onboarding-orbit/);
  assert.match(main,/Encuentra tu/);
  assert.match(main,/onboarding-float-card/);
  assert.match(main,/onboarding-title-accent/);
  assert.match(css,/@keyframes onboarding-mark-arrive/);
  assert.match(css,/onboarding-button-sheen/);
  assert.match(css,/grid-template-areas:"art copy"/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/data-motion="off"/);
});


test('onboarding lets users keep automatic style or explicitly choose either design family', async () => {
  const main=await readFile(resolve(root,'src/main.js'),'utf8');
  assert.match(main,/name="interfaceStyle"/);
  assert.match(main,/value="liquid-glass"/);
  assert.match(main,/value="material-expressive"/);
  assert.match(main,/Automatic · recommended/);
  assert.match(main,/Automático · recomendado/);
  assert.match(main,/interfaceStyle:\['auto','liquid-glass','material-expressive'\]/);
  assert.match(main,/cameraDisclaimer:'El vídeo y los puntos corporales se analizan en este dispositivo/);
  assert.match(main,/Video and body landmarks are analysed on this device/);
  for (const theme of ['oled','ocean','forest','sunset','lavender']) assert.match(main,new RegExp(theme));
  assert.match(main,/data-palette=palette/);
  assert.match(main,/Vista previa local · sin grabación/);
});
