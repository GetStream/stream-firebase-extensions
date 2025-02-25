import { Functions, httpsCallable } from 'firebase/functions';
import { createUser, displayName, email, expectRecent, password } from './util';
import { initializeApp } from 'firebase-admin/app';
import {
  getApp,
  initializeApp as initializeFirebaseClient,
} from 'firebase/app';
import { Auth, getAuth } from 'firebase-admin/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import {
  getAuth as getClientAuth,
  signInWithEmailAndPassword,
  connectAuthEmulator,
} from 'firebase/auth';
import { StreamChat, UserResponse } from 'stream-chat';
import * as dotenv from 'dotenv';

describe('Token Generation', () => {
  let auth: Auth;
  let functions: Functions;
  let streamClient: StreamChat;

  beforeAll(async () => {
    // Load environment variables
    for (const path of [
      'extensions/auth-activity-feeds.env.local',
      'extensions/auth-activity-feeds.secret.local',
    ]) {
      const { error } = dotenv.config({ path });
      if (error) {
        console.error(error);
      }
    }

    // Verify required environment variables
    const api_key = process.env.STREAM_API_KEY;
    const api_secret = process.env.STREAM_API_SECRET;
    if (!api_key || !api_secret) {
      throw new Error('STREAM_API_KEY and STREAM_API_SECRET must be set');
    }

    // Initialize Firebase Admin with explicit project ID
    initializeApp({
      projectId: 'demo-stream',
    });
    auth = getAuth();

    // Initialize Firebase Client
    const app = initializeFirebaseClient({
      projectId: 'demo-stream',
      apiKey: 'fake-api-key',
    });

    // Setup Functions emulator
    functions = getFunctions(app, 'europe-west1'); // Specify the region here
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);

    // Setup Auth emulator
    const clientAuth = getClientAuth();
    connectAuthEmulator(clientAuth, 'http://127.0.0.1:9099');

    // Initialize Stream client
    streamClient = new StreamChat(api_key, api_secret, {
      allowServerSideConnect: true,
    });
  });

  afterEach(async () => {
    await streamClient.disconnectUser();
  });

  test('should generate and validate Stream token for authenticated user', async () => {
    // Create a test user
    const userRecord = await createUser(auth);
    const uid = userRecord.uid;

    // Sign in the user
    const clientAuth = getClientAuth();
    await signInWithEmailAndPassword(clientAuth, email, password);

    // Get Stream token
    const getStreamUserToken = httpsCallable<undefined, string>(
      functions,
      'ext-auth-chat-getStreamUserToken'
    );
    try {
      const { data: token } = await getStreamUserToken();
      // Verify token works with Stream
      await streamClient.connectUser({ id: uid }, token);
      expect(streamClient.user.name).toBe(displayName);
    } catch (error) {
      console.error(error);
    }

    // Clean up
    await auth.deleteUser(uid);
  });

  test('should fail to generate token for unauthenticated user', async () => {
    // Sign out any existing user
    const clientAuth = getClientAuth();
    await clientAuth.signOut();

    // Attempt to get Stream token
    const getStreamUserToken = httpsCallable<undefined, string>(
      functions,
      'ext-auth-chat-getStreamUserToken'
    );

    // Verify it fails with the correct error
    await expect(getStreamUserToken()).rejects.toThrow(
      'The function must be called while authenticated'
    );
  });
});
