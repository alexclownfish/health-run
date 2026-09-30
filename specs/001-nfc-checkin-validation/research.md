# Research: Frontend-only NFC Check-in

**Date**: 2026-09-26

## Decision 1: Keep Runtime Completely Frontend-only

**Decision**: NFC validation, route progress, actions, photos, records, and certificates remain device-local.

**Rationale**: The activity lasts one day, has low consequences, requires no central identity or report, and
already uses a local workflow. A runtime backend adds network and deployment failure modes without required
business value.

**Alternatives considered**: A one-function CloudBase backend was evaluated but rejected by project decision.
A full backend is disproportionate.

## Decision 2: Use the Official WeChat NFC Scheme

**Decision**: Complete hardware onboarding and NFC capability approval, then generate NFC-specific Schemes for
the released check-in page.

**Rationale**: Runtime can be backend-free, but deployment still needs the official Scheme so Android and iOS
can launch the mini-program through the documented two-record format.

**Primary sources**:

- https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/NFC.html
- https://developers.weixin.qq.com/miniprogram/dev/server/API/qrcode-link/url-scheme/api_generatenfcscheme.html

## Decision 3: Treat Scheme Generation as One-time Tooling

**Decision**: Use a secure local operator script or temporary restricted tool to call the WeChat service API.
Do not place AppSecret, access tokens, or Scheme generation code in the mini-program.

**Rationale**: “Pure frontend runtime” does not make it safe or possible to expose WeChat server credentials.
The generated Scheme is static deployment input written to the tags.

## Decision 4: Package Point and Tag Inventory

**Decision**: Store exact `point + tagToken + payloadVersion + expectedUid/policy` mappings in source-controlled
mini-program configuration.

**Rationale**: Without a backend, local configuration is the only source for tag validation. A tag token adds
accidental-substitution protection but is not secret because it exists in both NDEF and the app package.

**Alternatives considered**: Point alone is too easy to mistype or forge. UID in the Scheme is unnecessary and
does not prove the touched tag.

## Decision 5: Use Platform-specific Local Assurance

**Decision**: Android strict paths require UID match; iOS NTAG215 uses link matching; HarmonyOS follows a tested
compatibility policy.

**Rationale**: WeChat's discovery callback exposes `id`, but iOS only triggers it for ISO-DEP tags, so NTAG215
UID cannot be a dependable iOS requirement.

**Primary source**:

- https://developers.weixin.qq.com/miniprogram/dev/api/device/nfc/NFCAdapter.onDiscovered.html

## Decision 6: Fail Closed on UID-strict Paths

**Decision**: Android or verified Harmony UID timeout, malformed UID, missing UID, and mismatch reject locally.

**Rationale**: Silent fallback would make the advertised UID comparison meaningless and hide device problems.
The iOS link-only path is separate and expected, not an error fallback.

## Decision 7: Accept Local-only Limitations

**Decision**: Do not claim trusted identity, central attendance, remote disable, cross-device recovery, or
tamper-proof evidence.

**Rationale**: Local configuration and storage can be inspected or modified. Clearing data or changing phones
resets progress. These limitations are acceptable only because the event is low-risk.

## Decision 8: Keep NTAG215 as Moderate-assurance Hardware

**Decision**: Continue NTAG215 and describe UID/static NDEF as protection against mistakes and casual misuse,
not cryptographic anti-cloning.

**Primary source**:

- https://www.nxp.com/docs/en/data-sheet/NTAG213_215_216.pdf

## Decision 9: Pre-package Spare Tags

**Decision**: Before final release, optionally package one verified spare tag per point.

**Rationale**: Pure frontend cannot remotely update expected UID. A packaged spare reduces event-day risk without
adding a backend, provided both primary and spare are physically controlled and tested.

## Decision 10: Verify Before Locking

**Decision**: Keep tags rewritable through pilot and released-build verification. Lock only after record order,
Scheme parameters, packaged configuration, UID, and final mounting surface all pass.
