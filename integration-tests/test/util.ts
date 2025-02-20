import { Auth, UserRecord } from 'firebase-admin/auth';

export function expectRecent(date: Date, thresholdMs = 10000) {
  expect(Math.abs(new Date().getTime() - date.getTime())).toBeLessThan(
    thresholdMs
  );
}

export async function createUser(auth: Auth): Promise<UserRecord> {
  return await auth.createUser({
    email: email,
    emailVerified: true,
    phoneNumber: phoneNumber,
    password: password,
    displayName: displayName,
    photoURL: photoUrl,
  });
}

// User credentials
export const email = 'user@example.com';
export const password = 'secretPassword';
export const phoneNumber = '+11234567890';
export const displayName = 'John Doe';
export const photoUrl = 'https://example.com/johndoe.jpg';
