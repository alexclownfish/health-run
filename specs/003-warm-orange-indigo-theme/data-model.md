# Design Model: Theme Tokens

This feature has no new runtime data. The design model describes semantic visual values only.

## Theme Token

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| name | string | yes | Stable semantic name used by page/component styles |
| value | color | yes | Hex or rgba value approved in `visual-direction.md` |
| role | enum | yes | surface, content, action, state, or decoration |
| contrastTarget | string | yes | Intended foreground/surface pairing |

## Required Relationships

- `paper` is the page surface; `white` is the card and sheet surface.
- `ink` is the primary content color; `muted` is secondary content and must not be used for primary actions.
- `primary` is paired with light content for filled controls.
- `orange` and `orangeBright` are paired with light content or dark `ink` according to the local surface.
- `yellow`, `coral`, and `deep` are paired with explicit labels/icons so status is not conveyed by color alone.

## Non-Entities

No token is persisted to storage. No QR, route, user, photo, action, or certificate business data is changed by this feature.
