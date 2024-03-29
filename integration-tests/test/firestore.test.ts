import * as dotenv from "dotenv";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as stream from "getstream";
import { FeedAPIResponse } from "getstream";

for (const path of [
    "extensions/firestore-activity-feeds.env.local",
    "extensions/firestore-activity-feeds.secret.local",
]) {
    const { error, parsed } = dotenv.config({ path });
    if (error) {
        console.error(error);
    }
}

const api_key = process.env.STREAM_API_KEY!;
const api_secret = process.env.STREAM_API_SECRET!;
const collectionId = process.env.COLLECTION!;
initializeApp();
const firestore = getFirestore();

const feedType = "user";
const feedId = "1";
const foreignId = "run:1";
const actor = "user:1";
const verb = "run";
const object = "exercise:42";

describe("create firestore document", () => {
    beforeAll(async () => {
        // Clear all activities
        const feeds = stream.connect(api_key, api_secret);
        const user1 = feeds.feed(feedType, feedId);
        const allActivities = await user1.get();
        await Promise.all(
            allActivities.results.map((r: FeedAPIResponse["results"][number]) => user1.removeActivity(r.id))
        );

        const docRef = firestore.doc(`${collectionId}/${feedType}/${feedId}/${foreignId}`);
        const doc = await docRef.get();
        if (doc.exists) {
            console.log(`Deleting existing doc ${doc}`);
            await docRef.delete();
        }

        await docRef.create({ actor, verb, object });

        // Wait for triggers to execute
        await new Promise((resolve) => setTimeout(resolve, 2000));
    });

    test("verify activity creation", async () => {
        const feeds = stream.connect(api_key, api_secret);
        const user1 = feeds.feed(feedType, feedId);
        const response = await user1.get();
        expect(response.results).toMatchObject([{ actor, verb, object }]);
    });
});
