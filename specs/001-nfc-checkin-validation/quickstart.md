# Validation Quickstart: Frontend-only NFC Check-in

## Prerequisites

- WeChat hardware onboarding and NFC tag launch capability approved.
- Released test version containing `pages/checkin/checkin`.
- Final packaged tag configuration for primary and optional spare labels.
- ACR122U writer/read-back tooling.
- Two Android phones, one HarmonyOS phone, and two iPhones XS or newer.

## 1. Provisioning Reconciliation

1. Generate one approved NFC Scheme per packaged tag definition.
2. Write URI record first and `com.tencent.mm` AAR second.
3. Read back point, tag token, payload version, record order, and UID.
4. Confirm all values exactly match `nfc-tags.js` and the provisioning manifest.
5. Test normal and anti-metal labels on their final surfaces.

Expected: every installed tag has one matching packaged definition.

## 2. Android Validation

For each device:

1. Touch every primary and packaged spare tag.
2. Confirm correct page and point open within 8 seconds.
3. Confirm matching UID produces `LOCAL_UID_MATCH`.
4. Use a valid Scheme on a tag with another UID and confirm `UID_MISMATCH`.
5. Disable NFC and confirm no local progress is written.
6. Trigger repeated callbacks and confirm one transition.
7. Open a future point and confirm existing point order blocks it.

## 3. iOS Validation

1. Touch every tag and confirm the system notification.
2. Tap it and confirm correct point opens.
3. Confirm result is `LOCAL_LINK_MATCH`, not UID-matched.
4. Confirm no UID waiting state is displayed.
5. Change tag token in the link and confirm `TAG_UNKNOWN`.

## 4. HarmonyOS Validation

1. Record model, OS, WeChat, and app version.
2. Determine whether the runtime returns usable UID for NTAG215.
3. If packaged as strict, require UID match.
4. If packaged as compatible, confirm result is `LOCAL_LINK_COMPAT`.
5. Confirm unknown devices do not automatically receive compatibility success.

## 5. Lifecycle and Storage

- Hide/unload during scan: no late navigation.
- Timeout then retry: first listeners are removed before retry.
- Clear local storage: progress resets as documented.
- Offline after the mini-program is available: no custom runtime backend request occurs.
- Production build: `allowNfcSkip` is `false`.

## 6. Existing Workflow Regression

After accepted local validation:

1. Correct action page opens.
2. Local 20-minute check-in expiry works.
3. Action timing remains required.
4. Photo remains required before next point unlocks.
5. Certificate and records remain correct.

## Release Gate

Release only after all tags, packaged spares, final surfaces, and devices pass. Re-test the exact released build
before locking tags. Operators must acknowledge that tag replacement or configuration changes can require a new
mini-program release.
