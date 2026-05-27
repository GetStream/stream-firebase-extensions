# Running tests

```bash
npm test
```

Use Node.js 20 when running the test suite locally. The repo includes a top-level `.nvmrc` to keep the extension packages, CI, and emulator runs aligned on the same runtime.

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
LOCATION=europe-west1
STREAM_API_KEY=
```

### extensions/auth-chat.secret.local

```env
STREAM_API_SECRET=
```
