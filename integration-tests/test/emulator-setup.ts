/**
 * Shared emulator + CI defaults for integration tests run via firebase emulators:exec.
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

const extensionsDir = path.join(__dirname, '..', 'extensions');
for (const file of ['auth-chat.env.local', 'auth-chat.secret.local']) {
  dotenv.config({ path: path.join(extensionsDir, file) });
}

const projectId = process.env.GCLOUD_PROJECT || 'demo-stream';

process.env.GCLOUD_PROJECT = projectId;
process.env.FIREBASE_AUTH_EMULATOR_HOST =
  process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST =
  process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';

// GitHub Actions runners are slower than local machines.
if (process.env.CI) {
  jest.setTimeout(90_000);
}

export const emulatorProjectId = projectId;

/** Must match LOCATION in extensions/*.env.local (CI: ENV_LOCAL secret). */
export const functionsRegion =
  process.env.LOCATION?.trim() || 'us-central1';

export function syncTimeoutMs(defaultMs: number, ciMs: number): number {
  return process.env.CI ? ciMs : defaultMs;
}
