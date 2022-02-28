import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import * as stream from "getstream";
import { Activity } from "getstream";

admin.initializeApp();

const serverClient = stream.connect(
  functions.config().stream.key,
  functions.config().stream.secret,
);

// const serverClient = stream.connect(process.env.STREAM_API_KEY!, process.env.STREAM_API_SECRET!);

/**
 * Determine if document is a Stream activity
 * @param {admin.firestore.DocumentData} payload Document to test
 * @return {boolean} Type predicate
 */
function isActivity(payload?: admin.firestore.DocumentData): payload is Activity {
  return (
    !!payload &&
    typeof payload.actor === "string" &&
    typeof payload.verb === "string" &&
    typeof payload.object === "string" &&
    typeof payload.foreign_id === "string"
  );
}

// When a user is created in Firebase an associated Stream account is also created.
export const writeFirestore = functions.firestore
  .document("feeds/{feedId}/{userId}/{foreignId}")
  .onWrite(async (change, context) => {
    if (!change.after.exists) {
      // Delete

      const feed = serverClient.feed(context.params.feedId, context.params.userId);
      const deletedActivity = {
        ...change.before.data(),
        ...{ foreign_id: context.params.foreignId },
      };
      if (!isActivity(deletedActivity)) {
        functions.logger.warn("Document is not a valid Activity and cannot be deleted. Ignoring.");
        return;
      }
      const response = await feed.removeActivity(deletedActivity);
      functions.logger.log("Stream activity deleted", deletedActivity.foreign_id, response);
      return;
    }

    const feed = serverClient.feed(context.params.feedId, context.params.userId);

    const data = change.after.data();
    const activity = {
      ...data,
      ...{ time: change.after.createTime?.toDate().toISOString() },
      ...{ foreign_id: context.params.foreignId },
    };
    if (!isActivity(activity)) {
      functions.logger.warn("Document isn't a valid activity. Skipping.");
      return;
    }

    if (change.before.exists) {
      // Update
      try {
        const response = await serverClient.updateActivity(activity);
        functions.logger.log("Stream activity updated", activity, response);
      } catch (e) {
        functions.logger.log("Failed to update activity", activity, e);
      }
    } else {
      // Create
      try {
        const response = await feed.addActivity(activity);
        functions.logger.log("Stream activity created", activity, response);
      } catch (e) {
        functions.logger.log("Failed to create activity", activity, e);
      }
    }
  });
