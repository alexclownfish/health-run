# Architecture Decision: Continue Pure Frontend

**Date**: 2026-09-26

## Decision

Choose **pure frontend runtime** for this one-day, low-risk activity.

The mini-program will not call a custom backend or CloudBase function for NFC check-in. Existing local storage
continues to own route progress, actions, photos, records, and certificates. NFC validation compares the Scheme
query and optional UID against a static configuration packaged with the mini-program.

## Why This Is Proportionate

- The event lasts one day.
- Check-in does not control payment, access, formal attendance, or a valuable reward.
- Organizers do not require trusted openid, central counts, or cross-device history.
- Avoiding runtime network dependency reduces event-day failure modes.
- The current application is already designed and tested around local storage.

## Accepted Limitations

- No trusted participant identity or `openid`.
- No central check-in list or live organizer dashboard.
- No remote tag disable or configuration change.
- Clearing storage, reinstalling, or changing devices resets progress.
- Packaged tag tokens and expected UIDs can be extracted from the mini-program.
- iOS uses link matching only for NTAG215 and cannot prove the physical UID.
- Copied NDEF content and modified clients cannot be reliably defeated.

## Remaining Non-runtime Dependency

The official WeChat NFC Scheme still requires platform approval and a server API access token during tag
preparation. Use a one-time secure local operator script or temporary restricted tool. This tool generates the
Scheme values before release and is not part of runtime application architecture.

## Revisit Trigger

Reconsider a minimal backend only if the event later requires central participant statistics, reliable identity,
remote tag revocation, cross-device recovery, high-value rewards, formal attendance, or stronger auditability.
