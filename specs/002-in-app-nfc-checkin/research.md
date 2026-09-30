# Research: Platform-Neutral QR Check-in

## Decision

Use `wx.scanCode` from an explicit button on the check-in page for Android, HarmonyOS, and iOS. Parse the returned plain text locally and compare it with the static QR inventory and current local station.

## Rationale

One camera-based path avoids NFC API, UID, NDEF, and platform compatibility differences. It also keeps the existing pure frontend and device-local activity model.

## Rejected Alternatives

- NFC UID validation: removed because it requires platform-specific hardware behavior and adds no value when every point can display a QR.
- NDEF text validation: removed because the active app does not need to read tags, and public text is copyable.
- Point-only acceptance: rejected because it would allow any text or button path to advance the route.
- WeChat home scanner launch: rejected because plain-text activity QRs do not provide an in-app check-in callback.

## Limitations

Static QR contents can be photographed, copied, and replayed. Device-local progress can be reset or lost. This remains suitable only for the stated low-risk activity.
