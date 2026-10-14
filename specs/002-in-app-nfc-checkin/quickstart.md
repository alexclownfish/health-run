# Validation Quickstart: Platform-Neutral QR Check-in

## Preparation

- Upload the latest build using the real AppID and select it as the experience version.
- Print the five exact payloads in `specs/004-start-finish-qr-timing/qr-payloads.md` as ordinary text QR codes.
- Current printing content includes the exact Chinese guidance line followed by the original HRQ1 line. Upload the compatible mini-program first, then replace signs; the old build rejects new guided codes. The new build accepts both old and new codes. See [guidance release checks](../008-qr-usage-guidance/quickstart.md).
- Prepare representative Android, HarmonyOS, and iOS phones.
- Use the same tests on each device; no NFC setting or tag is required.

## Success

1. Open the mini-program normally and scan the start QR from the route page.
2. Confirm the button says `扫码打卡` and camera does not start automatically.
3. Scan the current task-point QR and confirm one `LOCAL_QR_MATCH` check-in and one action-page transition.
4. Complete the action, save the local photo, and proceed through all three points.
5. Scan the finish QR only after point 003; confirm the fixed completion time and duration certificate.

## Failure and Lifecycle

Scan another point, an ordinary URL, malformed text, an unregistered QR, and an old `HR1` label text. Each must reject without a check-in. Cancel the scanner and deny camera permission; both must expose recovery. Verify native scanner hide/show, duplicate callbacks, page unload, and returning from background. Completed points and photos from older builds must remain available.

## Release

Confirm installed QR readability and the full action/photo/certificate flow on each target platform. Test local validation offline after the mini-program package is available. Use the in-app button: WeChat home `扫一扫` cannot trigger check-in from these plain-text codes.

Physical device checks remain pending until performed. No UID, NDEF, tag-locking, or HarmonyOS NFC whitelist verification is required.
