# Contract: NFC Tag Provisioning Manifest

## Input Manifest Row

```csv
batch_id,tag_id,point,model_id,sn,material_type,payload_version,tag_token,scheme
2026-09-pilot,TAG-0001,001,MODEL_ID,SN-0001,NORMAL,1,BASE64URL_TOKEN,WECHAT_NFC_SCHEME
```

The manifest contains full Schemes and operator inventory. Keep it in an access-controlled operator location.
The mini-program source contains the corresponding tag tokens by design, so they are identifiers rather than
secrets.

## NDEF Records

### Record 1: URI

| Property | Required Value |
|----------|----------------|
| TNF | `0x01` Well-Known |
| Type | `U` |
| Payload | Full WeChat NFC Scheme targeting `pages/checkin/checkin` |

Scheme query:

```text
point=001&tag=<opaque-128-bit-token>&v=1
```

### Record 2: Android Application Record

| Property | Required Value |
|----------|----------------|
| TNF | `0x04` NFC Forum external type |
| Type | `android.com:pkg` |
| Payload | `com.tencent.mm` |

## Read-back Result

```json
{
  "batchId": "2026-09-pilot",
  "tagId": "TAG-0001",
  "uidCanonical": "04A1B2C3D4E5F6",
  "recordCount": 2,
  "uriRecordValid": true,
  "aarRecordValid": true,
  "schemeFingerprint": "sha256:...",
  "point": "001",
  "tokenMatchesPackagedConfig": true,
  "finalSurface": "ACRYLIC",
  "mountedReadPassed": true,
  "verifiedAt": "2026-09-26T20:00:00Z",
  "verifier": "operator-id"
}
```

## Approval Rules

1. UID canonicalization is identical across ACR122U and target Android readers.
2. Both records match exactly and remain in required order.
3. Token, point, payload version, and expected UID match the packaged configuration.
4. Normal labels pass on the actual non-metal mounting surface.
5. Anti-metal labels pass after mounting on the target metal sign.
6. Failed tags are not installed and remain unlocked.
7. Batch locking requires verification plus a second operator/reviewer.

## Replacement Rules

- Prefer a spare tag already packaged and tested in the released mini-program.
- A replacement with a new token or expected UID requires a new mini-program release before strict devices use it.
- Remove or cover the damaged tag physically; there is no remote disable operation.
- Update the operator manifest and packaged config together for the next release.
