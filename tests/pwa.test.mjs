import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

const root=resolve(new URL('..',import.meta.url).pathname);

test('PWA manifest declares relative install scope and app icons', async () => {
  const manifest=JSON.parse(await readFile(resolve(root,'manifest.webmanifest'),'utf8'));
  assert.equal(manifest.start_url,'./');
  assert.equal(manifest.scope,'./');
  for(const icon of manifest.icons) await access(resolve(root,icon.src.replace(/^\.\//,'')));
});

test('offline shell references local project assets only', async () => {
  const html=await readFile(resolve(root,'index.html'),'utf8');
  const css=await readFile(resolve(root,'src/styles.css'),'utf8');
  const sw=await readFile(resolve(root,'sw.js'),'utf8');
  assert.match(html,/\.\/src\/main\.js/);
  assert.doesNotMatch(css,/@import\s+url\(['"]https?:/i);
  assert.match(sw,/src\/main\.js/);
  assert.match(sw,/src\/storage\.js/);
  assert.match(sw,/src\/reminders\.js/);
  assert.match(sw,/src\/migrations\.js/);
  assert.match(sw,/notificationclick/);
});


test('motion stylesheet includes directional transitions and reduced-motion support', async () => {
  const css=await readFile(resolve(root,'src/styles.css'),'utf8');
  assert.match(css,/page-enter-forward/);
  assert.match(css,/page-enter-backward/);
  assert.match(css,/prefers-reduced-motion\s*:\s*reduce/);
  assert.match(css,/page-transition\.enter-forward[^}]*animation:none!important/);
  assert.match(css,/data-motion=\"off\"/);
});
