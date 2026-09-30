# Feature Specification: Frontend-only NFC Check-in

**Feature Branch**: `main`

**Created**: 2026-09-26

**Status**: Software implemented; physical tag and device release gates pending

**Input**: Keep the one-day health activity mini-program completely frontend-only while adding NFC tags that
open the correct point and provide the strongest locally available validation.

## Clarifications

### Session 2026-09-26

- Q: Is a runtime backend required? → A: No. The mini-program remains completely frontend-only.
- Q: What is the risk level? → A: Low-risk one-day activity, not payment, access control, or formal attendance.
- Q: Where is progress stored? → A: Existing device-local storage remains the only runtime state.
- Q: Is central user identity or reporting required? → A: No trusted openid, central record, or cross-device sync.
- Q: May deployment use an external tool? → A: Yes. One-time Scheme generation is deployment tooling, not runtime backend.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Touch a Tag and Open the Correct Point (Priority: P1)

A participant touches a provisioned NFC label and reaches the local check-in page for the point encoded in the
official WeChat NFC Scheme.

**Why this priority**: Tag launch is the only new entry path required for the event.

**Independent Test**: Touch one tag for each point on representative Android, HarmonyOS, and iOS devices and
verify that the page receives the expected `point`, `tag`, and payload version.

**Acceptance Scenarios**:

1. **Given** a valid tag and unlocked supported Android device, **When** the tag is touched, **Then** WeChat
   opens `pages/checkin/checkin` for the configured point.
2. **Given** a valid tag and supported iPhone, **When** the tag is touched and the system notification is
   confirmed, **Then** the same page opens with the same point and tag values.
3. **Given** missing, malformed, unsupported-version, or unknown parameters, **When** the page loads, **Then**
   the local workflow does not record a check-in.

---

### User Story 2 - Validate Locally Available Evidence (Priority: P1)

The mini-program compares launch parameters and, when available, the chip UID against a packaged point/tag
configuration before allowing the existing action workflow to continue.

**Why this priority**: Local comparison catches accidental wrong tags and casual point substitution without
adding runtime infrastructure.

**Independent Test**: Exercise matching and mismatching point, tag token, UID, and payload-version fixtures.

**Acceptance Scenarios**:

1. **Given** an Android device returning UID, **When** point, tag token, and UID all match one packaged tag,
   **Then** the local check-in succeeds as `LOCAL_UID_MATCH`.
2. **Given** Android returns a missing or mismatching UID, **When** strict UID policy is enabled, **Then** the
   check-in fails and does not silently become point-only success.
3. **Given** an iPhone with an NTAG215 tag, **When** point and tag token match packaged configuration, **Then**
   the check-in succeeds as `LOCAL_LINK_MATCH` without claiming UID verification.
4. **Given** a HarmonyOS device, **When** a usable UID is observed on a verified device profile, **Then** UID
   matching is used; otherwise the packaged compatibility policy decides whether link-only matching is allowed.

---

### User Story 3 - Continue the Existing Local Workflow (Priority: P1)

After local NFC validation, the participant enters the current action timer, photo, point-order, records, and
certificate flow without introducing network dependency.

**Why this priority**: The project intentionally keeps its existing architecture and event-day reliability.

**Independent Test**: Open current, completed, and future points through tag links and verify existing guards.

**Acceptance Scenarios**:

1. **Given** the tag belongs to the current local point, **When** validation succeeds, **Then** a 20-minute local
   check-in is stored and the correct action page opens.
2. **Given** the tag belongs to a future point, **When** local tag validation succeeds, **Then** existing point
   order still blocks progression.
3. **Given** the app is offline, **When** a tag launches the released mini-program and local assets are available,
   **Then** validation and the existing workflow do not require a runtime backend request.

---

### User Story 4 - Prepare and Verify Event Tags (Priority: P2)

An operator generates approved NFC Schemes, writes both NDEF records, records tag metadata in the source
configuration, and verifies tags before installation.

**Why this priority**: Pure frontend operation depends on build-time tag inventory being correct.

**Independent Test**: Reconcile every physical tag against the provisioning manifest and packaged config.

**Acceptance Scenarios**:

1. **Given** a new tag, **When** it is provisioned, **Then** the manifest records point code, tag token, UID,
   material type, Scheme fingerprint, and payload version.
2. **Given** a verified pilot tag, **When** all target devices and final mounting surfaces pass, **Then** the
   operator may lock the tag according to the runbook.
3. **Given** a tag must be replaced after the mini-program is published, **When** a new tag uses the same
   packaged logical tag token and expected UID cannot remain the same, **Then** a new mini-program release is
   required before UID-strict devices accept it.

### Edge Cases

