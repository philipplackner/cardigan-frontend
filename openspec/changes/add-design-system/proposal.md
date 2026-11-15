# Proposal

## Why

Every web screen in Figma is built from Design System instances and Foundations tokens, but `src/core/ui` is still empty: the theme file has no tokens and there are no components or icons. Feature changes can't start their UI until the design system exists in code, so this change builds it once, in full.

## What Changes

- **Theme tokens**: mirror every Figma variable and style in `src/core/ui/theme/` (D2–D5, D20, D21):
  - 53 color tokens with Light and Dark values that switch with the system theme, named after the Figma variables (`accent/default` → `bg-accent`).
  - 23 spacing steps, 11 radii and 8 size tokens. Class numbers equal Figma px (`p-12` = 12px), and only Figma steps exist.
  - One type utility per Figma text style (59), plus the 7 Foundations roles as semantic utilities with phone sizes. Text is set in `rem`, so it follows the user's text size.
  - 7 effect styles as shadow and focus-ring tokens.
  - Breakpoints `tablet` 640px and `desktop` 1024px, plus one "phone" condition (under 640px wide or under 480px high).
  - Tailwind's default palette, spacing and radius scales are removed.
- **Fonts**: Geist and Geist Mono, self-hosted.
- **Icons**: all 27 Figma icons as `currentColor` SVG components, rendered through `Icon` and `IconButton`.
- **Components**: every Figma Design System component in `src/core/ui`, with exactly its Figma variants (D1, D22):
  - Brand: Logo, Brand.
  - Feedback: Skeleton, Spinner, Banner, Toast, Empty state.
  - Labels: Label dot, Label, Label chip, Swatch, Label row.
  - Data display: Key, Avatar.
  - Inputs: Checkbox, Input, Text area, Password rule, Error message, Field, Option.
  - Overlays: Menu, Menu item, Menu divider, Popover, Dialog, Bottom sheet.
  - Board: Card, Column, Add card button, Add column button, Drop indicator.
  - Actions: Button, Icon button, Filter button.
  - Navigation: Nav item, Sidebar, Page header, App bar.
  - Boards: Board tile, Board row.
  - Card detail: Panel.
  - Import & export: File row, Drop zone.
- **Behavior Figma doesn't draw**:
  - Touch sizes on phones (D6, D15).
  - Hover, focus and loading states derived from tokens (D9).
  - Toast timing (D10), skeleton shimmer (D11).
  - The bottom sheet as a dialog (D12), text areas that grow (D17), a progress dialog that can't be closed (D18).
  - Controls that grow with larger text (D20).
  - Drag & drop states are visual only (D23).
- **Layout**: a responsive layout component with a sidebar or phone app bar, content, and an optional side panel (D19).
- **Preview page**: a dev-only second Vite entry that shows every component, variant and state. The production build leaves it out (D14).
- **Tooling and docs**: new dependencies (D13), the lint rule that keeps Radix out of features updated for the `radix-ui` package, and the `react-ui-components` skill updated for the full token set (D3).

Not breaking. No user-visible behavior changes until features use the components.

## Capabilities

### New Capabilities

- `web-design-system`: web-only behavior of the design system: theme follows the system setting, phone condition and Touch sizes, breakpoints and layout regions, text scaling, focus visibility, reduced motion, toast and overlay behavior, and the dev-only preview page.

### Modified Capabilities

None.

### Shared-spec requirements

- `domain-label` — *Label color is a palette name*: the label color tokens and the Label dot, Label, Label chip and Swatch components cover exactly the 20 palette names. This change depends on that requirement and implements nothing else from `cardigan-shared-specs`.

## Impact

- **Code**: `src/core/ui/` (theme, `cn`, icons, all components, layout), `src/index.css`, `src/main.tsx` (font imports), a new preview entry (HTML file and `src/preview/` or similar; see design.md).
- **Config**: `vite.config.ts` (preview entry, kept out of production builds), `.oxlintrc.json` (`radix-ui` restricted in features), `package.json`, `package-lock.json`.
- **New dependencies**: `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `@fontsource-variable/geist`, `@fontsource-variable/geist-mono`.
- **Docs**: `.claude/skills/react-ui-components/SKILL.md` (token tables, spacing, type, breakpoints, phone condition).
- **Not touched**: features, routing, i18n, tests beyond the existing ones, the Figma file. See decisions.md, Out of scope.
