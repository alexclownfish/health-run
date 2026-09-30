# Theme Token Contract

## Scope

This contract describes the visual color vocabulary for the existing WeChat mini-program. It does not define a new API, storage field, or business state.

## Required Tokens

The implementation MUST provide semantic equivalents for:

`ink`, `deep`, `primary`, `orange`, `orangeBright`, `yellow`, `coral`, `lavender`, `peach`, `paper`, `white`, `line`, `muted`, and `disabled`.

## State Mapping

| Existing state | Required visual mapping |
| --- | --- |
| Active primary action | `primary` background with high-contrast light content |
| Activity hero | `orange` surface with `orangeBright` decoration |
| Current point | `yellow` mark plus current-state text/shape |
| Completed point | `deep` mark plus completion symbol/text |
| Error or invalid scan | `coral` mark plus error copy/icon |
| Locked or unavailable | `disabled` surface plus reduced opacity and text |
| Informational soft surface | `lavender` or `peach` with `ink`/`muted` text |

## Non-Goals

- The token contract MUST NOT change navigation, QR validation, local progress, action timing, photo persistence, or certificate data.
- The token contract MUST NOT require a backend or new image assets.
- The token contract MUST NOT style third-party map tiles that are outside the mini-program's control.
