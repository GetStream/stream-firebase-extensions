import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

initializeApp();

let uid;
try {
  ({ uid } = await getAuth().createUser({
    email: "user@example.com",
    emailVerified: false,
    phoneNumber: "+11234567890",
    password: "secretPassword",
    displayName: "John Doe",
    photoURL: "https://api.lorem.space/image/face",
    disabled: false,
  }));
} catch (error) {
  console.error("Error creating new user:", error);
  process.exitCode = 1;
}

console.log("Successfully created new user:", uid);

// TODO use jest

// TODO verify user creation in feeds
// TODO verify user creation in chat

// TODO generate feeds token
// TODO generate chat token
// TODO verify token generation in feeds
// TODO verify token generation in chat

// TODO revoke feeds token
// TODO revoke chat token
// TODO verify token revocation in feeds
// TODO verify token revocation in chat

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

// TODO test writing firestore document
// TODO verify writing firestore document in feeds
