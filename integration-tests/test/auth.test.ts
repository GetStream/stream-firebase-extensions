import { initializeApp } from 'firebase-admin/app';
import { initializeApp as initializeFirebaseClient } from 'firebase/app';
import { Auth, getAuth, UserRecord } from 'firebase-admin/auth';
import { StreamChat, UserResponse } from 'stream-chat';
import * as dotenv from 'dotenv';
import { connectFunctionsEmulator, Functions } from 'firebase/functions';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { createUser, displayName, email, expectRecent, photoUrl } from './util';

for (const path of [
  'extensions/auth-activity-feeds.env.local',
  'extensions/auth-activity-feeds.secret.local',
]) {
  const { error, parsed } = dotenv.config({ path });
  if (error) {
    console.error(error);
  }
}

describe('Auth Chat Tests', () => {
  let userId: string;
  let auth: Auth;
  let functions: Functions;
  let streamClient: StreamChat;

  beforeAll(async () => {
    // Check that the API key and secret are set
    const api_key = process.env.STREAM_API_KEY;
    const api_secret = process.env.STREAM_API_SECRET;
    if (!api_key || !api_secret) {
      throw new Error('STREAM_API_KEY and STREAM_API_SECRET must be set');
    }

    // Initialize Firebase tools
    initializeApp();
    auth = getAuth();

    // Initialize Stream client
    streamClient = new StreamChat(api_key, api_secret);

    const { users } = await streamClient.queryUsers({ email: email });
    for (const user of users) {
      await streamClient.deleteUser(user.id);
    }
  });

  afterEach(async () => {
    if (userId) {
      try {
        // Delete the user from Firebase
        await auth.deleteUser(userId);
      } catch (error) {
        console.log('Error deleting Firebase user:', error);
      }

      try {
        // Delete the user from Stream
        await streamClient.deleteUser(userId);
      } catch (error) {
        console.log('Error deleting Stream user:', error);
      }
    }
  });

  test('Verify no user exists', async () => {
    // Given

    // When

    // Then
    const { users } = await streamClient.queryUsers({ email: email });
    expect(users.length).toBe(0);
  });

  test('Verify Firebase user creation syncs with Stream Chat', async () => {
    // Given

    // When
    const userRecord = await createUser(auth);
    userId = userRecord.uid;
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Then
    const { users } = await streamClient.queryUsers({ id: userId });
    const user = users.find((u) => u.id === userId);
    expect(user).not.toBeUndefined();
    expect(user?.email).toBe(email);
    expect(user?.name).toBe(displayName);
    expect(user?.image).toBe(photoUrl);
  });

  test('Verify Firebase user deletion syncs with Stream Chat', async () => {
    // Given
    const userRecord = await createUser(auth);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // When
    await auth.deleteUser(userRecord.uid);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Then
    const { users } = await streamClient.queryUsers({ id: userRecord.uid });
    const user = users.find((u) => u.id === userRecord.uid);
    expect(user).toBeUndefined();
  });
});
