# Decisions: add-design-system

Confirmed with Philipp Lackner on 2026-11-15, through the orchestrator session (cardiganapp-e9).

## Summary

Bring the Figma Foundations and Design System into `src/core/ui`: every Figma variable and style as a theme token, Geist fonts, all 27 icons, all Design System components (including the ones only one feature uses) and a responsive layout component. Components follow the Figma variants exactly, switch to Touch sizes and the phone layout under one "phone" condition, scale with the user's text size, and are shown on a dev-only preview page. No feature screens, no i18n, no component tests.

## Decisions

### D1 — Component scope
- **Question**: Which Figma Design System components does this change build?
- **Decision**: All of them, including single-feature ones (Card, Column, Add card button, Add column button, Drop indicator, Board tile, Board row, Label row, card detail Panel, File row, Drop zone). Same as mobile.
- **Alternatives**: Shared primitives only, single-feature components in their feature changes.
- **Why**: User decision. Mobile also builds foundations and components in one change.
- **Depends on**: —

### D2 — Token naming
- **Question**: Do tokens follow Figma variable names or the Figma WEB code syntax?
- **Decision**: Variable names. `/` becomes `-`, a trailing `/default` is dropped: `accent/default` → `--color-accent` (`bg-accent`), `text/on-accent` → `--color-text-on-accent`. The WEB code syntax (`var(--fg)`) is ignored.
- **Alternatives**: Code syntax names (`--fg`, `--accent-fg`).
- **Why**: Matches AGENTS.md and the skill. Code syntax is missing on 26 of 53 color variables.
- **Depends on**: —

### D3 — Token coverage
- **Question**: Which Figma tokens become theme tokens?
- **Decision**: Every Figma variable and style, 1:1: 53 colors (Light and Dark), 23 spacing steps, 11 radii, 8 sizes, 59 text styles, 7 effect styles. The `react-ui-components` skill is updated in this change to match.
- **Alternatives**: Only the Foundations page set; wait for design to consolidate.
- **Why**: Figma is the source of truth. Updating the Foundations page to list the full set is a separate change owned by the mobile session.
- **Depends on**: D2

### D4 — Spacing classes
- **Question**: How do spacing classes map to Figma steps?
- **Decision**: Named steps equal to Figma px: `p-12` = 12px, `gap-5` = 5px. Only Figma's 23 steps exist; Tailwind's 4px multiplier is removed.
- **Alternatives**: 4px multiplier (`p-3` = 12px).
- **Why**: Class numbers match Figma names, and off-scale values produce no CSS.
- **Depends on**: D3

### D5 — Typography
- **Question**: How do the Figma text styles become CSS?
- **Decision**: One utility per Figma text style, named mechanically (`Sans/13.5 Medium/145%` → `type-sans-13.5-medium-145`), plus the 7 Foundations roles (page-title, screen-title, card-title, body, label, metadata, section-label) as semantic utilities that use the larger phone size on phones.
- **Alternatives**: Only the 7 roles; wait for design to consolidate.
- **Why**: —
- **Depends on**: D3

### D6 — Touch sizes
- **Question**: When do components use the Touch size variants?
- **Decision**: Automatic: on phones (as defined in D15), components use their Touch variant; otherwise Default.
- **Alternatives**: Pointer-based (`pointer: coarse`); explicit size per screen.
- **Why**: Matches Figma: phone frames use Touch, tablet/desktop frames use Default.
- **Depends on**: —

### D7 — Breakpoints
- **Question**: Which breakpoints does web use?
- **Decision**: Figma's web values: tablet from 640px, desktop from 1024px, defined once in the theme. The app keeps 600/840dp.
- **Alternatives**: Align with the app (600/840).
- **Why**: Figma lists separate web and app values.
- **Depends on**: —

### D8 — Short viewports
- **Question**: What layout does a phone in landscape get?
- **Decision**: Viewports under 480px high always get the phone layout, whatever their width. Same as the app.
- **Alternatives**: Width only.
- **Why**: User decision.
- **Depends on**: D7

### D9 — Undrawn interaction states
- **Question**: How are hover, focus and loading states built when Figma doesn't draw them?
- **Decision**: From existing tokens. Primary hover uses `accent/hover`. Secondary, ghost and icon-button hover use `background/hover`. Focus-visible uses the `Focus/Accent` ring, or `Focus/Danger` on inputs in error. A loading button shows the spinner in place of the leading icon and can't be clicked. Danger and danger-ghost buttons have no hover change.
- **Alternatives**: Wait for design.
- **Why**: User decision; no new token for danger hover.
- **Depends on**: D3

