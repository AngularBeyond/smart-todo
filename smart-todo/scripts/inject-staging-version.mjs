import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getShortCommitSha() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  }
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'staging';
  }
}

const commitSha = getShortCommitSha();
const versionContent = `export const APP_VERSION = 'commit ${commitSha}';\n`;
const targetPath = path.resolve(__dirname, '../src/environments/version.ts');

fs.writeFileSync(targetPath, versionContent, 'utf8');
console.log(`[inject-staging-version] Injected APP_VERSION: commit ${commitSha}`);
