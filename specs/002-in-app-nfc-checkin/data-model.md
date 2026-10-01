# Data Model: Platform-Neutral QR Check-in

This document replaces the earlier NFC data model. The active flow has one evidence type: a packaged QR payload.

## Current Point

`progress.completed` remains the only expected task-station authority. It is an integer from `0` to `2` while a task station is active; start and finish are separate checkpoint types.

The complete start/finish timing model is documented in `specs/004-start-finish-qr-timing/data-model.md`.

## QR Definition

```js
{
  qrId: 'QR-001-A',
  qrToken: '<token>',
  pointCode: '001',
  stationIndex: 0,
  payloadVersion: 1,
  enabled: true,
  payload: 'HRQ1|001|QR-001-A|<token>'
}
```

Start and finish definitions use `checkpointType: 'start' | 'finish'` and `checkpointIndex: -1 | 3`; they do not have `stationIndex` and never enter the action/photo flow.

The payload must match one enabled definition exactly. A QR from another station, an unknown token, an ordinary URL, or malformed text is rejected.

## Local Check-in Record

New records contain only:

```js
{
  at: 0,
  source: 'qr-code',
  qrId: 'QR-001-A',
  pointCode: '001',
  assurance: 'LOCAL_QR_MATCH'
}
```

The QR token and raw scan text are never persisted. Progress remains device-local and is intentionally not trusted attendance data.
