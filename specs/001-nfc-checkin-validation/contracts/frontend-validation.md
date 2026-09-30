# Contract: Frontend NFC Validation

## Scheme Query

```text
point=001&tag=<url-safe-random-token>&v=1
```

Rules:

- All three fields are required exactly once.
- `point` must match the stable packaged point format.
- `tag` must match one enabled packaged tag for that point.
- `v` must be a supported integer payload version.
- Additional unknown security-sensitive fields are ignored only if explicitly allowed by the parser contract.

## Discovery Input

Normalized wrapper around `NFCAdapter.onDiscovered`:

```json
{
  "id": "ArrayBuffer-or-null",
  "techs": ["NFC_A", "NDEF"],
  "messages": []
}
```

## Accepted Local Result

```json
{
  "ok": true,
  "tagId": "TAG-001-A",
  "pointCode": "001",
  "stationIndex": 0,
  "assurance": "LOCAL_UID_MATCH",
  "uidCanonical": "04A1B2C3D4E5F6",
  "observedAt": 1790476800000
}
```

iOS example:

```json
{
  "ok": true,
  "tagId": "TAG-001-A",
  "pointCode": "001",
  "stationIndex": 0,
  "assurance": "LOCAL_LINK_MATCH",
  "uidCanonical": null,
  "observedAt": 1790476800000
}
```

## Rejected Local Result

```json
{
  "ok": false,
  "reasonCode": "UID_MISMATCH",
  "retryable": false
}
```

## Stable Reason Codes

| Code | Retryable | Meaning |
|------|-----------|---------|
| `INVALID_QUERY` | false | Missing, duplicated, malformed, or unsupported query |
| `TAG_UNKNOWN` | false | Point/tag/version does not match packaged configuration |
| `OUT_OF_ORDER` | false | Tag is valid but not the current local station |
| `NFC_UNSUPPORTED` | false | Required NFC API is unavailable |
| `NFC_DISABLED` | true | Device NFC appears disabled |
| `NFC_TIMEOUT` | true | Required UID was not observed in time |
| `UID_INVALID` | true | UID cannot be canonicalized |
| `UID_MISMATCH` | false | UID differs from packaged expected UID |
| `TAG_CONFIG_INCOMPLETE` | false | A UID-strict packaged tag is missing a canonical expected UID |
| `COMPAT_NOT_ALLOWED` | false | Link-only compatibility is not packaged for this runtime |
| `PAGE_CANCELLED` | true | Page was hidden/unloaded before completion |

## Single-transition Rule

Each page instance has one terminal result. Once accepted, rejected, or cancelled, later NFC callbacks and timers
must have no effect. Cleanup is idempotent.
