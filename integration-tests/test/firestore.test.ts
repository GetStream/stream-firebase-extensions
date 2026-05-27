import * as dotenv from 'dotenv';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as stream from 'getstream';
import { FeedAPIResponse } from 'getstream';
import { emulatorProjectId, syncTimeoutMs } from './emulator-setup';

for (const path of [
  'extensions/firestore-activity-feeds.env.local',
  'extensions/firestore-activity-feeds.secret.local',
]) {
  const { error } = dotenv.config({ path });
  if (error) {
    console.error(error);
  }
}

const api_key = process.env.STREAM_API_KEY!;
const api_secret = process.env.STREAM_API_SECRET!;
const collectionId = process.env.COLLECTION ?? 'feeds';

const feedId = 'user';
const userId = '1';
const foreignId = 'run_one';
const actor = 'user:1';
const verb = 'run';
const object = 'exercise:42';

jest.setTimeout(syncTimeoutMs(30_000, 90_000));

initializeApp({ projectId: emulatorProjectId });

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Firestore Activity Feeds tests', () => {
  let firestore: FirebaseFirestore.Firestore;
  let streamClient: stream.StreamClient;
  let userFeed: stream.StreamFeed;

  async function getActivities() {
    const response = await userFeed.get();
    return response.results;
  }

  async function clearActivities() {
    const allActivities = await getActivities();
    await Promise.all(
      allActivities.map((r: FeedAPIResponse['results'][number]) =>
        userFeed.removeActivity(r.id)
      )
    );
  }

  async function waitForActivities(
    expected: Partial<FeedAPIResponse['results'][number]>[],
    timeoutMs = syncTimeoutMs(15_000, 60_000)
  ) {
    const startedAt = Date.now();
    let activities = await getActivities();

    while (Date.now() - startedAt < timeoutMs) {
      try {
        expect(activities).toMatchObject(expected);
        return activities;
      } catch {
        await sleep(500);
        activities = await getActivities();
      }
    }

    expect(activities).toMatchObject(expected);
    return activities;
  }

  beforeAll(async () => {
    // Initialize Firebase tools
    firestore = getFirestore();

    // Clear all activities
    streamClient = stream.connect(api_key, api_secret);
    userFeed = streamClient.feed(feedId, userId);
    await clearActivities();
  });

  afterEach(async () => {
    // Clear all activities
    await clearActivities();

    // Clear firebase doc
    const collectionPath = `${collectionId}/${feedId}/${userId}/${foreignId}`;
    const docRef = firestore.doc(collectionPath);
    const doc = await docRef.get();
    if (doc.exists) {
      await docRef.delete();
    }
  });

  test('verify no activities', async () => {
    // Given

    // When

    // Then
    await waitForActivities([]);
  });

  test('verify activity creation', async () => {
    // Given

    // When
    const collectionPath = `${collectionId}/${feedId}/${userId}/${foreignId}`;
    const docRef = firestore.doc(collectionPath);
    const doc = await docRef.get();
    if (doc.exists) {
      console.log(`Deleting existing doc ${doc}`);
      await docRef.delete();
    }

    await docRef.create({ actor, verb, object });

    // Then
    await waitForActivities([{ actor, verb, object }]);
  });

  test('verify activity update', async () => {
    // Given
    const collectionPath = `${collectionId}/${feedId}/${userId}/${foreignId}`;
    const docRef = firestore.doc(collectionPath);
    const doc = await docRef.get();
    if (doc.exists) {
      console.log(`Deleting existing doc ${doc}`);
      await docRef.delete();
    }

    await docRef.create({ actor, verb, object });

    // When
    await docRef.update({ verb: 'jumped' });

    // Then
    await waitForActivities([{ actor, verb: 'jumped', object }]);
  });

  test('verify activity deletion', async () => {
    // Given
    const collectionPath = `${collectionId}/${feedId}/${userId}/${foreignId}`;
    const docRef = firestore.doc(collectionPath);
    await docRef.create({ actor, verb, object });

    // Verify activity was created
    await waitForActivities([{ actor, verb, object }]);

    // When
    const doc = await docRef.get();
    if (doc.exists) {
      await docRef.delete();
    }

    // Then
    await waitForActivities([]);
  });
});
