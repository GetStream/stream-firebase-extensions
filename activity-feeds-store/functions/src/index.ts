import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { DocumentSnapshot } from "firebase-functions/v1/firestore";
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
      "Couldn't parse feedId. Expects something like feeds/{feedId}/{userId}/{foreignId}",
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
    functions.logger.warn("Document isn't a valid activity. Skipping.");
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
    // expects something like feeds/{feedId}/{userId}/{foreignId}

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