- NFC is disabled, screen is locked, WeChat is too old, or the tag cannot be read on its mounting surface.
- Query parameters are missing, duplicated, malformed, or use an unsupported payload version.
- UID byte order, signed-byte conversion, casing, or separators differ between ACR122U and phones.
- NFC discovery fires repeatedly or completes after the page is hidden/unloaded.
- A future or already-completed point is opened directly.
- The same NDEF payload is copied to another tag.
- Local storage is cleared, the mini-program is reinstalled, or the participant changes phones.
- A physical tag is damaged after the final mini-program release.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each production tag MUST contain the official two-record NDEF structure: WeChat NFC Scheme URI
  followed by AAR `com.tencent.mm`.
- **FR-002**: The NFC Scheme MUST target released page `pages/checkin/checkin` with query
  `point=<code>&tag=<token>&v=1`.
- **FR-003**: Runtime operation MUST make no backend, cloud-function, or custom API request for NFC validation.
- **FR-004**: The mini-program MUST package a static tag configuration containing stable point code, tag token,
  expected UID where applicable, and platform compatibility policy.
- **FR-005**: Query values MUST be validated for exact format, known point/tag pairing, and supported version.
- **FR-006**: Android UID results MUST be normalized to uppercase hexadecimal without separators before comparison.
- **FR-007**: On UID-strict device paths, missing, malformed, timed-out, or mismatching UID MUST reject the local
  check-in rather than silently downgrade.
- **FR-008**: iOS NTAG215 validation MUST use packaged point/tag matching and MUST be labeled as link-only,
  without claiming physical UID verification.
- **FR-009**: HarmonyOS behavior MUST be controlled by a packaged, tested compatibility matrix rather than OS
  name alone.
- **FR-010**: Successful local validation MUST call the existing progress workflow only for the current point.
- **FR-011**: Existing local action timing, photo requirement, point order, records, and certificate behavior
  MUST remain unchanged.
- **FR-012**: NFC listeners and timers MUST be stopped on success, failure, page hide, and page unload.
- **FR-013**: Repeated discovery callbacks MUST produce at most one local transition.
- **FR-014**: Production configuration MUST set the current public NFC skip flag to disabled.
- **FR-015**: The UI MUST explain the difference between UID-matched, link-matched, unsupported, timeout, wrong
  tag, and wrong point outcomes without exposing raw UID or token values.
- **FR-016**: The project MUST NOT claim trusted openid, central attendance, remote tag disable, cross-device
  recovery, or tamper-proof records.
- **FR-017**: The operator MUST generate WeChat NFC Schemes outside the mini-program using a secure one-time
  tool or approved platform process; AppSecret and access tokens MUST NOT enter the repository or app package.
- **FR-018**: Every physical tag MUST pass read-back and final-surface verification before installation.
- **FR-019**: Irreversible tag locking MUST occur only after pilot and final released-version validation.
- **FR-020**: Documentation MUST state that static NDEF, packaged tokens, local UID comparison, and local storage
  deter mistakes and casual misuse but do not provide strong anti-cloning or anti-tamper guarantees.

### Key Entities

- **Packaged Point**: Stable point code, display data, sequence, and expected action.
- **Packaged Tag**: Tag ID/token, point binding, expected UID where used, payload version, and compatibility policy.
- **Local NFC Result**: Point/tag evidence, local assurance level, observation time, and validation outcome.
- **Local Route Progress**: Existing storage for check-ins, actions, photos, completion, and history.
- **Provisioning Manifest**: Operator-only file for Scheme, UID, point, material, and verification reconciliation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 95% of valid tag touches on the supported-device matrix open the correct point within
  8 seconds, excluding user dismissal of the iOS notification.
- **SC-002**: 100% of packaged point/tag mismatches are rejected in automated tests.
- **SC-003**: 100% of UID mismatches are rejected on UID-strict device paths.
- **SC-004**: Repeated NFC callbacks create at most one local check-in transition.
- **SC-005**: The existing 18 project tests continue to pass after implementation.
- **SC-006**: Every installed tag passes NDEF read-back, packaged-config reconciliation, and final-surface testing.
- **SC-007**: The device matrix includes at least two Android models, one HarmonyOS model, and two supported
  iPhone generations.
- **SC-008**: Clearing local storage demonstrably resets progress, and this limitation is documented for operators.

## Assumptions

- The activity is low-risk, runs for one day, and does not grant money, access, formal attendance, or valuable rewards.
- Organizers do not require central participant counts, trusted user identity, remote tag disable, or cross-device sync.
- Existing local storage is acceptable as the only progress record.
- NTAG215 remains the selected label and its anti-cloning limitations are accepted.
- AppID eligibility and approval for WeChat NFC tag launch are obtained before writing production tags.
- One-time Scheme generation may use secure operator tooling outside runtime, but the mini-program remains backend-free.

## Out of Scope

- Runtime backend, cloud functions, custom APIs, or cloud database for NFC check-in.
- Trusted openid or organizer-facing central reports.
- Remote tag activation, disable, or replacement without a new release.
- Cross-device progress recovery.
- Cryptographic proof that an NTAG215 tag was not cloned.
