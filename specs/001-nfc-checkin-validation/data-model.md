# Data Model: Frontend-only NFC Check-in

All runtime data is packaged in the mini-program or stored through the existing local progress module.

## Packaged Tag Definition

| Field | Type | Rules |
|-------|------|-------|
| `tagId` | string | Stable operator identifier, e.g. `TAG-001-A` |
| `tagToken` | string | Random URL-safe value written into Scheme query; unique in package |
| `pointCode` | string | Stable point code, e.g. `001` |
| `stationIndex` | integer | Maps to existing `stations` entry |
| `expectedUid` | string/null | Canonical uppercase hex for UID-strict paths |
| `payloadVersion` | integer | Initially `1` |
| `uidPolicy` | enum | `REQUIRED`, `UNAVAILABLE_EXPECTED`, `COMPAT_ALLOWED` |
| `materialType` | enum | `NORMAL`, `ANTI_METAL` |
| `enabled` | boolean | Compile-time inclusion; changing requires release |

Constraints:

- `tagId` and `tagToken` are unique.
- `pointCode + tagToken + payloadVersion` must resolve to exactly one enabled tag.
- Multiple packaged tags, including a controlled spare, may map to one point.

## Local NFC Result

| Field | Type | Rules |
|-------|------|-------|
| `tagId` | string | Matched packaged tag |
| `pointCode` | string | Matched packaged point |
| `stationIndex` | integer | Existing local station index |
| `assurance` | enum | `LOCAL_UID_MATCH`, `LOCAL_LINK_MATCH`, `LOCAL_LINK_COMPAT`, `REJECTED` |
| `uidCanonical` | string/null | Present only when read and normalized; avoid UI display |
| `observedAt` | timestamp | Device time, not trusted audit time |
| `reasonCode` | string | Stable local validation code |

## Existing Local Progress Extension

On acceptance, extend the current `checkins[stationIndex]` entry with:

```text
at, source, tagId, pointCode, assurance, uidHint
```

The existing local model continues to own:

```text
completed, startedAt, completedAt, checkins, actions, photos, history, routeId
```

## Local Validation Order

1. Parse query and require exactly one `point`, `tag`, and supported `v`.
2. Resolve exact packaged point/tag/version match.
3. Verify the resolved station is the current local route station.
4. Resolve platform capability policy.
5. If UID required, discover, normalize, and compare UID.
6. Produce one local result and stop all listeners/timers.
7. On acceptance, write existing local progress and navigate to action page.

## Expected Data-loss Behavior

Clearing mini-program data, uninstalling/reinstalling WeChat or the mini-program, or changing devices may remove
all route progress. This is an accepted feature constraint, not a recoverable server synchronization case.
