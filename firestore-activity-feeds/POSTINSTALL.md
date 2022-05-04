### See it in action

You can test out this extension right away!

1. Go to the [Cloud Firestore tab](https://console.firebase.google.com/project/${param:PROJECT_ID}/database/firestore/data).

1. Create a new document using the document path `${COLLECTION}/{feedId}/{userId}/{foreignId}`:

   1. If it doesn't exist already, create a collection with Collection ID `${param:COLLECTION}`.

   1. If it doesn't exist already, create a document in `${param:COLLECTION}` with a Document ID the same as one of your Stream feed groups. For example, `user`. The document does not require any fields.

   1. If it doesn't exist already, create a subcollection in the feed group document with a Collection ID the same as one of your user's user IDs. For example, `1`.

   1. Create a new document in the subcollection with a Document ID equal to your desired foreign ID. This foreign ID is a unique ID from you application for this activity, e.g. `pin:1` or `like:300`. Add some fields to your document, including at least the required `actor`, `verb` and `object` fields of an activity. Note that the `time` and `foreign_id` fields are not required in the document as they are automatically determined. See the [Stream Activity Feeds documentation](https://getstream.io/activity-feeds/docs/node/adding_activities) for more details.

1. Go to the [Stream Dashboard](https://getstream.io/dashboard), select your app and navigate to the Activity Feeds Explorer. You should see a new activity created which includes the data from the Firestore document.

1. Go back to the [Cloud Firestore tab](https://console.firebase.google.com/project/${param:PROJECT_ID}/database/firestore/data), then update or delete the test activity.

1. In a few seconds, the new activity you added above will be updated or deleted from Stream, and can be verified in the Activity Feeds Exporer.

### Using the extension

When a document is created, updated or deleted from your project's Firestore collection, this extension automatically creates, updates or deletes a corresponding activity from Stream Activity Feeds.

You can created or delete a document directly in the [Cloud Firestore tab](https://console.firebase.google.com/project/${param:PROJECT_ID}/database/firestore/data) or by using one of the Firebase Firestore SDKs. Learn more in the [Firestore documentation](https://firebase.google.com/docs/firestore).

### Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.
