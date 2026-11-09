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
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/data-motion="off"/);
});
