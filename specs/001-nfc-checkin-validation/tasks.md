---

description: "Implementation tasks for frontend-only NFC check-in validation"
---

# Tasks: Frontend-only NFC Check-in

**Input**: Design documents from `/specs/001-nfc-checkin-validation/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Automated tests are required for query validation, UID normalization, lifecycle cleanup, progress integration, and page registration. Physical-device checks remain a release gate in `quickstart.md`.

**Organization**: Tasks are grouped by user story so each increment can be reviewed independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it changes different files and does not depend on incomplete work
- **[Story]**: Maps the task to a user story in `spec.md`
- Every task includes the exact affected path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare executable task tracking and release-safe configuration boundaries.

- [x] T001 Verify project ignore rules cover Node.js, local environment, and editor artifacts in `.gitignore`
- [x] T002 Add the check-in page assets to the structural test inventory in `tests/run-tests.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define the packaged tag model and deterministic local validation boundary used by every NFC story.

- [x] T003 [P] Add packaged tag definitions with unique `tagId`, `tagToken`, `pointCode`, integer `stationIndex`, nullable canonical `expectedUid`, integer `payloadVersion`, `uidPolicy`, `materialType`, and `enabled` fields in `miniprogram/utils/nfc-tags.js`
- [x] T004 [P] Add discovery fixtures for matching, malformed, missing, and duplicate UID observations in `tests/fixtures/nfc-discovery-results.js`
- [x] T005 Add failing tests for exact query matching, inventory resolution, platform policy, and uppercase separator-free UID canonicalization in `tests/run-tests.js`
- [x] T006 Implement pure query parsing, tag resolution, runtime policy resolution, UID comparison, assurance results, and stable rejection codes in `miniprogram/utils/nfc-validation.js`
- [x] T007 Refactor NFC device I/O into cancellable single-discovery sessions with idempotent cleanup and normalized error codes in `miniprogram/utils/nfc.js`

**Checkpoint**: Local validation is deterministic and testable without page code or a backend.

---

## Phase 3: User Story 1 - Touch a Tag and Open the Correct Point (Priority: P1) MVP

**Goal**: Register the official Scheme target and validate `point`, `tag`, and `v` before any progress change.

**Independent Test**: Load the page with valid and malformed option fixtures; only an exact enabled packaged mapping reaches the hardware/platform validation state.

- [x] T008 [P] [US1] Add page-flow tests for valid, missing, malformed, unsupported-version, and unknown launch parameters in `tests/run-tests.js`
- [x] T009 [P] [US1] Create the check-in page presentation and explicit validating, scanning, accepted, and rejected states in `miniprogram/pages/checkin/checkin.wxml`, `miniprogram/pages/checkin/checkin.wxss`, and `miniprogram/pages/checkin/checkin.json`
- [x] T010 [US1] Implement launch query handling and terminal single-transition guards in `miniprogram/pages/checkin/checkin.js`
- [x] T011 [US1] Register `pages/checkin/checkin` as a non-tab page in `miniprogram/app.json`

**Checkpoint**: The Scheme target exists and rejects invalid launch parameters without changing progress.

---

## Phase 4: User Story 2 - Validate Locally Available Evidence (Priority: P1)

**Goal**: Produce explicit UID-match, iOS link-match, Harmony compatibility, or rejected results without silent downgrade.

**Independent Test**: Run matching and mismatching UID fixtures across Android, iOS, HarmonyOS strict, HarmonyOS compatible, timeout, and repeated-callback cases.

- [x] T012 [P] [US2] Add tests for Android strict UID success/failure, iOS link-only success, Harmony compatibility, timeout, and idempotent cleanup in `tests/run-tests.js`
- [x] T013 [US2] Integrate runtime platform detection, NFC discovery, UID validation, reason-specific recovery, retry, hide, and unload cleanup in `miniprogram/pages/checkin/checkin.js`
- [x] T014 [US2] Ensure user-facing states distinguish UID match, link match, unsupported NFC, disabled NFC, timeout, wrong tag, wrong point, and incomplete tag configuration without displaying raw UID/token values in `miniprogram/pages/checkin/checkin.js` and `miniprogram/pages/checkin/checkin.wxml`

**Checkpoint**: Each platform produces one explicit local assurance result or one stable rejection.

---

## Phase 5: User Story 3 - Continue the Existing Local Workflow (Priority: P1)

