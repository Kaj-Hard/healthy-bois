// Builds the APK and publishes it as a GitHub release.
// Usage: npm run release
//
// - Version comes from package.json (0.3.0-a → shown and tagged as 0.3.0a / v0.3.0a).
// - Release notes come from the matching "## 0.3.0a" section in CHANGELOG.md.
// - Two assets are uploaded: healthy-bois-<version>.apk and healthy-bois.apk. The second one has a fixed
//   name, so https://github.com/<repo>/releases/latest/download/healthy-bois.apk always serves the newest build.
// - Signed with this PC's debug key (see build-apk.mjs), so it installs over earlier builds and keeps data.
import { execFileSync, execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const sh = (cmd) => execSync(cmd, { cwd: root, encoding: 'utf8' }).trim();

const winGh = 'C:\\Program Files\\GitHub CLI\\gh.exe';
const gh = process.platform === 'win32' && existsSync(winGh) ? winGh : 'gh';
const ghRun = (args, opts = {}) => execFileSync(gh, args, { cwd: root, encoding: 'utf8', ...opts });

const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version.replace(/-([a-z])$/, '$1');
const tag = `v${version}`;

// Release notes for this version from CHANGELOG.md.
const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
const section = changelog.split(/^## /m).find((s) => s.startsWith(`${version}`));
if (!section) throw new Error(`CHANGELOG.md has no "## ${version}" section. Write the release notes first.`);
const notes = section.split('\n').slice(1).join('\n').trim();

// Only release what's committed and pushed, so the tag points at the code that was built.
if (sh('git status --porcelain')) throw new Error('Uncommitted changes. Commit them before releasing.');
sh('git fetch origin');
if (sh('git rev-parse HEAD') !== sh('git rev-parse @{u}')) throw new Error('main is not pushed. Run `git push` first.');
try {
  ghRun(['release', 'view', tag], { stdio: 'pipe' });
  throw new Error(`Release ${tag} already exists. Bump the version (see CLAUDE.md → Versions).`);
} catch (e) {
  if (String(e.message).includes('already exists')) throw e;
}

execSync('node scripts/build-apk.mjs', { cwd: root, stdio: 'inherit' });

const notesFile = join(root, 'release', 'notes.md');
const repo = ghRun(['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner']).trim();
writeFileSync(
  notesFile,
  `${notes}\n\n---\n\n**Install on Android:** download \`healthy-bois.apk\` below, open it and allow "Install unknown apps" when asked.\n` +
    `Already have Healthy Bois? Install right over it: your players, games and photos are kept.\n\n` +
    `Always-latest link: https://github.com/${repo}/releases/latest/download/healthy-bois.apk\n`,
);

ghRun(
  [
    'release', 'create', tag,
    join(root, 'release', `healthy-bois-${version}.apk`),
    join(root, 'release', 'healthy-bois.apk'),
    '--target', sh('git rev-parse HEAD'),
    '--title', `Healthy Bois ${version}`,
    '--notes-file', notesFile,
  ],
  { stdio: 'inherit' },
);
sh('git fetch --tags origin');

console.log(`\n✅ Released ${tag}`);
console.log(`   Page:   https://github.com/${repo}/releases/tag/${tag}`);
console.log(`   Latest: https://github.com/${repo}/releases/latest/download/healthy-bois.apk`);
