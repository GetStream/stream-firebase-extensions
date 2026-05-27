#!/usr/bin/env node
/**
 * Fail fast when CI secrets were not written to extension env files.
 * Does not print secret values.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'extensions');
const pairs = [
  ['auth-chat.env.local', ['STREAM_API_KEY']],
  ['auth-chat.secret.local', ['STREAM_API_SECRET']],
];

let failed = false;

for (const [file, requiredKeys] of pairs) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).size === 0) {
    console.error(`Missing or empty: extensions/${file}`);
    failed = true;
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  for (const key of requiredKeys) {
    if (!content.includes(`${key}=`) && !content.includes(`${key} =`)) {
      console.error(`extensions/${file} does not contain ${key}`);
      failed = true;
    }
  }
}

if (failed) {
  console.error(
    '\nRepository secrets ENV_LOCAL and SECRET_LOCAL must be configured.\n' +
      'ENV_LOCAL should include at least STREAM_API_KEY=... and LOCATION=europe-west1\n' +
      'SECRET_LOCAL should include STREAM_API_SECRET=...\n',
  );
  process.exit(1);
}

console.log('Extension env files look valid (keys present, values not shown).');
