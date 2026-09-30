# Specification Quality Checklist: Platform-Neutral QR Check-in

- [x] The specification states that all platforms use one QR flow.
- [x] Current local progress is the only expected-point authority.
- [x] QR format, inventory matching, wrong-point rejection, and duplicate handling are defined.
- [x] Camera cancellation, permission denial, lifecycle return, and late callbacks are covered.
- [x] The existing action, photo, records, and certificate flow remains in scope.
- [x] No backend, NFC API, UID, NDEF, or platform compatibility whitelist is required.
- [x] Local-only limitations and static QR replayability are documented.
- [x] Representative physical-device checks remain a release gate.
