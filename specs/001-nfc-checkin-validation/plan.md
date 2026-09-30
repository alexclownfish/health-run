# Implementation Plan: Frontend-only NFC Check-in

**Branch**: `main` | **Date**: 2026-09-26 | **Spec**: [spec.md](spec.md)

## Summary

Add `pages/checkin/checkin` as the official NFC Scheme target. The page validates `point`, `tag`, and payload
version against packaged configuration, reads and compares UID on supported strict paths, records an explicit
local assurance level, and then hands off to the existing local progress state machine. There is no runtime
backend, CloudBase function, custom API, trusted openid, or central check-in database.

## Technical Context

**Language/Version**: Existing native WeChat mini-program JavaScript

**Primary Dependencies**: WeChat NFC Scheme launch, `wx.getNFCAdapter`, existing `utils/nfc.js`,
`utils/progress.js`, and `utils/stations.js`

**Storage**: Existing `wx` local storage only

**Testing**: Existing Node harness, NFC parsing/normalization unit tests, page-flow tests, DevTools checks,
ACR122U read-back, and physical-device matrix

**Target Platform**: Supported Android, tested HarmonyOS, and iPhone XS or newer; Android launch requires
supported WeChat version

**Project Type**: Frontend-only native mini-program

**Performance Goals**: Correct page opens within 8 seconds for 95% of valid supported-device trials; local
validation completes within 1 second after evidence is available

**Constraints**: No runtime network dependency; packaged configuration requires a new release to change;
NTAG215 and static NDEF are replayable; iOS path cannot depend on NTAG215 UID; progress is device-local

**Scale/Scope**: One activity day, 3 points, small fixed tag inventory, no central reporting

## Constitution Check

| Principle | Evidence | Status |
|-----------|----------|--------|
| Platform Truth | Official WeChat NFC Scheme format and physical-device matrix | PASS |
| Explicit Authority Boundaries | Spec explicitly declares local-only, low-risk authority and abandoned capabilities | PASS |
| Fail Closed With Explicit Assurance | UID-strict paths reject missing/mismatched UID; iOS link path is labeled separately | PASS |
| Testable State Transitions | Deterministic local result codes and lifecycle cleanup tests | PASS |
| Minimal, Reversible Delivery | Extends existing local architecture; tags remain unlocked through pilot | PASS |

Post-design re-check: PASS.

## Recommended Frontend Architecture

### 1. Packaged Tag Configuration

Extend static project configuration with one entry per physical tag:

```js
{
  tagId: 'TAG-001',
  tagToken: 'random-token-value',
  pointCode: '001',
  stationIndex: 0,
  expectedUid: '04A1B2C3D4E5F6',
  payloadVersion: 1,
  uidPolicy: 'required'
}
```

For iOS the same entry is used but `uidPolicy` is resolved to `unavailable-expected`. HarmonyOS uses a tested
device compatibility table or runtime evidence before requiring UID.

### 2. NFC Entry Page

`pages/checkin/checkin` owns these states:

```text
VALIDATING_QUERY
  -> COLLECTING_UID (when required)
  -> VALIDATING_LOCAL
  -> ACCEPTED -> progressStore.checkInStation -> action page
  -> REJECTED -> reason-specific recovery
```

The page does not accept point alone. It requires an exact packaged `point + tag + v` match.

### 3. NFC Utility Boundary

Refactor `utils/nfc.js` later to provide:

- `isSupported()`;
- `discoverOnce(timeout)` returning the raw discovery result;
- canonical UID conversion from `ArrayBuffer`;
- explicit error codes;
- cancellation/cleanup that is safe to call multiple times.

The utility performs device I/O only. Point/tag policy remains in a pure validation module for unit testing.

### 4. Local Assurance Levels

| Level | Evidence | Behavior |
|-------|----------|----------|
| `LOCAL_UID_MATCH` | Packaged point/tag match plus matching UID | Android and verified Harmony strict paths |
| `LOCAL_LINK_MATCH` | Packaged point/tag match; UID unavailable by platform design | iOS NTAG215 path |
| `LOCAL_LINK_COMPAT` | Packaged point/tag match under tested Harmony compatibility | Only explicitly packaged device policy |
| `REJECTED` | Unknown parameters, wrong point/tag, UID failure, or UID mismatch | No progress transition |

These labels describe local evidence only and are not secure audit guarantees.

### 5. Existing Workflow Integration

- Tag Scheme opens the new check-in page directly.
- Accepted result calls the existing `progressStore.checkInStation(stationIndex, source)`.
- Store local metadata: tag ID, assurance, observed time, and normalized UID hint where appropriate.
- `action.js`, `upload.js`, certificate, records, and photo storage remain structurally unchanged.
- `allowNfcSkip` is set to `false` for the production event build.

### 6. Tag Replacement Policy

Without runtime configuration, changing an expected UID requires a new mini-program release. Therefore:

- prepare spare tags before final release;
- package primary and approved spare tag entries for each point when operationally useful;
- do not activate undocumented spare tags;
- test final physical labels before submission/release;
- keep NDEF rewritable until the final released build is verified.

## Project Structure

### Documentation

```text
specs/001-nfc-checkin-validation/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── backend-evaluation.md
├── quickstart.md
├── checklists/requirements.md
└── contracts/
    ├── frontend-validation.md
    └── tag-provisioning.md
```

### Implemented Source Code

```text
miniprogram/
├── pages/checkin/
│   ├── checkin.js
│   ├── checkin.json
│   ├── checkin.wxml
│   └── checkin.wxss
├── utils/
│   ├── nfc.js
│   ├── nfc-validation.js
│   ├── nfc-tags.js
│   └── progress.js
├── app.json
└── utils/config.js

tests/
├── run-tests.js
└── fixtures/nfc-discovery-results.js

tools/                         # optional one-time deployment tooling, not runtime backend
└── generate-nfc-schemes/
```

## Delivery Phases

### Phase A - Platform and Hardware Gate

1. Obtain WeChat NFC tag capability and `model_id`.
2. Confirm NFC Scheme generation policy and create test Schemes outside the mini-program.
3. Acquire normal/anti-metal pilot tags and test devices.

Exit: one test tag opens a released test page on Android and iOS.

### Phase B - Pure Validation Model

1. Define tag configuration, payload version, UID canonical format, and platform policies.
2. Define pure query and discovery-result validation with stable local reason codes.
3. Add fixtures for Android, iOS, HarmonyOS, malformed UID, timeout, and duplicate callback cases.

Exit: all matching and mismatch rules pass without page code.

### Phase C - Check-in Page and Existing Workflow

1. Add check-in page and register it.
2. Add lifecycle-safe NFC discovery and deterministic state rendering.
3. On success, enter existing progress/action flow; on failure, preserve progress.
4. Disable the production skip flag.

Exit: DevTools and automated tests pass without custom network requests.

### Phase D - Provisioning and Final Release

1. Generate final Schemes and provisioning manifest.
2. Write and read back both NDEF records.
3. Reconcile Scheme parameters, packaged config, and UID.
4. Test on final mounting surfaces and supported-device matrix.
5. Release the final build, re-test, then lock approved tags if desired.

Exit: every installed tag passes all success criteria.

## Complexity Tracking

No runtime backend is introduced. The accepted tradeoff is that all validation data and progress are local and
extractable, and any tag inventory change may require a new mini-program release.
