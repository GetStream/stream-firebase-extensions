# Authenticate with Stream Feeds using Firebase Auth

**Author**: Stream (**[https://getstream.io/](https://getstream.io/)**)

**Description**: Authenticates and syncs your users between Firebase Authentication and Stream Feeds.

**Details**: Use this extension to securely generate Stream Activity Feeds user tokens using Firebase Authentication.

This extension listens for Firebase Authentication user creation and deletion events and synchronizes corresponding users in Stream Activity Feeds. You can then use the included Firebase Function to generate authentication tokens valid for using the Activity Feeds API or SDKs.

---

## 🧩 How to Install This Extension

### Using the Firebase Console

To install and manage extensions, you can use the Firebase console.

[![Install using console](https://www.gstatic.com/mobilesdk/210513_mobilesdk/install-extension.png "Install using console")][install-link]

[install-link]: https://console.firebase.google.com/project/_/extensions/install?ref=stream/auth-activity-feeds

### Using the Firebase CLI

To install and manage extensions, you can also use the Firebase CLI:

**Step 1**: Run the following npm command to install the CLI or update to the latest CLI version:

```bash
npm install -g firebase-tools
```

**Step 2**: Install this extension by running the following command:

```bash
firebase ext:install stream/auth-activity-feeds --project=[your-project-id]
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

## How to Use This Extension

Use this extension to sync a Stream Feeds project to Firebase Authentication.

Syncing your Stream Feeds project to Firebase Authentication gives you server-side access to pre-configured [Firebase Cloud Functions](https://firebase.google.com/docs/functions), enabling you to use any of the following Firebase Authentication SDK sign-in methods in your app:

- Email and password-based authentication
- Federated identity provider integrations (Google, Apple, Facebook, Twitter, GitHub)
- Phone number authentication
- Custom auth system integrations
- Anonymous auth

### Additional Setup

Before installing this extension, [set up Firebase Authentication](https://firebase.google.com/docs/auth) in your Firebase project.

When configuring this extension, you must also set up a [Stream account](https://getstream.io/try-for-free/) or use an existing account and provide your **Stream API Key** and **Secret**.

### Billing

This extension uses the following Firebase services, which may have associated charges:

- Cloud Functions

This extension also uses the following third-party services:

- Stream Activity Feeds ([pricing information](https://getstream.io/activity-feeds/pricing/))

You are responsible for any costs associated with your use of these services.

### Note from Firebase

To install this extension, your Firebase project must be on the Blaze (pay-as-you-go) plan. You will only be charged for the resources you use. Most Firebase services offer a free tier for low-volume use. [Learn more about Firebase billing.](https://firebase.google.com/pricing)

You will be billed a small amount (typically less than $0.10) when you install or reconfigure this extension. See Cloud Functions under [Firebase Pricing](https://firebase.google.com/pricing) for a detailed explanation.
