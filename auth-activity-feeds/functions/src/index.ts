import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import * as stream from "getstream";

admin.initializeApp();

const serverClient = stream.connect(process.env.STREAM_API_KEY!, process.env.STREAM_API_SECRET!);

// When a user is created in Firebase an associated Stream account is also created.
export const createStreamUser = functions.handler.auth.user.onCreate(async (user) => {
  functions.logger.log("Firebase user created", user);
  // Create user using the serverClient.
  const response = await serverClient.user(user.uid).create({
    ...(user.displayName && { [process.env.NAME_FIELD!]: user.displayName }),
    ...(user.email && { [process.env.EMAIL_FIELD!]: user.email }),
    ...(user.photoURL && { [process.env.IMAGE_FIELD!]: user.photoURL }),
  });
  functions.logger.log("Stream user created", response.id, response.data);
});

// When a user is deleted from Firebase their associated Stream account is also deleted.
export const deleteStreamUser = functions.handler.auth.user.onDelete(async (user) => {
  functions.logger.log("Firebase user deleted", user);
  const response = await serverClient.user(user.uid).delete();
  functions.logger.log("Stream user deleted", response);
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
      return serverClient.createUserToken(context.auth.uid);
    } catch (err) {
      console.error(`Unable to get user token with ID ${context.auth.uid} on Stream. Error ${err}`);
      // Throwing an HttpsError so that the client gets the error details.
      throw new functions.https.HttpsError("aborted", "Could not get Stream user");
    }
  }
});