### D10 — Toast behavior
- **Question**: How do toasts behave?
- **Decision**: Bottom center. Success closes after 4s. Errors stay until closed. One toast at a time; a new one replaces the current one.
- **Alternatives**: All close after 5s, stack up to 3.
- **Why**: Errors shouldn't disappear before they're read.
- **Depends on**: —

### D11 — Skeleton animation
- **Question**: How does the skeleton animate?
- **Decision**: Shimmer from `background/skeleton` to `background/skeleton-highlight`, about 1.2s per cycle, aligned with the app. Static under reduced motion.
- **Alternatives**: Pulse; static.
- **Why**: —
- **Depends on**: —

### D12 — Bottom sheet
- **Question**: How is the phone bottom sheet built?
- **Decision**: A Radix Dialog styled as a sheet. Closes on scrim tap, Escape or close. No drag-to-dismiss, no vaul.
- **Alternatives**: vaul with drag gestures.
- **Why**: No new dependency; Figma shows no drag behavior.
- **Depends on**: —

### D13 — Dependencies and tests
- **Question**: Which dependencies does this change add?
- **Decision**: `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `@fontsource-variable/geist`, `@fontsource-variable/geist-mono`. No test stack and no component tests; previews only. Same as mobile.
- **Alternatives**: Also jsdom, RTL, user-event, jest-dom with component tests.
- **Why**: User decision.
- **Depends on**: —

### D14 — Preview, i18n, specs
- **Question**: How are components previewed, how do they get text, and what does the change specify?
- **Decision**: A second Vite HTML entry for the preview page, left out of production builds. No Storybook. No react-i18next: core/ui takes all text through props. One web-only capability `web-design-system`.
- **Alternatives**: Storybook; react-i18next with a `common` namespace now.
- **Why**: —
- **Depends on**: —

### D15 — Phone condition
- **Question**: Does the short-viewport rule (D8) also switch components to Touch sizes?
- **Decision**: Yes. One "phone" condition, width under 640px OR height under 480px, drives both the phone layout and Touch sizes. The app uses the same rule with 600dp.
- **Alternatives**: Touch sizes width-only.
- **Why**: A phone in landscape is still a touch device; Figma always pairs the phone layout with Touch sizes.
- **Depends on**: D6, D7, D8

### D16 — Icons
- **Question**: Which Figma icons are exported in this change?
- **Decision**: All 27.
- **Alternatives**: Only icons the components use.
- **Why**: The components and previews use most of them; the set is small.
- **Depends on**: D1

### D17 — Text area height
- **Question**: Do text areas grow with their content?
- **Decision**: Yes. Title and Multi-line have no maximum. Description grows until the panel body scrolls.
- **Alternatives**: Fixed height with inner scroll.
- **Why**: Card titles wrap (see the Panel example).
- **Depends on**: —

### D18 — Progress dialog
- **Question**: Can the Progress dialog be dismissed?
- **Decision**: No. Escape, scrim click and close do nothing while it shows.
- **Alternatives**: Dismissible like other dialogs.
- **Why**: It has no buttons, and closing it would hide a running operation.
- **Depends on**: —

### D19 — Layout component
- **Question**: Does this change add the responsive app layout?
- **Decision**: Yes. A reusable layout component in core/ui: sidebar (tablet 224px, desktop 248px) or phone app bar, content, and an optional side panel (tablet 420px, desktop 452px) that is full screen on phones. `src/app` uses it later.
- **Alternatives**: Components only; the shell is assembled in `src/app` with the router.
- **Why**: Keeps the breakpoint widths in the design system instead of the router change.
- **Depends on**: D7, D15

### D20 — Large text and browser zoom
- **Question**: What happens when the user raises the browser or OS text size?
- **Decision**: Text scales with it: type tokens are set in `rem` (Figma px ÷ 16). Figma control heights become minimum heights, so controls grow to fit larger text. Single-line labels truncate with an ellipsis instead of wrapping. The app does the same.
- **Alternatives**: Fixed px text; fixed control heights.
- **Why**: User decision, shared with mobile.
- **Depends on**: D5

### D21 — Page title phone size
- **Question**: Which phone size does the Page title role use, given Foundations says "26–28"?
- **Decision**: 28 (`Sans/28 SemiBold/120% · -2% LS`). The 26 style (`Sans/26 SemiBold/110% · -2.5% LS`), used only for the large "Boards" title on the phone board list, is available as a raw text-style utility.
- **Alternatives**: 26.
- **Why**: The phone frames use 28. Aligned with mobile.
- **Depends on**: D5

### D22 — Location of single-feature components
- **Question**: Where do single-feature components (Card, Column, Board tile, Panel, ...) live?
- **Decision**: In `src/core/ui` with all other Design System components. They take plain props (title, key, label name and color, counts, timestamps as strings), never domain types.
- **Alternatives**: In the feature folders.
- **Why**: AGENTS.md ("implement the component in core/ui once") wins over the skill rule that one-feature components live in the feature; core can't import feature types.
- **Depends on**: D1

### D23 — Drag & drop states
- **Question**: How are Card Dragging, Card Placeholder and Drop indicator built without dnd-kit?
- **Decision**: As visual states set by props. The board view change wires them to dnd-kit.
- **Alternatives**: Add dnd-kit now.
- **Why**: dnd-kit isn't in the approved dependencies (D13).
- **Depends on**: D1, D13

## Facts

Facts looked up during the review that decisions rely on.

- Figma Color collection: 53 variables in Light and Dark modes, named like `background/app`, `text/on-accent`, `label/red`. Their WEB code syntax (`var(--fg)`) differs from the names and is missing on 26 of them — source: `use_figma`, `getLocalVariableCollectionsAsync`
- Figma Spacing collection: `space/1` to `space/16` in 1px steps, plus 18, 20, 22, 24, 25, 28, 32 — source: same
- Figma Radius collection: 1, 2, 4, 5, 6, 7, 8, 10, 12, 16, `full` (999) — source: same
- Figma Size collection: `height/control-sm` 30, `control-md` 34, `control-touch-sm` 38, `control-touch` 44, `input` 36, `icon-button-small`, `-medium`, `-large` (40) — source: same, and `get_variable_defs`
- 59 local text styles named `Sans|Mono/<size> <weight>/<line height>[ · <letter spacing>][ · Caps]`, and 7 effect styles: `Shadow/Small`, `Shadow/Popover`, `Shadow/Drag`, `Shadow/Panel`, `Shadow/Raised`, `Focus/Accent`, `Focus/Danger` — source: `getLocalTextStylesAsync`, `getLocalEffectStylesAsync`
- Foundations type roles: Page title 22 (phone 26–28), Screen title 18, Card title 13.5 (phone 14.5), Body 13.5 (phone 15), Label 12.5, ID & metadata Mono 11–12, Section label Mono 11 caps — source: Figma Foundations `9:2`
- Breakpoints (marked proposal): phone under 640px, tablet 640–1023px (sidebar 224, card panel 420), desktop from 1024px (sidebar 248, card panel 452); app 600/840dp — source: Figma Foundations `9:2`
- Design System page sections: Icons (27, 16×16, 1.6 stroke), Brand, Feedback, Labels, Data display, Inputs, Overlays, Board, Actions, Navigation, Boards, Card detail, Import & export — source: Figma Design System `9:3`
- Button has only Default and Disabled states; no hover, pressed, focus or loading variant — source: Figma `9:3`, Actions
- Toast has a close icon in both types — source: Figma `9:3`, Feedback
- Phone frames use Touch variants, tablet and desktop frames use Default — source: mobile session, Board list page
- Phone page titles use 28; 26 is only the large "Boards" title on the phone board list — source: mobile session
- The Overview page has no "UI decisions" list, although AGENTS.md says it does — source: `get_metadata` on `0:1`
- No shared design-token spec exists; `domain-label` lists the 20 label color names — source: `cardigan-shared-specs`
- The breakdown chunk `web-design-system` covers tokens, base components, layout primitives and previews — source: `cardigan-shared-specs` `docs/breakdown/chunks/07-web-design-system.md`
- None of radix-ui, cva, clsx, tailwind-merge, Geist fonts, jsdom/RTL or react-i18next is installed — source: `package.json`
- `.oxlintrc.json` blocks `@radix-ui/*` in features; the unified `radix-ui` package isn't covered — source: `.oxlintrc.json`

## Out of scope

- Feature screens, routes and the router
- Wiring drag & drop (dnd-kit); see D23
- Routing and assembling the app shell in `src/app`; see D19
- react-i18next and translation files
- Component tests, jsdom, RTL, MSW
- Updating the Figma Foundations page or any Figma edit (`update-figma-foundations`, mobile session)
- Designs for missing states (429, network error, offline, not found)

## Deferred

- None. A danger-button hover can be added if design later draws one.
