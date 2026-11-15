# Tasks

Each group ends in its own commit once all five gates pass (`typecheck`, `lint`, `format:check`, `test`, `build`). "Check against Figma" means: open the group's preview section on the dev server at 390 px and 1440 px wide, in light and dark system themes, and compare it with `get_screenshot` of the Figma node. Look nodes up with `get_metadata` on page `9:3`; don't use node IDs copied from this file.

## 1. Dependencies and lint

- [x] 1.1 Install `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `@fontsource-variable/geist`, `@fontsource-variable/geist-mono` and verify `npm ls` lists them with no peer warnings
- [x] 1.2 Add `radix-ui` and `radix-ui/*` to the features restriction in `.oxlintrc.json`, add a case to `src/app/lintBoundaries.test.ts` for a feature importing `radix-ui`, and verify `npm test` passes and the new case fails without the rule

## 2. Theme tokens

- [x] 2.1 Export every Figma variable (Light and Dark), text style and effect style to a JSON file in the scratchpad with a read-only `use_figma` script, and verify the counts: 53 colors, 23 spacing, 11 radius, 12 size (including `width/sidebar-tablet`, `width/sidebar-desktop`, `width/panel-tablet`, `width/panel-desktop`), 59 text styles, 7 effect styles. If the 4 `width/*` variables are missing, `update-figma-foundations` hasn't been applied yet: stop and ask instead of hard-coding the values
- [x] 2.2 Write the color section of `theme.css` (raw `:root` values, dark `prefers-color-scheme` block, `color-scheme`, `@theme inline` mapping, default palette cleared) and verify `bg-accent` and `bg-label-teal` produce CSS while `bg-blue-500` does not
- [x] 2.3 Add spacing, radius, size, shadow and focus-ring tokens with the default scales cleared, and verify `p-12` is 12px, `min-h-control-touch` is 44px, `p-17` and `rounded-md` produce no CSS, and `min-w-[0]` and `inset-[0]` produce CSS while `min-w-0` does not
- [x] 2.4 Add the `phone`, `tablet` and `desktop` custom variants and remove the default breakpoints. Verify `sm:` produces no CSS, `phone:` compiles to the width-or-height media query, and `w-sidebar-tablet` is 224px
- [x] 2.5 Import the Geist fonts in `src/main.tsx`, set the sans and mono font tokens, and verify in the built `dist/` that the woff2 files are bundled same-origin
- [x] 2.6 Add one `type-*` utility per Figma text style (sizes in rem) plus the 7 semantic role utilities with phone sizes (Page title 28 on phones), and verify the generated CSS has 59 raw and 7 role utilities, and that `font-bold` and `leading-tight` produce no CSS
- [x] 2.7 Add `src/core/ui/cn.ts` with `clsx`, `tailwind-merge` and an `extendTailwindMerge` config for the `type-*` group and the named spacing, size and radius scales, and add a unit test that `cn('type-body', 'text-text-muted')` keeps both classes and `cn('p-12', 'p-8')` keeps `p-8`

## 3. Preview page

- [x] 3.1 Add `preview.html` and `src/preview/main.tsx` with an empty section per Figma Design System section plus a Foundations section showing all color, spacing, radius, shadow and type tokens. Verify the page loads on the dev server, uses Geist and the theme tokens, and `npm run build` produces no preview file or chunk in `dist/`
- [x] 3.2 Check the Foundations preview section against Figma Foundations `9:2` in both themes

## 4. Icons and brand

- [x] 4.1 Export all 27 icons from Figma as `<Name>Icon.tsx` in `src/core/ui/icons/`, with `currentColor`, the Figma `viewBox` and no fixed size. Verify all 27 render on the preview page and change color with the parent's text color
- [x] 4.2 Add `Icon` (decorative by default, optional `label`) and `IconButton` (required `label`, Ghost/Boxed × Default/Selected × Small/Medium/Large, Touch size on phones), and check them against Figma
- [x] 4.3 Add `Logo` and `Brand` (Sidebar, App bar, Auth sizes) from the Figma assets, and check them against Figma

## 5. Actions

- [x] 5.1 Add `Button` (Primary, Secondary, Ghost, Danger, Danger ghost × Small/Medium with Touch pairs, Disabled, loading, optional leading icon, `asChild`) with hover, focus-visible and loading per D9. Check against Figma, and check by hand that a loading button ignores clicks and Enter, that Enter in a form field doesn't submit while the submit button is loading, and that danger buttons don't change on hover
- [x] 5.2 Add `FilterButton` (Default, Active) and check it against Figma

## 6. Inputs

- [x] 6.1 Add `Input` (Default, Focus, Error, Read-only, Disabled; Touch on phones; `ref` passed to the input; `aria-invalid` in error) and check it against Figma, including the focus rings
- [x] 6.2 Add `TextArea` (Multi-line, Title, Description; Default, Focus, Error) that grows with content per D17, check it against Figma, and check by hand that a three-line title shows all text without a scrollbar, both when typed and when shown with an existing value, and after narrowing the viewport
- [x] 6.3 Add `Field` (label with `htmlFor`/`useId`, control slot, help or `ErrorMessage` linked with `aria-describedby`), `ErrorMessage` and `PasswordRule` (Met true/false, not color-only), and check them against Figma
- [x] 6.4 Add `Checkbox` and `Option` (Default, Highlighted; Touch on phones), and check them against Figma, including keyboard toggling with Space

## 7. Feedback

- [x] 7.1 Add `Spinner` (Small, Large, inherits color) and `Skeleton` with the 1.2s shimmer. Check them against Figma, and check by hand that the shimmer stops when the OS reduced-motion setting is on
- [x] 7.2 Add `Banner` (Error, Info) and `EmptyState` (Default, Error, Actions slot), and check them against Figma
- [x] 7.3 Add `ToastProvider` and `useToast()` per D10. Check them against Figma, and check by hand on the preview page: success closes after 4 s, the timer pauses while hovered, error stays, a second toast replaces the first, swiping right closes it, the close button works, and toasts don't slide under reduced motion

## 8. Labels and data display

- [x] 8.1 Export the 20-name label color type and add `LabelDot`, `Label` (Small, Medium, Large), `LabelChip` (optional remove action with required label) and `Swatch`. Check them against Figma, and verify a non-palette color name is a type error
- [x] 8.2 Add `Key` and `Avatar`, and check them against Figma

## 9. Overlays

- [x] 9.1 Add `Menu`, `MenuItem` (Default, Highlighted, Danger, Disabled, Header; Touch on phones) and `MenuDivider`. Check them against Figma, and check by hand: arrow keys move the highlight, and Escape closes and returns focus to the trigger
- [x] 9.2 Add `Popover` and check it against Figma, including Escape and outside click closing
- [x] 9.3 Add `Dialog` (Default with Content and Actions slots, Progress; Touch on phones). Check it against Figma, and check by hand: focus is trapped, Escape and scrim close the default dialog, and nothing closes the progress dialog
- [x] 9.4 Add `BottomSheet` (Dialog-based, no drag). Check it against Figma, and check by hand that scrim tap and Escape close it and that it doesn't slide under reduced motion

## 10. Navigation and layout

- [x] 10.1 Add `NavItem` (Default, Selected, Dim, truncating name), `Sidebar` (Brand, nav, Boards slot, account footer) and `PageHeader` (title, count, Actions slot), and check them against Figma
- [x] 10.2 Add `AppBar` (Brand, Title, Centered × Raised) and check it against Figma
- [x] 10.3 Add `AppLayout` per D19 and D24, sized only with the `w-sidebar-*` and `w-panel-*` tokens, with a preview section that composes Sidebar, AppBar, content and Panel. Check by hand at 390×844, 844×390, 834×1194, 1280×420 and 1440×900 that the regions and widths match the spec's layout scenarios, and that Tab never leaves the open panel on a phone

## 11. Board, boards, card detail, import & export

- [x] 11.1 Add `Card` (Default, Selected, Dragging, Placeholder as props; Touch on phones), `Column` (header with name, count and menu slot, Cards slot, Add card), `AddCardButton`, `AddColumnButton` and `DropIndicator`, and check them against Figma
- [x] 11.2 Add `BoardTile` (Default, Hover) and `BoardRow`, and check them against Figma
- [x] 11.3 Add `LabelRow` (Default, Touch) and `Panel` (header, Body and Footer slots, close with required label), and check them against Figma
- [x] 11.4 Add `FileRow` and `DropZone` (Default, Over, browse button, `onFiles`). Check them against Figma, and check by hand that dragging a file over shows Over, moving over the zone's text keeps Over, leaving resets it, dragging selected text shows no Over, dropping hands the file to `onFiles` without navigating, and Enter on browse opens the file picker

## 12. Documentation

- [x] 12.1 Update `.claude/skills/react-ui-components/SKILL.md` per design.md, Skill update, and verify every token name and class in its examples exists in `theme.css`

## 13. Integration checks

- [ ] 13.1 Diff the token values in `theme.css` against a fresh Figma export and verify there are no mismatches
- [ ] 13.2 With the browser default font size at 24 px, check every preview section: no clipped text in controls, and single-line labels truncate
- [ ] 13.3 Switch the OS theme while the preview page is open and verify all sections change without a reload
- [ ] 13.4 Run all five gates, run `openspec validate add-design-system --strict`, and verify `dist/` contains no preview page
- [ ] 13.5 Serve `dist/` with `Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'` and check that opening a dialog locks page scroll and the console shows no CSP violation

## Workflow follow-up

- Archive the change after review, following the archive guidance in `openspec/config.yaml`.
