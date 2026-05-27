/**
 * Shared emulator + CI defaults for integration tests run via firebase emulators:exec.
 */
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

export function syncTimeoutMs(defaultMs: number, ciMs: number): number {
  return process.env.CI ? ciMs : defaultMs;
}
