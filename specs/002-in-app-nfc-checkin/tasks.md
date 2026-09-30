---

description: "Implementation tasks for platform-neutral QR check-in"
---

# Tasks: Platform-Neutral QR Check-in

**Input**: Design documents from `/specs/002-in-app-nfc-checkin/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Automated tests are required for QR parsing, current-point enforcement, lifecycle cleanup, progress metadata, and page wiring. Physical-device checks remain release gates.

Phases 1-9 below are retained as historical implementation traceability for the superseded NFC/QR mixed design. Phase 10 is the active product migration.

## Phase 10: Platform-Neutral QR Migration

- [x] T031 Remove runtime NFC discovery, platform detection, HarmonyOS gating, and UID inventory requirements from the check-in page
- [x] T032 Make all platforms use the same `wx.scanCode` flow and QR validation contract
- [x] T033 Update README and active Spec Kit documents to remove NFC-specific release instructions while retaining historical specs for traceability
- [x] T034 Update automated checks to require one platform-neutral QR action and verify no runtime NFC dependency remains
- [x] T035 Update downstream action, route, profile, and records copy to describe QR-only check-in
- [x] T036 Remove unused NFC runtime modules and NFC discovery fixtures from the active source tree

## Phase 1: Setup and Baseline

- [x] T001 Run the existing test suite and record the old Scheme behavior baseline in `specs/002-in-app-nfc-checkin/tasks.md`
- [x] T002 [P] Add the new QR modules to JavaScript parsing and structural coverage in `tests/run-tests.js`

---

## Phase 2: Foundational Validation

- [x] T003 [P] Replace Scheme-oriented NFC inventory fields with unique UID, station, material, spare, and NDEF metadata in `miniprogram/utils/nfc-tags.js`
- [x] T004 [P] Add packaged point QR definitions with unique IDs and tokens in `miniprogram/utils/qr-tags.js`
- [x] T005 Add failing tests for global UID resolution, duplicate UIDs, wrong points, Android policy, approved HarmonyOS policy, and rejected unknown HarmonyOS models in `tests/run-tests.js`
- [x] T006 Add failing tests for exact `HRQ1` QR parsing, inventory matching, malformed values, unknown values, duplicate configuration, and wrong points in `tests/run-tests.js`
- [x] T007 Implement UID-first validation and fail-closed platform policy in `miniprogram/utils/nfc-validation.js`
- [x] T008 Implement pure QR parsing and current-point validation in `miniprogram/utils/qr-validation.js`

**Checkpoint**: NFC and QR evidence can be validated without page code or a backend.

---

## Phase 3: User Story 1 - Explicit Android/HarmonyOS NFC (Priority: P1)

**Goal**: User opens the current check-in page and explicitly starts one UID-based NFC attempt.

**Independent Test**: On an Android fixture, scanning the registered current-point UID succeeds once; missing, unknown, duplicate, wrong-point, disabled, timeout, and cancelled attempts preserve progress.

- [x] T009 [US1] Add page-flow source tests for idle state, explicit NFC action, current progress authority, lifecycle cleanup, and single navigation in `tests/run-tests.js`
- [x] T010 [US1] Replace query-driven initialization with current-station and platform initialization in `miniprogram/pages/checkin/checkin.js`
- [x] T011 [US1] Add explicit idle, scanning, accepted, retry, unsupported, and route actions in `miniprogram/pages/checkin/checkin.wxml`
- [x] T012 [US1] Adjust check-in action and platform-state styling in `miniprogram/pages/checkin/checkin.wxss`

---

## Phase 4: User Story 2 - Fail-closed Platform and Lifecycle Handling (Priority: P1)

**Goal**: Unsupported and interrupted NFC attempts never become successful check-ins.

**Independent Test**: Unknown platforms and unapproved HarmonyOS models reject; hide/unload, timeout, repeated callbacks, and retry produce at most one terminal transition.

- [x] T013 [US2] Extend NFC session tests for platform rejection and retain idempotent cleanup coverage in `tests/run-tests.js`
- [x] T014 [US2] Integrate approved-Harmony gating and reason-specific recovery messages in `miniprogram/pages/checkin/checkin.js`
- [x] T015 [US2] Verify `miniprogram/utils/nfc.js` remains cancellable and normalize any newly required error mapping without weakening failure behavior

---

## Phase 5: User Story 3 - iOS QR Check-in (Priority: P1)

**Goal**: iOS scans a packaged current-point QR and never enters the NFC path.

**Independent Test**: Current QR succeeds as `LOCAL_QR_MATCH`; cancellation, camera denial, malformed, unknown, duplicate, ordinary URL, and wrong-point inputs do not change progress.

- [x] T016 [US3] Add page-flow tests for `wx.scanCode`, iOS-only QR action, result validation, cancellation, and absence of iOS NFC success in `tests/run-tests.js`
- [x] T017 [US3] Integrate iOS QR scanning and stable QR error states in `miniprogram/pages/checkin/checkin.js`
- [x] T018 [US3] Render the iOS `扫码打卡` state and QR-specific messages in `miniprogram/pages/checkin/checkin.wxml`

---

## Phase 6: User Story 4 - Existing Local Workflow (Priority: P1)

**Goal**: NFC and QR successes share the existing ordered local action/photo/certificate flow.

**Independent Test**: Both assurance types create one current-point check-in with minimized evidence and preserve the 20-minute action gate.

- [x] T019 [US4] Add progress tests for `LOCAL_UID_MATCH`, `LOCAL_QR_MATCH`, minimized marker IDs, duplicate protection, and current-point enforcement in `tests/run-tests.js`
- [x] T020 [US4] Extend local check-in metadata for QR evidence without persisting QR tokens in `miniprogram/utils/progress.js`
- [x] T021 [US4] Route both accepted result types through one progress and navigation transition in `miniprogram/pages/checkin/checkin.js`

---

## Phase 7: User Story 5 - Combined Point Sign and Entry UX (Priority: P2)

**Goal**: Route UI opens the check-in page normally and field signs support NFC plus QR without automatic launch.

**Independent Test**: Current route actions navigate to the check-in page, no UI promises automatic launch, and provisioning docs specify one non-launch NDEF record plus a matching QR.

- [x] T022 [US5] Replace the route NFC waiting sheet with normal current-point navigation in `miniprogram/pages/route/route.js`
- [x] T023 [US5] Replace automatic-launch copy and remove the obsolete waiting sheet in `miniprogram/pages/route/route.wxml`
- [x] T024 [US5] Remove obsolete route-sheet styles in `miniprogram/pages/route/route.wxss`
- [x] T025 [US5] Replace Scheme/AAR instructions with UID, NDEF Text, QR, and physical validation instructions in `README.md`

---

## Phase 8: Verification and Spec Closure

- [x] T026 Run the complete automated suite and JavaScript syntax checks through the bundled Node runtime
- [x] T027 Confirm no runtime Scheme query, AAR, `LOCAL_LINK_MATCH`, `LOCAL_LINK_COMPAT`, or iOS NFC-success path remains in `miniprogram/` and `tests/`
- [x] T028 Update `specs/002-in-app-nfc-checkin/conformance-review.md` with the implemented state and remaining real-UID/physical-device release gates
- [x] T029 Mark completed tasks and record the automated test result in `specs/002-in-app-nfc-checkin/tasks.md`

---

## Phase 9: iOS Native Scanner Lifecycle Hotfix

- [x] T030 Preserve an active `wx.scanCode` attempt across the temporary page hide caused by the native iOS scanner, reject callbacks after unload, and add a page-flow regression test in `tests/run-tests.js`

## Dependencies and Execution Order

- Phase 1 establishes the old-behavior baseline.
- Phase 2 blocks all page work because both platform paths depend on pure validation contracts.
- Phases 3 and 4 implement the NFC path and lifecycle.
- Phase 5 adds iOS QR using the same current-station authority.
- Phase 6 joins both paths to existing local progress.
- Phase 7 changes user entry and operator documentation.
- Phase 8 is the final automated and specification gate.
- Phase 10 supersedes Phases 3-5 for the active product flow; those phases remain historical implementation records.

## Implementation Strategy

1. Keep the packaged QR inventory and validation contract as the single point authority.
2. Make the check-in page invoke only the explicit QR action.
3. Keep the existing local progress, action, photo, records, and certificate flow.
4. Remove NFC hardware and UID release gates from the active workflow.
5. Run automated checks and verify the released build on each target platform.

## Baseline Result

- Before `002` implementation: 27 automated checks passed, all against the superseded Scheme/link architecture.
- After `002` implementation: 28 automated checks passed against manual NFC, approved HarmonyOS, iOS QR, local progress, and existing workflow contracts.
- After the iOS native scanner lifecycle hotfix: 29 automated checks passed, including `startQrScan -> onHide -> success`.
- After the platform-neutral QR migration: the active flow has one QR path for Android, HarmonyOS, and iOS; NFC UID entries are retained only as historical provisioning data.
- Current automated result: all 23 checks pass.
