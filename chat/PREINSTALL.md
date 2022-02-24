Use this extension to securely generate Stream Chat user tokens using Firebase Authentication.

This extension listens for Firebase Authentication user creation and deletion events and synchronizes corresponding users in Stream Chat. You can then use the included Firebase Functions to generate and revoke authentication tokens valid for using the Chat API or SDKs.

#### Additional setup

Before installing this extension, make sure that you've [set up Firebase Authentication](https://firebase.google.com/docs/auth) in your Firebase project.

You must also have a Stream Chat app set up before installing this extension. You can do so on the [Stream](https://getstream.io/) site.

#### Billing

This extension uses the following Firebase services which may have associated charges:

- Cloud Functions

This extension also uses the following third-party services:

- Stream Chat ([pricing information](https://getstream.io/chat/pricing/))

You are responsible for any costs associated with your use of these services.

#### Note from Firebase

To install this extension, your Firebase project must be on the Blaze (pay-as-you-go) plan. You will only be charged for the resources you use. Most Firebase services offer a free tier for low-volume use. [Learn more about Firebase billing.](https://firebase.google.com/pricing)

You will be billed a small amount (typically less than $0.10) when you install or reconfigure this extension. See Cloud Functions under [Firebase Pricing](https://firebase.google.com/pricing) for a detailed explanation.
