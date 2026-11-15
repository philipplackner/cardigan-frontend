# Design

## Context

See proposal.md for why. The scaffold change left `src/core/ui/theme/theme.css` with an empty `@theme` block imported from `src/index.css`. Tailwind v4 runs through `@tailwindcss/vite`, and the React Compiler is on. `.oxlintrc.json` enforces core/feature boundaries and blocks `@radix-ui/*` in features. There is no i18n and no DOM test environment. Scope and every product-facing choice are fixed in decisions.md (D1–D23). This document describes how they fit together.

## Goals / Non-Goals

**Goals:**
- Every Figma variable and style exists as exactly one theme token. Classes that aren't Figma values produce no CSS.
- Feature changes build screens from `@/core/ui` alone, without reading Foundations again.
- The phone condition and breakpoints are defined in one file.
- The preview page lets a reviewer compare each component with Figma, in both themes and at phone and desktop sizes.

**Non-Goals:**
- Wiring components to data, routes, translations or dnd-kit.
- Automated visual or component tests (D13).
- Keeping tokens in sync with Figma automatically. Token updates stay a manual change, as the skill describes.

## Decisions

### Token pipeline: read once from Figma, commit CSS

During apply, one read-only `use_figma` script exports every variable (both modes), text style and effect style as JSON to the scratchpad. `theme.css` is written from that JSON and committed. No generator script or JSON is committed.

Alternative: commit a tokens JSON plus a generator script. Rejected. Figma can't be read in CI, so the script would only replace one manual step with another, and the mobile session owns any shared-token format.

### Theme file layout

`src/core/ui/theme/theme.css` holds, in order:

1. **Raw color values.** `:root` sets the Light values as private variables (`--c-accent: #2b59f0`). `@media (prefers-color-scheme: dark) { :root { ... } }` sets the Dark values. `:root` also sets `color-scheme: light dark` so form controls and scrollbars follow the theme.
2. **`@theme inline`** maps public tokens to those variables (`--color-accent: var(--c-accent)`). It first clears the defaults with `--color-*: initial`, `--spacing-*: initial`, `--radius-*: initial`, `--text-*: initial`, `--shadow-*: initial`, `--breakpoint-*: initial`, `--font-weight-*: initial`, `--leading-*: initial`, `--tracking-*: initial`, `--container-*: initial`, `--blur-*: initial`, `--drop-shadow-*: initial` and `--inset-shadow-*: initial`, so Tailwind's default palette and scales are gone.
3. **Static tokens** in a normal `@theme` block: spacing, radius, size, shadows, font families.
4. **Custom variants and utilities**: the phone, tablet and desktop variants, type utilities, the shimmer keyframes.

Token naming follows D2: `/` becomes `-` and a trailing `/default` is dropped. That gives `background/app` → `--color-background-app`, `accent/default` → `--color-accent`, `label/teal` → `--color-label-teal`, `shadow/drag-1` → `--color-shadow-drag-1`. Shadow colors are only referenced by the shadow tokens.

Alternative: `light-dark()` per token. Rejected because AGENTS.md describes the swap as variables under `prefers-color-scheme`, and one dark block is easier to diff against Figma's Dark mode.

### Spacing, radius and size

- Spacing (D4) uses named steps only: `--spacing-1: 1px` through `--spacing-32: 32px`, for the 23 Figma steps. With the multiplier cleared, `p-17` produces no CSS.
- Figma has no 0 step, so bare-number classes such as `min-w-0`, `inset-0` and `p-0` produce no CSS. Zero values use arbitrary values (`min-w-[0]`, `inset-[0]`, `p-[0]`); the skill update lists this.
- Radius: `--radius-1` … `--radius-16`, and `--radius-full: 999px`.
- Size: `height/control-touch` → `--spacing-control-touch: 44px`, used as `min-h-control-touch` (D20). Tailwind v4 reads `--spacing-*` for `h-*`, `min-h-*`, `size-*`, `w-*`, so all 12 size tokens become spacing-namespace names. That covers the 8 height variables and the 4 layout widths (D24): `width/sidebar-tablet` → `--spacing-sidebar-tablet`, used as `w-sidebar-tablet`. They never collide with the numeric steps.
- Spacing and sizes stay in px. Only text scales with the user's font size (D20). Page zoom still scales everything.

### Typography

