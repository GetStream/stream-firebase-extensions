import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { DocumentSnapshot } from "firebase-functions/v1/firestore";
import * as stream from "getstream";
import { Activity } from "getstream";

admin.initializeApp();

const serverClient = stream.connect(process.env.STREAM_API_KEY!, process.env.STREAM_API_SECRET!);

/**
 * Determine if document is a Stream activity
 * @param {admin.firestore.DocumentData} payload Document to test
 * @return {boolean} Type predicate
 */
function isActivity(payload?: admin.firestore.DocumentData): payload is Activity {
  if (!payload) {
    return false;
  }
  if (typeof payload.actor !== "string") {
    functions.logger.error("Expected 'actor' field.", payload.actor);
    return false;
  }
  if (typeof payload.verb !== "string") {
    functions.logger.error("Expected 'verb' field.", payload.verb);
    return false;
  }
  if (typeof payload.object !== "string") {
    functions.logger.error("Expected 'object' field.", payload.object);
    return false;
  }
  if (typeof payload.foreign_id !== "string") {
    functions.logger.error("Expected 'foreign_id' field.", payload.foreign_id);
    return false;
  }
  return true;
}

type ActivityData = {
  feedId: string;
  userId: string;
  activity: Activity;
};

/**
 * Parse and verify activity data from snapshot
 * @param {DocumentSnapshot} snapshot Document snapshot to parse
 * @return {ActivityData} Feed, user and activity data
 */
function getActivityData(snapshot: DocumentSnapshot): ActivityData | undefined {
  const feedId = snapshot.ref.parent.parent?.id;
  if (!feedId) {
    functions.logger.error(
      `Couldn't parse feedId. Expected ${process.env.COLLECTION}/{feedId}/{userId}/{foreignId}`,
    );
    return;
  }

  const foreignId = snapshot.id;
  const activity = {
    ...snapshot.data,
    ...{ time: snapshot.createTime?.toDate().toISOString() },
    ...{ foreign_id: foreignId },
  };
  if (!isActivity(activity)) {
    functions.logger.warn("Document isn't a valid activity. Skipping.", activity);
    return;
  }

  const userId = snapshot.ref.parent.id;

  return {
    feedId,
    userId,
    activity,
  };
}

// When a user is created in Firebase an associated Stream account is also created.
export const activitiesToFirestore = functions.handler.firestore.document.onWrite(
  async (change) => {
    if (!change.after.exists) {
      // Delete

      const data = getActivityData(change.before);
      if (!data) {
        return;
      }
      const { feedId, userId, activity } = data;

      const feed = serverClient.feed(feedId, userId);
      const response = await feed.removeActivity(activity);
      functions.logger.log("Stream activity deleted", activity.foreign_id, response);
      return;
    }

    const data = getActivityData(change.after);
    if (!data) {
      return;
    }
    const { feedId, userId, activity } = data;
    const feed = serverClient.feed(feedId, userId);

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
  },
);
