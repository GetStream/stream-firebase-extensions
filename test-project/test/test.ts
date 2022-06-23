import * as dotenv from "dotenv";
import { initializeApp as initializeFirebaseAdmin } from "firebase-admin/app";
import { getAuth as getAuthAdmin } from "firebase-admin/auth";
import { initializeApp as initializeFirebaseClient } from "firebase/app";
import { connectAuthEmulator, getAuth as getAuthClient, signInWithEmailAndPassword } from "firebase/auth";
import { connectFunctionsEmulator, getFunctions, httpsCallable } from "firebase/functions";
import * as stream from "getstream";
import { StreamChat } from "stream-chat";

dotenv.config({ path: "extensions/auth-activity-feeds.env.local" });
dotenv.config({ path: "extensions/auth-activity-feeds.secret.local" });
dotenv.config({ path: "extensions/auth-chat.env.local" });
dotenv.config({ path: "extensions/auth-chat.secret.local" });

initializeFirebaseAdmin();
const adminAuth = getAuthAdmin();

const app = initializeFirebaseClient({
  projectId: process.env.GCLOUD_PROJECT,
  apiKey: "example",
  authDomain: "blah",
});
const functions = getFunctions(app);
connectFunctionsEmulator(functions, "localhost", 5001);
const clientAuth = getAuthClient(app);
connectAuthEmulator(clientAuth, "http://127.0.0.1:9099", { disableWarnings: true });

const chatServer = new StreamChat(process.env.STREAM_API_KEY!, process.env.STREAM_API_SECRET!);
const chatClient = new StreamChat(process.env.STREAM_API_KEY!);
const feeds = stream.connect(process.env.STREAM_API_KEY!, process.env.STREAM_API_SECRET!);

// Default jest timeout is 5 secs
jest.setTimeout(30000);

const email = "user@example.com";
const password = "secretPassword";
const name = "John Doe";
const image = "https://api.lorem.space/image/face";

let uid: string;
describe("create user", () => {
  // Create Firebase user to trigger extension functions
  beforeAll(async () => {
    ({ uid } = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      photoURL: image,
      emailVerified: true,
      phoneNumber: "+11234567890",
      disabled: false,
    }));

    // Wait for triggers to execute
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  test("verify chat user creation", async () => {
    // Verify creation of user
    const { users } = await chatServer.queryUsers({ id: uid });
    const user = users.find((u) => u.id === uid);
    expect(user).not.toBeNull();
    expect(user?.name).toBe(name);
    expect(user?.image).toBe(image);
  });

  test("verify feeds user creation", async () => {
    // Verify creation of user
    const { data: user } = await feeds.user(uid).get();
    expect(user).not.toBeNull();
    expect(user?.name).toBe(name);
    expect(user?.profileImage).toBe(image);
    expect(user?.email).toBe(email);
  });
});

describe("generate chat token", () => {
  beforeAll(async () => {
    await signInWithEmailAndPassword(clientAuth, email, password);
  });
  test("call getStreamUserToken", async () => {
    const getStreamUserToken = httpsCallable<undefined, string>(functions, "ext-auth-chat-getStreamUserToken");
    const { data: token } = await getStreamUserToken();

    await chatClient.connectUser({ id: uid }, token);
    expect(chatClient.user.name).toBe(name);
  });
  afterAll(async () => chatClient.disconnectUser());
});

// TODO generate feeds token
// TODO verify token generation in feeds

// TODO revoke feeds token
// TODO revoke chat token
// TODO verify token revocation in feeds
// TODO verify token revocation in chat
/*
console.log("Waiting 5 seconds...");
await new Promise((resolve) => setTimeout(resolve, 5000));

try {
  await getAuth().deleteUser(uid);
} catch (error) {
  console.error("Error deleting user:", error);
  process.exitCode = 1;
}

console.log("Successfully deleted user");

// TODO verify user deletion in feeds
// TODO verify user deletion in chat

// TODO test creating firestore document
// TODO verify creating firestore document in feeds
// TODO test updating firestore document
// TODO verify updating firestore document in feeds
// TODO test deleting firestore document
// TODO verify deleting firestore document in feeds

*/