- Fonts: `@fontsource-variable/geist` and `@fontsource-variable/geist-mono` are imported once in `src/main.tsx`. `--font-sans: 'Geist Variable', ...` and `--font-mono: 'Geist Mono Variable', ...` are set in the theme. Fontsource ships the woff2 files, so Vite bundles them same-origin, as the CSP needs.
- **Raw style utilities (D5).** Each of the 59 Figma text styles becomes one `@utility`. It sets family, size in `rem` (px ÷ 16), weight, line height as a unitless ratio, letter spacing in `em`, and `text-transform: uppercase` for `Caps`. The name follows the style: `Sans/13.5 Medium/145%` → `type-sans-13.5-medium-145`, and `Mono/11 Medium/100% · +6% LS · Caps` → `type-mono-11-medium-100-ls6-caps` (D5). A letter-spacing suffix becomes `ls<n>` or `ls-<n>`.
- **Semantic roles.** The 7 Foundations roles are utilities that apply a raw style and switch to the phone size inside the phone variant. Page title is 22 → 28 on phones (D21), Card title 13.5 → 14.5, Body 13.5 → 15. The 26 style stays raw only.
- Screens use the semantic roles. Components use whatever raw style their Figma node has.
- `cn` registers `type-*` as its own class group with `extendTailwindMerge`, so `cn('type-body', className)` merges correctly against `text-*` colors.

### Phone condition and breakpoints

Breakpoints include a height condition (D8, D15), and Tailwind's `--breakpoint-*` only covers width. So the theme defines custom variants instead:

```css
@custom-variant phone   (@media (width < 640px), (height < 480px));
@custom-variant tablet  (@media (width >= 640px) and (height >= 480px));
@custom-variant desktop (@media (width >= 1024px) and (height >= 480px));
```

These three lines are the only place the numbers appear. Components are written desktop-first for size (Default classes, then `phone:` overrides to Touch), because the Default variant is the base in Figma. Layout code uses `tablet:` and `desktop:`. Default Tailwind breakpoints (`sm:`, `md:`) are removed.

Alternative: a JS `useIsPhone()` hook. Rejected. CSS has no first-render flash and needs no listener. A hook can be added later if a feature needs to branch in JS.

### Components

