# Research: 暖橙靛蓝视觉主题

## Decision 1: Use semantic theme tokens as the primary migration boundary

**Decision**: Keep the existing page-level `page` variables as the single source for common colors, replacing the green-family names with semantic warm-orange/indigo names. Page styles may use semantic tokens; new page-private hex colors are discouraged.

**Rationale**: The current app already centralizes common colors in `miniprogram/app.wxss`. Reusing this boundary keeps the change small and makes later palette tuning one-file-first.

**Alternatives considered**:

- Replace every hex value independently: rejected because later tuning would be inconsistent and green remnants would be easy to miss.
- Add a runtime theme switch: rejected because the request is one approved visual direction, not a user preference feature.

## Decision 2: Keep orange and indigo as complementary roles

**Decision**: Orange owns activity branding and energetic surfaces; indigo owns primary actions, scanner illustration, stable completion surfaces, and the main CTA.

**Rationale**: The reference image uses orange for the visual identity and indigo for the strongest action controls. Splitting these roles preserves hierarchy and avoids an all-orange interface.

**Alternatives considered**:

- Use orange for every primary button and status: rejected because action, warning, and activity-branding signals would collapse into one color.
- Use only indigo and warm neutrals: rejected because it would lose the distinctive reference image energy.

## Decision 3: Include non-WXSS color sources in the same review

**Decision**: Treat `app.json`, `components/route-map/route-map.js`, `utils/route.js`, and `pages/certificate/certificate.js` as theme-owned surfaces.

**Rationale**: These files control navigation colors, native map markers, route lines, and saved certificate pixels. Omitting them would make the on-screen preview and exported certificate disagree with the new direction.

**Alternatives considered**:

- Change only WXSS: rejected because the current source audit found green constants outside WXSS.

## Decision 4: Preserve structure and assets for version one

**Decision**: Recolor existing geometry and illustration CSS only. Do not add new images, page sections, or animation behavior in this theme pass.

**Rationale**: The user requested a color-oriented redesign while keeping business logic unchanged. This gives a reversible implementation and isolates visual approval from asset production.

**Alternatives considered**:

- Rebuild the reference image as a full illustration system: deferred because it expands scope beyond a palette migration.
