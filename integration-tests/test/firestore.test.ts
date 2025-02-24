import * as dotenv from 'dotenv';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as stream from 'getstream';
import { FeedAPIResponse } from 'getstream';

for (const path of [
  'extensions/firestore-activity-feeds.env.local',
  'extensions/firestore-activity-feeds.secret.local',
]) {
  const { error, parsed } = dotenv.config({ path });
  if (error) {
    console.error(error);
  }
}

const api_key = process.env.STREAM_API_KEY!;
const api_secret = process.env.STREAM_API_SECRET!;
const collectionId = process.env.COLLECTION ?? 'feeds';

const userId = 'user';
const feedId = '1';
const foreignId = 'run_1';
const actor = 'user:1';
const verb = 'run';
const object = 'exercise:42';

describe('create firestore document', () => {
  let firestore: FirebaseFirestore.Firestore;

  beforeAll(async () => {
    // Initialize Firebase tools
    initializeApp();
    firestore = getFirestore();

    // Clear all activities
    const streamClient = stream.connect(api_key, api_secret);
    const user1 = streamClient.feed(userId, feedId);
    const allActivities = await user1.get();
    await Promise.all(
      allActivities.results.map((r: FeedAPIResponse['results'][number]) =>
        user1.removeActivity(r.id)
      )
    );
  });

  test('verify no activities', async () => {
    // Given

    // When

    // Then
    const streamClient = stream.connect(api_key, api_secret);
    const user1 = streamClient.feed(userId, feedId);
    const response = await user1.get();
    expect(response.results).toMatchObject([]);
  });

  test('verify activity creation', async () => {
    // Given

    // When
    // const collectionPath = `${collectionId}/${feedId}/${userId}/${foreignId}`;
    const collectionPath = `${collectionId}/${feedId}/${userId}`;
    console.log('[TEMP] Collection:', collectionPath);

    console.log('[TEMP] Collection path components:', {
      collectionId,
      feedId,
      userId,
      foreignId,
    });
    console.log('[TEMP] Full path:', collectionPath);
    console.log('[TEMP] Path length:', collectionPath.length);
    console.log(
      '[TEMP] Path characters:',
      Array.from(collectionPath).map((c) => `${c} (${c.charCodeAt(0)})`)
    );
    const docRef = firestore.doc(collectionPath);
    const doc = await docRef.get();
    if (doc.exists) {
      console.log(`Deleting existing doc ${doc}`);
      await docRef.delete();
    }

    await docRef.create({ actor, verb, object });

    // Wait for triggers to execute
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Then
    const streamClient = stream.connect(api_key, api_secret);
    const user1 = streamClient.feed(userId, feedId);
    const response = await user1.get();
    expect(response.results).toMatchObject([{ actor, verb, object }]);
  });
});
