import { initializeApp } from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';
import { StreamChat } from 'stream-chat';
import * as dotenv from 'dotenv';
import { createUser, displayName, email, photoUrl } from './util';
import { connect as connectToFeeds } from 'getstream';

for (const path of [
  'extensions/auth-activity-feeds.env.local',
  'extensions/auth-activity-feeds.secret.local',
]) {
  const { error } = dotenv.config({ path });
  if (error) {
    console.error(error);
  }
}

initializeApp();

describe('User Creation Tests', () => {
  let userId: string;
  let auth: Auth;
  let streamClient: StreamChat;

  let apiKey: string;
  let apiSecret: string;

  beforeAll(async () => {
    // Check that the API key and secret are set
    apiKey = process.env.STREAM_API_KEY!;
    apiSecret = process.env.STREAM_API_SECRET!;
    if (!apiKey || !apiSecret) {
      throw new Error('STREAM_API_KEY and STREAM_API_SECRET must be set');
    }

    // Initialize Firebase tools
    auth = getAuth();

    // Initialize Stream client
    streamClient = new StreamChat(apiKey, apiSecret);

    // Remove all Stream users with the given mail
    const { users } = await streamClient.queryUsers({ email: email });
    for (const user of users) {
      await streamClient.deleteUser(user.id);
    }

    // Remove all Firebase users with the given mail
    const userRecords = await auth.listUsers();
    for (const userRecord of userRecords.users) {
      if (userRecord.email === email) {
        await auth.deleteUser(userRecord.uid);
      }
    }
  });

  afterAll(async () => {
    // Clean up Stream client connections
    if (streamClient) {
      try {
        // Disconnect any connected users
        if (streamClient.user) {
          await streamClient.disconnectUser();
        }
        // Close the connection
        streamClient.closeConnection();
      } catch (error) {
        console.error('Error during Stream client cleanup:', error);
      }
    }
  });

  afterEach(async () => {
    const { users } = await streamClient.queryUsers({ email: email });
    for (const user of users) {
      await streamClient.deleteUser(user.id);
    }

    if (userId) {
      const userRecord = await auth.getUser(userId);
      if (userRecord) {
        await auth.deleteUser(userId);
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

  test('Created Firebase user syncs with Stream Chat', async () => {
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

  test('Created Firebase user syncs with Stream Feeds', async () => {
    // Given
    const feedsClient = connectToFeeds(apiKey, apiSecret);

    // When
    const userRecord = await createUser(auth);
    userId = userRecord.uid;
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Then
    const { data: user } = await feedsClient.user(userId).get();
    expect(user).not.toBeNull();
    expect(user?.name).toBe(displayName);
    expect(user?.profileImage).toBe(photoUrl);
    expect(user?.email).toBe(email);
  });
});

describe('User Deletion Tests', () => {
  let userId: string;
  let auth: Auth;
  let streamClient: StreamChat;

  let apiKey: string;
  let apiSecret: string;

  beforeAll(async () => {
    // Check that the API key and secret are set
    apiKey = process.env.STREAM_API_KEY!;
    apiSecret = process.env.STREAM_API_SECRET!;
    if (!apiKey || !apiSecret) {
      throw new Error('STREAM_API_KEY and STREAM_API_SECRET must be set');
    }

    // Initialize Firebase tools
    auth = getAuth();

    // Initialize Stream client
    streamClient = new StreamChat(apiKey, apiSecret);

    // Remove all Firebase users with the given mail
    // This will result in all associated Stream users being deleted as well
    const userRecords = await auth.listUsers();
    for (const userRecord of userRecords.users) {
      if (userRecord.email === email) {
        await auth.deleteUser(userRecord.uid);
      }
    }
  });

  afterAll(async () => {
    // Clean up Stream client connections
    if (streamClient) {
      try {
        // Disconnect any connected users
        if (streamClient.user) {
          await streamClient.disconnectUser();
        }
        // Close the connection
        streamClient.closeConnection();
      } catch (error) {
        console.error('Error during Stream client cleanup:', error);
      }
    }
  });

  beforeEach(async () => {
    // Create a firebase user that can be deleted
    const userRecord = await createUser(auth);
    userId = userRecord.uid;

    // Wait for the Stream user to be created (up to 5 seconds)
    await waitForStreamUserToBeCreated(streamClient, userId);
  });

  afterEach(async () => {
    if (userId) {
      // Delete the Firebase user first, which will trigger Stream user deletion
      try {
        const userRecord = await auth.getUser(userId);
        if (userRecord) {
          await auth.deleteUser(userId);
        }

        // Wait for the Stream user to be created (up to 5 seconds)
        let attempts = 0;
        while (attempts < 10) {
          const { users } = await streamClient.queryUsers({ id: userId });
          if (users.length === 0) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 500));
          attempts++;
        }

        // Throw error if user wasn't created
        const { users } = await streamClient.queryUsers({ id: userId });
        if (users.length !== 0) {
          throw new Error('Stream user was not deleted within timeout');
        }
      } catch (error: any) {
        console.log(
          '[afterEach] (Expected) Error trying to delete user: ',
          error
        );
      }
    }
  });

  test('Verify that the user exists', async () => {
    // Given

    // When

    // Then
    const { users } = await streamClient.queryUsers({ id: userId });
    expect(users.length).toBe(1);
  });

  test('Deleted Firebase user syncs with Stream Chat', async () => {
    // Given
    try {
      const userRecord = await auth.getUser(userId);
      expect(userRecord).toBeTruthy();

      const { users: initialUsers } = await streamClient.queryUsers({
        id: userId,
      });
      expect(initialUsers.length).toBe(1);
    } catch (error: any) {
      throw new Error('User was not created in Firebase');
    }

    // When
    await auth.deleteUser(userId);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Then
    let { users: deletedUsers } = await streamClient.queryUsers({ id: userId });
    expect(deletedUsers.length).toBe(0);
  }, 10000); // Increased timeout to 10 seconds

  test('Deleted Firebase user syncs with Stream Feeds', async () => {
    // Given
    try {
      const userRecord = await auth.getUser(userId);
      expect(userRecord).toBeTruthy();

      const { users: initialUsers } = await streamClient.queryUsers({
        id: userId,
      });
      expect(initialUsers.length).toBe(1);
    } catch (error: any) {
      throw new Error('User was not created in Firebase');
    }

    // When
    await auth.deleteUser(userId);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Then
    try {
      const user = await connectToFeeds(apiKey, apiSecret).user(userId).get();
      expect(user).toBeNull();
    } catch (error: any) {
      expect(error.error.status_code).toBe(404);
      expect(error.error.detail).toBe('User does not exist');
    }
  }, 10000); // Increased timeout to 10 seconds
});

async function waitForStreamUserToBeCreated(
  streamClient: StreamChat,
  userId: string
) {
  const maxAttempts = 10;
  const waitTime = 500;
  let attempts = 0;
  while (attempts < maxAttempts) {
    const { users } = await streamClient.queryUsers({ id: userId });
    if (users.length > 0) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    attempts++;

    if (attempts >= maxAttempts) {
      throw new Error('Stream user was not created within timeout');
    }
  }
}
