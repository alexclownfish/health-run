# Health Run Constitution

## Core Principles

### I. Platform Truth Over Assumptions
Features that depend on WeChat, Android, HarmonyOS, iOS, NFC, or CloudBase MUST be
designed from current first-party platform documentation and verified on representative
physical devices. Unsupported or unverified behavior MUST be recorded as a compatibility
risk, not treated as an implicit fallback.

### II. Explicit Authority Boundaries
Every feature MUST state whether business state is local or server-authoritative. A low-risk,
single-event experience MAY use device-local state when it explicitly gives up trusted identity,
central audit, cross-device recovery, remote revocation, and strong anti-tamper claims. Payment,
access control, formal attendance, high-value rewards, or other consequential workflows MUST use
trusted server-side authority.

### III. Fail Closed With Explicit Assurance
When a platform is expected to provide a validation signal, missing, malformed, or mismatched
signals MUST NOT silently become successful check-ins. Weaker platform paths MUST be explicit,
measurable, and stored with a distinct assurance level. Product-approved recovery paths MUST
be visible to the user and auditable by operators.

### IV. Testable State Transitions
Every route and check-in transition MUST have deterministic prerequisites, outcomes, and error
codes. Changes MUST include automated tests for pure validation logic and documented physical-
device scenarios for platform integrations that cannot be simulated reliably.

### V. Minimal, Reversible Delivery
Changes MUST extend the existing native WeChat mini-program before introducing new infrastructure.
Hardware data formats and irreversible NFC lock operations MUST be piloted and versioned before
bulk production. A fixed one-day event MAY use compile-time configuration when the operational
limitations and update procedure are documented.

## Security and Platform Constraints

- A frontend-only feature MUST NOT claim trusted `openid`, central attendance records, or cross-device state.
- Public NDEF payloads, URL parameters, point identifiers, and NTAG215 UIDs MUST be treated as
  replayable inputs rather than cryptographic proof.
- Secrets, signing keys, AppSecret values, raw access tokens, and NFC Scheme generation credentials
  MUST remain outside the mini-program package and NFC payload. One-time operator tooling is allowed.
- Device-local activity data MUST be minimized and documented as local-only. The feature MUST explain
  that reinstalling, clearing storage, or switching devices can lose or reset progress.
- Production support claims MUST be backed by a maintained device matrix covering supported WeChat
  versions and representative Android, HarmonyOS, and iOS devices.

## Delivery Workflow

1. Produce and approve `spec.md` before technical design.
2. Resolve platform and security unknowns in `research.md` before implementation planning is accepted.
3. Define local data, integration contracts, failure states, and end-to-end validation in plan artifacts.
4. Generate `tasks.md` only after the specification and plan have no unresolved critical ambiguity.
5. Do not implement until required WeChat hardware capabilities and test devices are available, or
   an explicitly scoped mock phase has been approved.
6. Before release, pass automated tests, physical tag tests, lifecycle cleanup tests, and the platform
   compatibility matrix.

## Governance

This constitution governs all feature specifications and plans in this repository. Deviations require
a written justification in the plan's Complexity Tracking section and explicit project-owner approval.
Amendments MUST update the version using semantic versioning: MAJOR for incompatible principle changes,
MINOR for new principles or materially expanded rules, and PATCH for clarifications. Every specification
and plan review MUST check compliance before implementation begins.

**Version**: 2.0.0 | **Ratified**: 2026-09-26 | **Last Amended**: 2026-09-26
