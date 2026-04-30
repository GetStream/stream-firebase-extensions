## Version 0.2.6

- Add Node v22 engine enforcement to the integration test package
- Keep CI, local package validation, and emulator coverage aligned with the `nodejs22` release

## Version 0.2.5

- Update all extension runtimes and package engines to Node v22
- Keep the extension on `firebase-functions/v1`, because Firebase Extensions still treats these Auth and callable triggers as 1st-gen only
- Align CI and local development on Node v22

## Version 0.2.4

- Ensure all cloud functions run on Node v18
- Newer Node version (specifically v22) lead to integration issues

## Version 0.2.3

- Update to Node v22

## Version 0.2.2

Make STREAM_API_KEY parameter a secret

## Version 0.2.1

- Update to Node v20
- Update dependencies

## Version 0.2.0

- Use Node v16
- Set custom fields correctly when no override provided
- Update dependencies

## Version 0.1.3

Update firebase-functions dependency to fix toJSON bug.

## Version 0.1.2

Add prepare scripts for production installations.

## Version 0.1.1

Copy updates.

## Version 0.0.3

New display name.

## Version 0.0.2

Fixed issue where returning Stream's response would attempt cyclic serialization.

## Version 0.0.1

Initial release of the _Stream Activity Feeds Auth_ extension.
