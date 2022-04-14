# Create Activity Feeds with Stream Feeds

**Author**: Stream (**[https://getstream.io/](https://getstream.io/)**)

**Description**: Syncs a Firestore collection with Stream Feeds to add real-time engagement to your application.

**Details**: Use this extension to automatically create Activity Feeds from data in a Firestore collection.

The extension listens for Firestore write events and synchronizes corresponding activities in Stream’s Activity Feeds. The Firestore documents are expected to be stored with the following path, where `feeds` is customizable via the `COLLECTION` parameter:

```http
feeds/{feedId}/{userId}/{foreignId}
```

The stored documents must have at least the following fields:

- `actor`: the entity performing the activity
- `verb`: the type of action performed on the activity
- `object`: he content of the activity itself (often a reference)

For more details, see the [Stream Activity Feeds documentation](https://getstream.io/activity-feeds/docs/node/adding_activities).

---

## 🧩 How to Install This Extension

### Using the Firebase Console

To install and manage extensions, you can use the Firebase console.

[![Install using console](https://www.gstatic.com/mobilesdk/210513_mobilesdk/install-extension.png "Install using console")][install-link]

[install-link]: https://console.firebase.google.com/project/_/extensions/install?ref=stream/stream-activity-feeds-store

### Using the Firebase CLI

To install and manage extensions, you can also use the Firebase CLI:

**Step 1**: Run the following npm command to install the CLI or update to the latest CLI version:

```bash
npm install -g firebase-tools
```

**Step 2**: Install this extension by running the following command:

```bash
firebase ext:install stream/stream-activity-feeds-store --project=[your-project-id]
```

> Learn more about installing extensions in the Firebase Extensions documentation:
> [console](https://firebase.google.com/docs/extensions/install-extensions?platform=console),
> [CLI](https://firebase.google.com/docs/extensions/install-extensions?platform=cli)

## Configuration Parameters

- Cloud Functions location: Where do you want to deploy the functions created for this extension? For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).
- API key for the Stream API: What is your Stream API key?
- API secret for the Stream API: What is your Stream API secret?
- Display name field: In which field of the Activity Feed User object should the Firebase user's display name be saved?
- Email field: In which field of the Activity Feed User object should the Firebase user's email be saved?
- Profile image field: In which field of the Activity Feed User object should the Firebase user's profile image be saved?

---

## Additional Setup

Before installing this extension, make sure that you've [set up a Cloud Firestore database](https://firebase.google.com/docs/firestore/quickstart) in your Firebase project.

You must also have a Stream Activity Feeds app set up before installing this extension. You can do so on the [Stream](https://getstream.io/) site.

## Billing

This extension uses the following Firebase services, which may have associated charges:

- Cloud Functions

This extension also uses the following third-party services:

- Stream Activity Feeds ([pricing information](https://getstream.io/activity-feeds/pricing/))

You are responsible for any costs associated with your use of these services.

## Note from Firebase

To install this extension, your Firebase project must be on the Blaze (pay-as-you-go) plan. You will only be charged for the resources you use. Most Firebase services offer a free tier for low-volume use. [Learn more about Firebase billing.](https://firebase.google.com/pricing)

You will be billed a small amount (typically less than $0.10) when you install or reconfigure this extension. See Cloud Functions under [Firebase Pricing](https://firebase.google.com/pricing) for a detailed explanation.
