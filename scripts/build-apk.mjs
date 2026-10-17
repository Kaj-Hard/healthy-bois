// Builds the web bundle, syncs it into the Android project and assembles an APK.
// Output: release/healthy-bois-<version>.apk (to share) + release/healthy-bois.apk (for serve:apk)
//
// Toolchain lookup (override with env vars):
//   ANDROID_HOME / ANDROID_SDK_ROOT  -> defaults to %LOCALAPPDATA%\Android\Sdk
//   JAVA_HOME (JDK 21+)              -> defaults to the newest %LOCALAPPDATA%\Android\jdk-21* folder
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const isWin = process.platform === 'win32';
const localAppData = process.env.LOCALAPPDATA ?? '';

const sdk =
  process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT ?? join(localAppData, 'Android', 'Sdk');
if (!existsSync(sdk)) throw new Error(`Android SDK not found at ${sdk}. Set ANDROID_HOME.`);

let javaHome = process.env.JAVA_HOME;
const bundledJdkDir = join(localAppData, 'Android');
if (existsSync(bundledJdkDir)) {
  const jdk = readdirSync(bundledJdkDir).filter((d) => d.startsWith('jdk-21')).sort().at(-1);
  if (jdk) javaHome = join(bundledJdkDir, jdk);
}
if (!javaHome) throw new Error('JDK 21 not found. Set JAVA_HOME.');

const env = { ...process.env, JAVA_HOME: javaHome, ANDROID_HOME: sdk, ANDROID_SDK_ROOT: sdk };
const run = (cmd, cwd = root) => execSync(cmd, { cwd, env, stdio: 'inherit' });

writeFileSync(join(root, 'android', 'local.properties'), `sdk.dir=${sdk.replace(/\\/g, '\\\\')}\n`);

run('npm run build');
run('npx cap sync android');
// Debug-signed with the machine's debug keystore: fine for sideloading, and updates install over the old app.
const androidDir = join(root, 'android');
run(`"${join(androidDir, isWin ? 'gradlew.bat' : 'gradlew')}" assembleDebug --console=plain`, androidDir);

const apk = join(root, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
mkdirSync(join(root, 'release'), { recursive: true });
copyFileSync(apk, join(root, 'release', 'healthy-bois.apk'));
// A versioned copy for sharing (Drive etc.), named like the app shows it: 0.3.0-a → 0.3.0a.
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version.replace(/-([a-z])$/, '$1');
const named = `healthy-bois-${version}.apk`;
copyFileSync(apk, join(root, 'release', named));
console.log(`\n✅ APK ready: release/${named} (and release/healthy-bois.apk)`);
