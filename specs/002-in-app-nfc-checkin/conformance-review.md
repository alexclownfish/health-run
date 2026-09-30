# Code Conformance Review: Platform-Neutral QR Check-in

**Review date**: 2026-09-30

**Reviewed against**: `spec.md`, `plan.md`, and `contracts/ios-qr-validation.md`.

## Verdict

Implemented in source. All platforms share `wx.scanCode`, exact packaged payload matching, and current local point validation. No device-type check or NFC whitelist gates the page. Existing QR payloads are unchanged.

## Verification

- Automated tests cover QR parsing, inventory matching, point order, cancellation, permission denial, scanner hide/show, local progress, and existing activity pages.
- Runtime platform detection, NFC callbacks, and UID matching are no longer used.
- QR tokens are not persisted in check-in records.
- Native scanner temporary hide preserves the attempt; unloading or explicitly leaving invalidates callbacks.
- Completed historical points and saved photos remain in the existing storage key.

## Remaining Physical Checks

1. Upload and select the latest experience version.
2. On representative Android, HarmonyOS, and iOS phones, test the current QR, wrong point, cancel, permission denial, and return from native scanner.
3. Print the exact three payloads from `qr-tags.js` and confirm readability at each installed point.

Automated checks do not replace real-device verification. NTAG215 UIDs retained in the old provisioning manifest are historical data and impose no release requirement.
