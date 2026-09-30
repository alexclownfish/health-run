# Data Model: Platform-Neutral QR Check-in

This document replaces the earlier NFC data model. The active flow has one evidence type: a packaged QR payload.

## Current Point

`progress.completed` is the only expected station authority. It is an integer from `0` to `2` while the route is active.

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
