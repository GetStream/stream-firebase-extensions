import * as dotenv from "dotenv";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import * as stream from "getstream";
import { StreamChat } from "stream-chat";

dotenv.config({ path: "extensions/auth-activity-feeds.env.local" });
dotenv.config({ path: "extensions/auth-activity-feeds.secret.local" });
dotenv.config({ path: "extensions/auth-chat.env.local" });
dotenv.config({ path: "extensions/auth-chat.secret.local" });

initializeApp();
const chat = StreamChat.getInstance(process.env.STREAM_API_KEY!, process.env.STREAM_API_SECRET!);
const feeds = stream.connect(process.env.STREAM_API_KEY!, process.env.STREAM_API_SECRET!);

// Default jest timeout is 5 secs
jest.setTimeout(30000);

let uid: string;
describe("create user", () => {
  const name = "John Doe";
  const image = "https://api.lorem.space/image/face";
  const email = "user@example.com";

  // Create Firebase user to trigger extension functions
  beforeAll(async () => {
    ({ uid } = await getAuth().createUser({
      email,
      displayName: name,
      photoURL: image,
      emailVerified: false,
      phoneNumber: "+11234567890",
      password: "secretPassword",
      disabled: false,
    }));

    // Wait for triggers to execute
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  test("verify chat user creation", async () => {
    // Verify creation of user
    const { users } = await chat.queryUsers({ id: uid });
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

// TODO generate feeds token
// TODO generate chat token
// TODO verify token generation in feeds
// TODO verify token generation in chat

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