**Goal**: Persist accepted local evidence only for the current point and continue the existing action/photo/certificate flow.

**Independent Test**: A valid current-point result stores metadata and opens the action page; future, completed, rejected, and duplicate results make no invalid transition.

- [x] T015 [P] [US3] Add progress tests for NFC metadata persistence, current-point enforcement, duplicate acceptance, and existing 20-minute expiry in `tests/run-tests.js`
- [x] T016 [US3] Extend `checkInStation` to persist `tagId`, `pointCode`, `assurance`, and non-sensitive UID hint metadata in `miniprogram/utils/progress.js`
- [x] T017 [US3] Hand accepted validation results to the progress store and navigate once to the existing action page in `miniprogram/pages/checkin/checkin.js`
- [x] T018 [US3] Remove the generic any-tag acceptance path and convert the route sheet to instruct users to touch the provisioned sign in `miniprogram/pages/route/route.js` and `miniprogram/pages/route/route.wxml`
- [x] T019 [US3] Disable the production NFC skip flag and update its regression test in `miniprogram/utils/config.js` and `tests/run-tests.js`

**Checkpoint**: The current action, photo, records, and certificate flow works unchanged after a validated local check-in.

---

## Phase 6: User Story 4 - Prepare and Verify Event Tags (Priority: P2)

**Goal**: Give operators a source-controlled, non-secret inventory template that reconciles physical tags with packaged configuration.

**Independent Test**: Every packaged tag maps to one manifest row and clearly reports whether its real UID and Scheme still require provisioning.

- [x] T020 [P] [US4] Add a provisioning manifest template for point, token, UID, material, Scheme fingerprint, and verification status in `specs/001-nfc-checkin-validation/provisioning-manifest.csv`
- [x] T021 [P] [US4] Document how to replace generated tokens, capture ACR122U UIDs, generate official Schemes outside the app, and run final-surface checks in `README.md`
- [x] T022 [US4] Add automated inventory integrity checks for uniqueness, station mapping, token format, UID format when present, and disabled release readiness when UID is absent in `tests/run-tests.js`

**Checkpoint**: Software inventory and operator manifest can be reconciled before physical tag locking.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Complete regression checks and make the Spec Kit record reflect the delivered software state.

- [x] T023 Run the complete automated suite and JavaScript syntax checks through `package.json`
- [x] T024 Review `specs/001-nfc-checkin-validation/quickstart.md` against the implemented states and record remaining physical release gates in `specs/001-nfc-checkin-validation/tasks.md`
- [x] T025 Confirm no runtime backend, cloud function, custom validation API, AppSecret, access token, raw UID display, or NFC skip path was introduced across `miniprogram/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** starts immediately.
- **Foundational (Phase 2)** depends on Setup and blocks all page work.
- **User Story 1 (Phase 3)** depends on Foundational.
- **User Story 2 (Phase 4)** depends on User Story 1 because the page owns NFC lifecycle.
- **User Story 3 (Phase 5)** depends on User Story 2 because only accepted validation may update progress.
- **User Story 4 (Phase 6)** can run after the packaged inventory in Phase 2 exists.
- **Polish (Phase 7)** depends on all software stories.

### Parallel Opportunities

- T003 and T004 can run in parallel.
- T008 and T009 can run in parallel after the validation contract exists.
- T020 and T021 can run in parallel after the inventory format is stable.
- Physical-device validation from `quickstart.md` can proceed independently after a released test build and official test Schemes exist.

## Implementation Strategy

1. Build and test the pure validation foundation first.
2. Add the Scheme target page without changing progress behavior.
3. Integrate platform evidence and lifecycle cleanup.
4. Connect one accepted result to the existing local workflow.
5. Add operator reconciliation artifacts and run the full regression suite.
6. Keep Android production acceptance closed until real ACR122U UIDs are entered and the physical matrix passes.

## Release Gates Outside Automated Completion

- WeChat NFC capability and `model_id` approval.
- Official NFC Schemes generated outside the mini-program.
- Real ACR122U UID values entered for all UID-strict tags.
- NDEF read-back confirms URI first and AAR `com.tencent.mm` second.
- Two Android models, one HarmonyOS model, and two iPhone generations pass `quickstart.md`.
- Final mounted surfaces pass before any irreversible tag lock.
