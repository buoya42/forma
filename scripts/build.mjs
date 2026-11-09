import { cp, mkdir, rm, copyFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const out = resolve(root, 'dist');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const file of ['index.html','manifest.webmanifest','sw.js','README.md','PRIVACY.md','OFFLINE_CAPABILITIES.md','THIRD_PARTY_LICENSES.md','CONTRIBUTING.md','CHANGELOG.md','DEVELOPMENT_STATUS.md','LICENSE']) {
  try { await copyFile(resolve(root,file),resolve(out,file)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
for (const dir of ['src','public','docs']) {
  try { await stat(resolve(root,dir)); await cp(resolve(root,dir),resolve(out,dir),{recursive:true}); } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
console.log(`FORMA production files created at ${out}`);
console.log('This is a static build; deploy the dist/ directory as-is.');
