# Visual Theme Review Quickstart

## Before Implementation

1. Approve [visual-direction.md](./visual-direction.md) as the first palette version.
2. Confirm that the scope remains color-only: no layout, text, interaction, storage, or business-rule changes.
3. Keep the current QR inventory and route data unchanged.
4. Open `preview/index.html` or the local preview URL to compare the proposed palette across pages and states.

## After Implementation

1. Import the repository in the WeChat Developer Tools and compile the latest local source.
2. Review route, check-in, action, upload, records, profile, and certificate pages at narrow and normal phone widths.
3. Test route states at `0/3`, `1/3`, and `3/3`; test check-in success and error; test disabled action and photo save states.
4. Confirm the tab bar, navigation bar, route markers, and saved certificate image use the approved palette.
5. Compare the result against the reference direction: warm ivory base, orange activity emphasis, indigo CTA, yellow/coral state accents.
6. Run the existing automated suite and the added static theme checks.

## Acceptance Gate

- No production business JavaScript changes are present except approved map/Canvas color constants.
- No old green-family theme token remains in app-owned runtime UI.
- QR scanning, local progress, action timing, photo saving, and certificate generation still pass their existing flows.
- No text, control, card, map, or fixed-bottom action overlaps at supported widths.
