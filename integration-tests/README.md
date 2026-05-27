# Running tests

```bash
npm test
```

Use Node.js 20 when running the test suite locally. The repo includes a top-level `.nvmrc` to keep the extension packages, CI, and emulator runs aligned on the same runtime.

Auth integration tests start the **Extensions** emulator (`--only auth,functions,extensions`) so Stream API credentials from `extensions/*.env.local` are passed into extension functions. Callable tests must target `ext-auth-chat-getStreamUserToken` (region = `LOCATION` in env files).

## Locally

You'll need the following files to set the right environment variables.

These files are generated automatically in CI using repository secrets.

### extensions/auth-activity-feeds.env.local

```env
LOCATION=
STREAM_API_KEY=
```

### extensions/auth-activity-feeds.secret.local

```env
STREAM_API_SECRET=
```

### extensions/auth-chat.env.local

```env
LOCATION=us-central1
STREAM_API_KEY=
```

### extensions/auth-chat.secret.local

```env
STREAM_API_SECRET=
```
