import { initializeApp } from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';
import { StreamChat } from 'stream-chat';
import { emulatorProjectId, syncTimeoutMs } from './emulator-setup';
import { createUser, displayName, email, photoUrl } from './util';

type StreamUserWithEmail = {
  id: string;
  email?: string;
  name?: string;
  image?: string;
};

const STREAM_SYNC_TIMEOUT_MS = syncTimeoutMs(10_000, 30_000);
const STREAM_SYNC_TEST_TIMEOUT_MS = syncTimeoutMs(15_000, 90_000);
const STREAM_SYNC_POLL_INTERVAL_MS = 250;

jest.setTimeout(STREAM_SYNC_TEST_TIMEOUT_MS);

for (const path of [
  'extensions/auth-chat.env.local',
  'extensions/auth-chat.secret.local',
]) {
  const { error } = dotenv.config({ path });
  if (error) {
    console.error(error);
  }
}

initializeApp({ projectId: emulatorProjectId });

async function queryUsersByEmail(streamClient: StreamChat, userEmail: string) {
  return streamClient.queryUsers({ email: userEmail } as any);
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw lastError;
}

async function cleanupFirebaseUsers(auth: Auth) {
  const userRecords = await auth.listUsers();
  for (const userRecord of userRecords.users) {
    if (userRecord.email === email) {
      await auth.deleteUser(userRecord.uid);
    }
  }
}

async function cleanupStreamUsers(streamClient: StreamChat) {
  const { users } = await withRetry(() => queryUsersByEmail(streamClient, email));
  for (const user of users) {
    await withRetry(() => streamClient.deleteUser(user.id));
  }
}

describe('User Creation Tests', () => {
  let userId: string;
  let auth: Auth;
  let streamClient: StreamChat;

  let apiKey: string;
  let apiSecret: string;

  beforeAll(async () => {
    apiKey = process.env.STREAM_API_KEY!;
    apiSecret = process.env.STREAM_API_SECRET!;
    if (!apiKey || !apiSecret) {
      throw new Error('STREAM_API_KEY and STREAM_API_SECRET must be set');
    }

    auth = getAuth();
    streamClient = new StreamChat(apiKey, apiSecret);

    await cleanupStreamUsers(streamClient);
    await cleanupFirebaseUsers(auth);
  });

  afterAll(async () => {
    if (streamClient) {
      try {
        if (streamClient.user) {
          await streamClient.disconnectUser();
        }
        streamClient.closeConnection();
      } catch (error) {
        console.error('Error during Stream client cleanup:', error);
      }
    }
  });

  afterEach(async () => {
    await cleanupStreamUsers(streamClient);

    if (userId) {
      try {
        await auth.deleteUser(userId);
      } catch (error: any) {
        if (error?.code !== 'auth/user-not-found') {
          throw error;
        }
      }
    }
  });

  test('Verify no user exists', async () => {
    const { users } = await queryUsersByEmail(streamClient, email);
    expect(users.length).toBe(0);
  });

  test('Created Firebase user syncs with Stream Chat', async () => {
    const userRecord = await createUser(auth);
    userId = userRecord.uid;
    await waitForStreamUserToBeCreated(streamClient, userId);

    const { users } = await streamClient.queryUsers({ id: userId });
    const user = users.find((u) => u.id === userId) as StreamUserWithEmail | undefined;
    expect(user).not.toBeUndefined();
    expect(user?.email).toBe(email);
    expect(user?.name).toBe(displayName);
    expect(user?.image).toBe(photoUrl);
  });
});

describe('User Deletion Tests', () => {
  let userId: string;
  let auth: Auth;
  let streamClient: StreamChat;

  let apiKey: string;
  let apiSecret: string;

  beforeAll(async () => {
    apiKey = process.env.STREAM_API_KEY!;
    apiSecret = process.env.STREAM_API_SECRET!;
    if (!apiKey || !apiSecret) {
      throw new Error('STREAM_API_KEY and STREAM_API_SECRET must be set');
    }

    auth = getAuth();
    streamClient = new StreamChat(apiKey, apiSecret);

    await cleanupFirebaseUsers(auth);
    await cleanupStreamUsers(streamClient);
  });

  afterAll(async () => {
    if (streamClient) {
      try {
        if (streamClient.user) {
          await streamClient.disconnectUser();
        }
        streamClient.closeConnection();
      } catch (error) {
        console.error('Error during Stream client cleanup:', error);
      }
    }
  });

  beforeEach(async () => {
    const userRecord = await createUser(auth);
    userId = userRecord.uid;
    await waitForStreamUserToBeCreated(streamClient, userId);
  });

  afterEach(async () => {
    if (!userId) {
      return;
    }

    try {
      await auth.deleteUser(userId);
      await waitForStreamUserToBeDeleted(streamClient, userId);
    } catch (error: any) {
      if (error?.code !== 'auth/user-not-found') {
        console.log('[afterEach] (Expected) Error trying to delete user: ', error);
      }
    }
  });

  test('Verify that the user exists', async () => {
    const { users } = await streamClient.queryUsers({ id: userId });
    expect(users.length).toBe(1);
  });

  test('Deleted Firebase user syncs with Stream Chat', async () => {
    const userRecord = await auth.getUser(userId);
    expect(userRecord).toBeTruthy();

    const { users: initialUsers } = await streamClient.queryUsers({ id: userId });
    expect(initialUsers.length).toBe(1);

    await auth.deleteUser(userId);
    await waitForStreamUserToBeDeleted(streamClient, userId);

    const { users: deletedUsers } = await streamClient.queryUsers({ id: userId });
    expect(deletedUsers.length).toBe(0);
  });
});

async function waitForValue<T>(
  readValue: () => Promise<T | undefined>,
  errorMessage: string
) {
  const deadline = Date.now() + STREAM_SYNC_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const value = await readValue();
    if (value !== undefined) {
      return value;
    }

    await sleep(STREAM_SYNC_POLL_INTERVAL_MS);
  }

  throw new Error(errorMessage);
}

async function waitForStreamUserToBeCreated(streamClient: StreamChat, userId: string) {
  return waitForValue(async () => {
    const { users } = await streamClient.queryUsers({ id: userId });
    return users.find((user) => user.id === userId) as StreamUserWithEmail | undefined;
  }, 'Stream user was not created within timeout');
}

async function waitForStreamUserToBeDeleted(streamClient: StreamChat, userId: string) {
  await waitForValue(async () => {
    const { users } = await streamClient.queryUsers({ id: userId });
    return users.length === 0 ? true : undefined;
  }, 'Stream user was not deleted within timeout');
}
