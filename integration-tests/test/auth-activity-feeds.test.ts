import { initializeApp } from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';
import { connect as connectToFeeds } from 'getstream';
import * as dotenv from 'dotenv';
import { emulatorProjectId, syncTimeoutMs } from './emulator-setup';
import { createUser, displayName, email, photoUrl } from './util';

for (const path of [
  'extensions/auth-activity-feeds.env.local',
  'extensions/auth-activity-feeds.secret.local',
]) {
  const { error } = dotenv.config({ path });
  if (error) {
    console.error(error);
  }
}

initializeApp({ projectId: emulatorProjectId });

async function cleanupFirebaseUsers(auth: Auth) {
  const userRecords = await auth.listUsers();
  for (const userRecord of userRecords.users) {
    if (userRecord.email === email) {
      await auth.deleteUser(userRecord.uid);
    }
  }
}

describe('User Creation Tests', () => {
  let userId: string;
  let auth: Auth;

  let apiKey: string;
  let apiSecret: string;

  beforeAll(async () => {
    apiKey = process.env.STREAM_API_KEY!;
    apiSecret = process.env.STREAM_API_SECRET!;
    if (!apiKey || !apiSecret) {
      throw new Error('STREAM_API_KEY and STREAM_API_SECRET must be set');
    }

    auth = getAuth();
    await cleanupFirebaseUsers(auth);
  });

  afterEach(async () => {
    if (!userId) {
      return;
    }

    try {
      await auth.deleteUser(userId);
    } catch (error: any) {
      if (error?.code !== 'auth/user-not-found') {
        throw error;
      }
    }
  });

  test('Created Firebase user syncs with Stream Feeds', async () => {
    const feedsClient = connectToFeeds(apiKey, apiSecret);

    const userRecord = await createUser(auth);
    userId = userRecord.uid;

    const user = await waitForFeedUserToBeCreated(feedsClient, userId);
    expect(user).not.toBeNull();
    expect(user?.name).toBe(displayName);
    expect(user?.profileImage).toBe(photoUrl);
    expect(user?.email).toBe(email);
  }, syncTimeoutMs(15_000, 90_000));
});

describe('User Deletion Tests', () => {
  let userId: string;
  let auth: Auth;

  let apiKey: string;
  let apiSecret: string;

  beforeAll(async () => {
    apiKey = process.env.STREAM_API_KEY!;
    apiSecret = process.env.STREAM_API_SECRET!;
    if (!apiKey || !apiSecret) {
      throw new Error('STREAM_API_KEY and STREAM_API_SECRET must be set');
    }

    auth = getAuth();
    await cleanupFirebaseUsers(auth);
  });

  beforeEach(async () => {
    const feedsClient = connectToFeeds(apiKey, apiSecret);
    const userRecord = await createUser(auth);
    userId = userRecord.uid;
    const createdFeedUser = await waitForFeedUserToBeCreated(feedsClient, userId);
    expect(createdFeedUser.name).toBe(displayName);
    expect(createdFeedUser.profileImage).toBe(photoUrl);
    expect(createdFeedUser.email).toBe(email);
  });

  afterEach(async () => {
    if (!userId) {
      return;
    }

    try {
      await auth.deleteUser(userId);
      await waitForFeedUserToBeDeleted(connectToFeeds(apiKey, apiSecret), userId);
    } catch (error: any) {
      if (error?.code !== 'auth/user-not-found') {
        console.log('[afterEach] (Expected) Error trying to delete user: ', error);
      }
    }
  });

  test('Verify that the user exists', async () => {
    const user = await waitForFeedUserToBeCreated(connectToFeeds(apiKey, apiSecret), userId);
    expect(user.name).toBe(displayName);
    expect(user.profileImage).toBe(photoUrl);
    expect(user.email).toBe(email);
  }, syncTimeoutMs(15_000, 90_000));

  test('Deleted Firebase user syncs with Stream Feeds', async () => {
    const feedsClient = connectToFeeds(apiKey, apiSecret);
    const createdFeedUser = await waitForFeedUserToBeCreated(feedsClient, userId);
    expect(createdFeedUser.name).toBe(displayName);
    expect(createdFeedUser.profileImage).toBe(photoUrl);
    expect(createdFeedUser.email).toBe(email);

    await auth.deleteUser(userId);
    await waitForFeedUserToBeDeleted(feedsClient, userId);
  }, syncTimeoutMs(15_000, 90_000));
});

async function waitForFeedUserToBeCreated(
  feedsClient: ReturnType<typeof connectToFeeds>,
  userId: string
) {
  const maxAttempts = process.env.CI ? 60 : 20;
  const waitTime = 500;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const { data } = await feedsClient.user(userId).get();
      return data;
    } catch (error: any) {
      if (error?.error?.status_code !== 404) {
        throw error;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, waitTime));
    attempts++;
  }

  throw new Error('Stream Feeds user was not created within timeout');
}

async function waitForFeedUserToBeDeleted(
  feedsClient: ReturnType<typeof connectToFeeds>,
  userId: string
) {
  const maxAttempts = process.env.CI ? 60 : 20;
  const waitTime = 500;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      await feedsClient.user(userId).get();
    } catch (error: any) {
      if (error?.error?.status_code === 404) {
        return;
      }
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, waitTime));
    attempts++;
  }

  throw new Error('Stream Feeds user was not deleted within timeout');
}
