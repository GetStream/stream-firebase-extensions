import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";
import * as stream from "getstream";

admin.initializeApp();

const serverClient = stream.connect(process.env.STREAM_API_KEY!, process.env.STREAM_API_SECRET!);

// When a user is created in Firebase an associated Stream account is also created.
export const createStreamUser = functions.auth.user().onCreate(async (user) => {
  functions.logger.log("Firebase user created", user);
  // Create user using the serverClient.
  const nameField = process.env.NAME_FIELD ?? "name";
  const emailField = process.env.EMAIL_FIELD ?? "email";
  const imageField = process.env.IMAGE_FIELD ?? "profileImage";
  const response = await serverClient.user(user.uid).create({
    ...(user.displayName && { [nameField]: user.displayName }),
    ...(user.email && { [emailField]: user.email }),
    ...(user.photoURL && { [imageField]: user.photoURL }),
  });
  functions.logger.log("Stream user created", response.id, response.data);
});

// When a user is deleted from Firebase their associated Stream account is also deleted.
export const deleteStreamUser = functions.auth.user().onDelete(async (user) => {
  functions.logger.log("Firebase user deleted", user);
  const response = await serverClient.user(user.uid).delete();
  functions.logger.log("Stream user deleted", response);
});

// Get Stream user token.
export const getStreamUserToken = functions.https.onCall((data, context) => {
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
