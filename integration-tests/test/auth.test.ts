import * as dotenv from "dotenv";
import { initializeApp as initializeFirebaseAdmin } from "firebase-admin/app";
import { getAuth as getAuthAdmin } from "firebase-admin/auth";
import { initializeApp as initializeFirebaseClient } from "firebase/app";
import { connectAuthEmulator, getAuth as getAuthClient, signInWithEmailAndPassword } from "firebase/auth";
import { connectFunctionsEmulator, getFunctions, httpsCallable } from "firebase/functions";
import * as stream from "getstream";
import { StreamChat, UserResponse } from "stream-chat";
import { expectRecent } from "./util";

dotenv.config({ path: "extensions/auth-activity-feeds.env.local" });
dotenv.config({ path: "extensions/auth-activity-feeds.secret.local" });
dotenv.config({ path: "extensions/auth-chat.env.local" });
dotenv.config({ path: "extensions/auth-chat.secret.local" });

initializeFirebaseAdmin();
const adminAuth = getAuthAdmin();

const app = initializeFirebaseClient({
  projectId: process.env.GCLOUD_PROJECT,
  apiKey: "fake",
});
const functions = getFunctions(app);
connectFunctionsEmulator(functions, "localhost", 5001);
const clientAuth = getAuthClient(app);
connectAuthEmulator(clientAuth, "http://127.0.0.1:9099", { disableWarnings: true });

const api_key = process.env.STREAM_API_KEY!;
const api_secret = process.env.STREAM_API_SECRET!;

console.log(process.cwd());
var lineReader = require("readline").createInterface({
  input: require("fs").createReadStream("extensions/auth-activity-feeds.env.local"),
});

lineReader.on("line", function (line: string) {
  console.log("Line from file:", line);
});
console.log("api key", api_key);

const chatServer = new StreamChat(api_key, api_secret);
const chatClient = new StreamChat(api_key, { allowServerSideConnect: true });

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
    const feeds = stream.connect(api_key, api_secret);

    const { data: user } = await feeds.user(uid).get();
    expect(user).not.toBeNull();
    expect(user?.name).toBe(name);
    expect(user?.profileImage).toBe(image);
    expect(user?.email).toBe(email);
  });
});

describe("generate tokens", () => {
  beforeAll(async () => {
    await signInWithEmailAndPassword(clientAuth, email, password);
  });

  test("create and validate chat token", async () => {
    const getStreamUserToken = httpsCallable<undefined, string>(functions, "ext-auth-chat-getStreamUserToken");
    const { data: token } = await getStreamUserToken();

    await chatClient.connectUser({ id: uid }, token);
    expect(chatClient.user.name).toBe(name);
    await chatClient.disconnectUser();

    type Response = { users: { [key: string]: UserResponse } };
    const revokeStreamUserToken = httpsCallable<undefined, Response>(functions, "ext-auth-chat-revokeStreamUserToken");
    const {
      data: { users },
    } = await revokeStreamUserToken();
    expect(users).toHaveProperty(uid);
    expect(users[uid].name).toBe(name);
    expectRecent(new Date(users[uid].revoke_tokens_issued_before));

    // Seems we need to wait here to avoid flakiness
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await expect(chatClient.connectUser({ id: uid }, token)).rejects.toThrowError("token has been revoked");
  });

  test("create and validate feeds token", async () => {
    const getStreamUserToken = httpsCallable<undefined, string>(
      functions,
      "ext-auth-activity-feeds-getStreamUserToken"
    );
    const { data: token } = await getStreamUserToken();

    const feeds = stream.connect(api_key, token);
    const { data: user } = await feeds.currentUser.get();
    expect(user).not.toBeNull();
    expect(user?.name).toBe(name);
    expect(user?.profileImage).toBe(image);
    expect(user?.email).toBe(email);
  });
});

describe("delete user", () => {
  // Delete the Firebase user to trigger extension functions
  beforeAll(async () => {
    await adminAuth.deleteUser(uid);

    // Wait for triggers to execute
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  test("verify chat user deletion", async () => {
    const { users } = await chatServer.queryUsers({ id: uid });
    const user = users.find((u) => u.id === uid);
    expect(user).toBeUndefined();
  });

  test("verify feeds user deletion", async () => {
    const feeds = stream.connect(api_key, api_secret);
    await expect(feeds.user(uid).get()).rejects.toThrowError("User does not exist");
  });
});

// TODO test creating firestore document
// TODO verify creating firestore document in feeds
// TODO test updating firestore document
// TODO verify updating firestore document in feeds
// TODO test deleting firestore document
// TODO verify deleting firestore document in feeds
