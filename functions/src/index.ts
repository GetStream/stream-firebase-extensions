import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { StreamChat } from "stream-chat";

admin.initializeApp();

const serverClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY!,
  process.env.STREAM_API_SECRET!,
);

// When a user is created in Firebase an associated Stream account is also created.
export const createStreamUser = functions.handler.auth.user.onCreate((user) => {
  functions.logger.log("Firebase user created", user);
  // Create user using the serverClient.
  return serverClient
    .upsertUser({
      id: user.uid,
      name: user.displayName,
      email: user.email,
      image: user.photoURL,
    })
    .then((response) => functions.logger.log("Stream user created", response));
});

// When a user is deleted from Firebase their associated Stream account is also deleted.
export const deleteStreamUser = functions.handler.auth.user.onDelete((user) => {
  functions.logger.log("Firebase user deleted", user);
  return serverClient
    .deleteUser(user.uid)
    .then((response) => functions.logger.log("Stream user deleted", response));
});

// Get Stream user token.
export const getStreamUserToken = functions.handler.https.onCall((data, context) => {
  // Checking that the user is authenticated.
  if (!context.auth) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be called while authenticated.",
    );
  } else {
    try {
      return serverClient.createToken(context.auth.uid);
    } catch (err) {
      console.error(`Unable to get user token with ID ${context.auth.uid} on Stream. Error ${err}`);
      // Throwing an HttpsError so that the client gets the error details.
      throw new functions.https.HttpsError("aborted", "Could not get Stream user");
    }
  }
});

// Revoke the authenticated user's Stream chat token.
export const revokeStreamUserToken = functions.handler.https.onCall((data, context) => {
  // Checking that the user is authenticated.
  if (!context.auth) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be called while authenticated.",
    );
  } else {
    try {
      return serverClient.revokeUserToken(context.auth.uid);
    } catch (err) {
      console.error(
        `Unable to revoke user token with ID ${context.auth.uid} on Stream. Error ${err}`,
      );
      // Throwing an HttpsError so that the client gets the error details.
      throw new functions.https.HttpsError("aborted", "Could not get Stream user");
    }
  }
});
