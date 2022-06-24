import { initializeApp } from "firebase/app";
import { collection, connectFirestoreEmulator, doc, getFirestore, setDoc } from "firebase/firestore";

const app = initializeApp({
  projectId: process.env.GCLOUD_PROJECT,
  apiKey: "fake",
});
const db = getFirestore(app);
connectFirestoreEmulator(db, "localhost", 8080);

const collectionName = "feeds";
const feedGroup = "user";
const userId = "1";
const foreignId = "run:1";
const activity = {
  actor: "User:1",
  verb: "run",
  object: "Exercise:42",
  course: { name: "Golden Gate park", distance: 10 },
  participants: ["Thierry", "Tommaso"],
  started_at: new Date(),
  location: { type: "point", coordinates: [37.769722, -122.476944] },
};

// Create a new document using the document path {COLLECTION}/{feedId}/{userId}/{foreignId}
const feedRef = doc(collection(db, collectionName), feedGroup);
const activityRef = doc(collection(feedRef, userId), foreignId);

describe("create activity document", () => {
  test("create document", async () => {
    await setDoc(feedRef, { dummy: 1 });
    // await setDoc(activityRef, activity);
  });
});
