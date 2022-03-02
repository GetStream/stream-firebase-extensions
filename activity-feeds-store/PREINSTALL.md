Use this extension to automatically create activity feeds from data in a Firestore Collection.

This extension listens for Firestore write events and synchronizes corresponding activities in Stream Activity Feeds. The Firestore documents are expected to be stored with the following path, where `feeds` is customizable via the `COLLECTION` parameter:

```http
feeds/{feedId}/{userId}/{foreignId}
```

The stored documents must have at least to follow fields:

- `actor`: the actor performing the activity
- `verb`: the verb of the activity
- `object`: the object of the activity

For more details, see the [Stream Activity Feeds documentation](https://getstream.io/activity-feeds/docs/node/adding_activities).

#### Additional setup

Before installing this extension, make sure that you've [set up a Cloud Firestore database](https://firebase.google.com/docs/firestore/quickstart) in your Firebase project.

You must also have a Stream Activity Feeds app set up before installing this extension. You can do so on the [Stream](https://getstream.io/) site.

#### Billing

This extension uses the following Firebase services which may have associated charges:

- Cloud Functions

This extension also uses the following third-party services:

- Stream Activity Feeds ([pricing information](https://getstream.io/activity-feeds/pricing/))

You are responsible for any costs associated with your use of these services.

#### Note from Firebase

To install this extension, your Firebase project must be on the Blaze (pay-as-you-go) plan. You will only be charged for the resources you use. Most Firebase services offer a free tier for low-volume use. [Learn more about Firebase billing.](https://firebase.google.com/pricing)

You will be billed a small amount (typically less than $0.10) when you install or reconfigure this extension. See Cloud Functions under [Firebase Pricing](https://firebase.google.com/pricing) for a detailed explanation.
