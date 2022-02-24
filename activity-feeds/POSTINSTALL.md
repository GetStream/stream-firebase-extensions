### See it in action

You can test out this extension right away!

1. Go to your [Authentication dashboard](https://console.firebase.google.com/project/${param:PROJECT_ID}/authentication/users) in the Firebase console.

1. Click **Add User** to add a test user, then make note of the test user's UID.

1. Go to the [Stream Dashboard](https://getstream.io/dashboard), select your app and navigate to the Activity Feeds Explorer. You should see a new user created with the correct UID noted earlier.

1. Go back to your [Authentication dashboard](https://console.firebase.google.com/project/${param:PROJECT_ID}/authentication/users), then delete the test user.

1. In a few seconds, the new user you added above will be deleted from Stream, and can be verified in the Activity Feeds Exporer.

### Using the extension

When a user's account is created or deleted from your project's authenticated users, this extension automatically creates or deletes a corresponding user from Stream Activity Feeds.

You can created or delete a user directly in your [Authentication dashboard](<(https://console.firebase.google.com/project/${param:PROJECT_ID}/authentication/users)>) or by using one of the Firebase Authentication SDKs. Learn more in the [Authentication documentation](https://firebase.google.com/docs/auth).

You can also use the `${function:getStreamUserToken.name}` Firebase Function to generate authentication tokens suitable for use with the Activity Feeds API or SDKs.

### Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.
