# Authenticate with Stream Chat using Firebase Authentication

**Author**: Stream (**[https://getstream.io/](https://getstream.io/)**)

**Description**: Synchronize your Firebase Authentication user records with Stream Chat and authenticate with Stream Chat using Firebase.

**Details**: Use this extension to securely generate Stream Chat user tokens using Firebase Authentication.

---

## 🧩 How to Install This Extension

### Using the Firebase Console

To install and manage extensions, you can use the Firebase console.

[![Install using console](https://www.gstatic.com/mobilesdk/210513_mobilesdk/install-extension.png "Install using console")][install-link]

[install-link]: https://console.firebase.google.com/project/_/extensions/install?ref=stream/auth-chat

### Using the Firebase CLI

To install and manage extensions, you can also use the Firebase CLI:

**Step 1**: Run the following npm command to install the CLI or update to the latest CLI version:

```bash
npm install -g firebase-tools
```

**Step 2**: Install this extension by running the following command:

```bash
firebase ext:install stream/auth-chat --project=[your-project-id]
```

> Learn more about installing extensions in the Firebase Extensions documentation:
> [console](https://firebase.google.com/docs/extensions/install-extensions?platform=console),
> [CLI](https://firebase.google.com/docs/extensions/install-extensions?platform=cli)

## Configuration Parameters

- Cloud Functions location: Where do you want to deploy the functions created for this extension? For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).
- API key for the Stream API: What is your Stream API key?
- API secret for the Stream API: What is your Stream API secret?

---

## How to Use This Extension

With this extension, you can use Firebase Auth to handle Stream Chat user authentication.

By using Firebase Auth, you can use any of the following Firebase Authentication SDK sign-in methods with Stream Chat:

- Email and password-based authentication
- Federated identity provider integrations (Google, Apple, Facebook, Twitter, GitHub)
- Phone number authentication
- Custom auth system integrations
- Anonymous auth

### Additional Setup

Before installing this extension, set up Firebase Authentication in your Firebase project.
You must also set up a Stream Chat app before installing this extension—you can do so on the Stream site.

### Billing

This extension uses the following Firebase services, which may have associated charges:

- Cloud Functions
- Secret Manager
- Firebase Authentication

This extension also uses the following third-party services:

- Stream Activity Feeds ([pricing information](https://getstream.io/activity-feeds/pricing/))

You are responsible for any costs associated with your use of these services.

### Note from Firebase

Your Firebase project must be on the Blaze (pay-as-you-go) plan to install the extension. You will only be charged for the resources you use. Most Firebase services offer a free tier for low-volume use. [Learn more about Firebase billing.](https://firebase.google.com/pricing)

When installing or reconfiguring this extension, you will be billed a small amount (typically less than $0.10). See Cloud Functions under [Firebase Pricing](https://firebase.google.com/pricing) for a detailed explanation.