- **Location (D22).** One file per component, PascalCase, flat in `src/core/ui/`, as in the skill. Exceptions: `icons/` and `theme/`, plus `layout/` for the layout component and its regions. Named exports only.
- **Variants.** Each component uses `cva` with Figma's variant names in camelCase (`style: 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerGhost'`, `size: 'small' | 'medium'`). Touch sizes are not a prop: each Default size has its Touch pair applied under `phone:` (D6). Button `small` pairs with `Touch small`, and `medium` pairs with `Touch`.
- **Behavior from Radix**, through the unified `radix-ui` package:

| Figma component | Built on |
|---|---|
| Dialog, Bottom sheet | `Dialog` (the sheet is styled at the bottom edge, with no drag) |
| Menu, Menu item, Menu divider | `DropdownMenu` |
| Popover | `Popover` |
| Checkbox, Option | `Checkbox` |
| Toast | `Toast` |
| Button, Icon button | `Slot` for `asChild` |

  Everything else is plain elements.
- **Props.** Components take plain data (D22), for example `Card: { id: string; title: string; labels: { name; color }[]; isSelected; isDragging; isPlaceholder }`. Label colors are typed as the 20-name union exported from `core/ui`. Every visible or accessible string comes in as a prop (D14). Required string props cover close labels, so a missing label is a type error.
- **Undrawn states (D9).** Hover uses Tailwind's `hover:`, which v4 limits to hover-capable devices. Focus uses `focus-visible:` with the `Focus/Accent` shadow on buttons and other controls. Inputs and text areas use `focus:`, because Figma draws their Focus state for any focus, with `Focus/Danger` in the error state. A loading `Button` sets `aria-busy` and `aria-disabled`, calls `preventDefault()` on clicks (which also blocks implicit form submission) without calling `onClick`, and swaps the leading icon for `Spinner`.
- **Text areas (D17)** grow by setting `height` from `scrollHeight` on mount, on input, and when a `ResizeObserver` reports a width change, all from a ref callback. `field-sizing: content` isn't in Firefox or the previous Safari major, so it's not used.
- **Truncation (D20).** Single-line labels (nav items, menu items, board names, label names, file names, app bar titles) use `truncate` and `min-w-[0]` on their flex parent.
- **Progress dialog (D18).** The `type="progress"` dialog prevents `onEscapeKeyDown` and `onPointerDownOutside` and renders no close control.
- **Drag states (D23).** `isDragging` applies a 2.2° rotation and `Shadow/Drag`. `isPlaceholder` renders the dashed gap. `DropIndicator` is a plain element. No pointer handling.
- **Drop zone.** It handles `dragenter`, `dragover` and `drop` with `preventDefault()`, and tracks enter/leave with a depth counter so moving over child elements keeps the Over state. Only drags whose `dataTransfer.types` include `Files` show Over, and drops without files are ignored. It accepts one file (no `multiple` on the input), plus a visually hidden `<input type="file">` whose browse button opens the picker. It hands back `File[]` through `onFiles`. File type and size checks belong to the transfer feature.

### Toast (D10)

`ToastProvider` (placed in `src/app` later) and `useToast()` live in `core/ui`. State is one slot: `show({ type, message })` replaces whatever is showing, using a new key so Radix animates the swap. Success uses `duration={4000}`. Error uses `duration={Infinity}`. The viewport is fixed bottom center. `closeLabel` is a required provider prop. Radix's defaults stay on: the timer pauses on hover, focus and window blur, and `swipeDirection="right"` closes on swipe.

### Motion

Dialog, bottom sheet and toast enter and exit animations are applied under `motion-safe:` only, so under reduced motion they appear and disappear without sliding or scaling. The bottom sheet is meant for phones only; screens use Dialog or Menu elsewhere.

### Skeleton (D11)

A `background-image` gradient between `skeleton` and `skeleton-highlight`, animated with a `shimmer` keyframe on `background-position` over 1.2s, applied under `motion-safe:`. Under reduced motion it's the plain skeleton color.

### Layout component (D19)

`AppLayout` in `core/ui/layout/` takes `sidebar`, `appBar`, `panel` (optional) and `children` slots:

- **Phone:** `appBar` on top, `children` below. When `panel` is set, it renders fixed over the whole viewport (`inset-[0]`) and the layout sets `inert` on the content region. The sidebar is not rendered.
- **Tablet and desktop:** CSS grid with the sidebar (`w-sidebar-tablet`, `desktop:w-sidebar-desktop`), the content, and the panel in the right column when present (`w-panel-tablet`, `desktop:w-panel-desktop`). The app bar is not rendered.

The widths come from the Figma Size collection variables `width/sidebar-tablet` (224), `width/sidebar-desktop` (248), `width/panel-tablet` (420) and `width/panel-desktop` (452), like every other token (D24). These variables only exist once the mobile-owned `update-figma-foundations` change has been applied to the Figma file, so task 2.1 checks for them first.

### Preview page (D14)

`preview.html` at the repo root loads `src/preview/main.tsx`. Vite's dev server serves any root HTML file. `vite build` only bundles `index.html` unless more inputs are configured, so the preview is left out without extra config. `src/preview/` has one section per Figma section, with the same order and names. Long-text and empty-slot cases appear per component. Preview text is exempt from i18n. The preview entry imports `@/index.css` and the two Fontsource packages, exactly like `src/main.tsx`, and otherwise only `@/core/ui`.

Alternative: a route in the app guarded by `import.meta.env.DEV`. Rejected. There's no router yet, and a separate entry can't leak into production.

### Lint

`.oxlintrc.json` adds `radix-ui` and `radix-ui/*` to the features restriction group, next to `@radix-ui/*`. `src/app/lintBoundaries.test.ts` gets one case proving a feature file importing `radix-ui` fails lint. That is a lint test, not a component test, so it's still within D13.

### Skill update (D3)

`.claude/skills/react-ui-components/SKILL.md` is updated in the same change:
- The token tables cover all color groups.
- Spacing is the Figma px steps (`p-12`). Zero values use arbitrary values (`min-w-[0]`).
- The type section covers raw style utilities plus roles.
- Breakpoints become the three custom variants and the phone condition.
- Control heights are minimums.
- Single-feature design system components live in `core/ui` (D22).
- `radix-ui` replaces `@radix-ui/*`.

## Risks / Trade-offs

- [No component tests (D13): regressions show up only on the preview page] → Each task ends with a side-by-side check of its preview section against `get_screenshot` of the Figma node, in both themes, at 390 px and 1440 px. Behavior from the spec (Escape, focus return, toast timing) is checked by hand on the preview page and listed in tasks.
- [About 45 components in one change is large to review] → Tasks follow the Figma sections, and each section is its own commit with the gates passing.
- [Hand-transcribing 53 × 2 colors and 59 text styles can introduce typos] → Transcribe from the exported JSON, never from screenshots. The final task diffs the token values in `theme.css` against a fresh Figma export.
- [The height-based phone condition puts short desktop windows (under 480 px high) in the phone layout] → Accepted by D8. It matches the app.
- [Text in `rem` and spacing in `px` can make large text feel cramped] → Control heights are minimums and labels truncate (D20). Check at 24 px default font size on the preview page.
- [The layout width variables depend on `update-figma-foundations` being applied first] → Task 2.1 checks for the 4 `width/*` variables and stops if they're missing, instead of hard-coding the values.
- [Radix's scroll lock injects a `<style>` element] → The hosting CSP must allow it (`style-src 'self' 'unsafe-inline'`). Note this in `react-security` when hosting is set up. Task 13.5 checks it.
- [Single-feature components in `core/ui` grow the shared surface] → They take plain props only, so they stay free of domain types and can move into a feature later without API changes.

## Open Questions

- If Tailwind rejects a specific raw style name, adjust the naming rule during apply and record it in the skill. Only names change; no spec or task changes.
