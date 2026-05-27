#!/usr/bin/env node
/**
 * Prepare extension env files for emulator runs.
 *
 * - STREAM_API_KEY is type "secret" in extension.yaml → must live in *.secret.local
 * - Functions emulator reads ../<ext>/functions/.env.local (+ merges secrets for process.env)
 */
const fs = require('fs');
const path = require('path');

const integrationRoot = path.join(__dirname, '..');
const extensionsDir = path.join(integrationRoot, 'extensions');

const extensionNames = [
  'auth-chat',
  'auth-activity-feeds',
  'firestore-activity-feeds',
];

const secretParamNames = new Set(['STREAM_API_KEY', 'STREAM_API_SECRET']);

function parseEnvLines(content) {
  const entries = new Map();
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }
    entries.set(trimmed.slice(0, eq).trim(), trimmed.slice(eq + 1));
  }
  return entries;
}

function serializeEnvLines(entries) {
  return [...entries.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
    .concat('\n');
}

function readFileIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

function normalizeExtensionFiles(extensionName) {
  const envPath = path.join(extensionsDir, `${extensionName}.env.local`);
  const secretPath = path.join(extensionsDir, `${extensionName}.secret.local`);

  const envEntries = parseEnvLines(readFileIfExists(envPath));
  const secretEntries = parseEnvLines(readFileIfExists(secretPath));

  for (const [key, value] of envEntries) {
    if (secretParamNames.has(key)) {
      secretEntries.set(key, value);
      envEntries.delete(key);
    }
  }

  fs.mkdirSync(extensionsDir, { recursive: true });
  fs.writeFileSync(envPath, serializeEnvLines(envEntries));
  fs.writeFileSync(secretPath, serializeEnvLines(secretEntries));

  return { envPath, secretPath, envEntries, secretEntries };
}

function syncToFunctions(extensionName, envEntries, secretEntries) {
  const functionsDir = path.join(integrationRoot, '..', extensionName, 'functions');
  if (!fs.existsSync(functionsDir)) {
    return;
  }

  const merged = new Map([...envEntries, ...secretEntries]);
  fs.writeFileSync(
    path.join(functionsDir, '.env.local'),
    serializeEnvLines(merged),
  );
  fs.writeFileSync(
    path.join(functionsDir, '.secret.local'),
    serializeEnvLines(secretEntries),
  );
}

for (const extensionName of extensionNames) {
  const { envEntries, secretEntries } = normalizeExtensionFiles(extensionName);
  syncToFunctions(extensionName, envEntries, secretEntries);
}

console.log('Prepared extension env files for emulator tests.');
