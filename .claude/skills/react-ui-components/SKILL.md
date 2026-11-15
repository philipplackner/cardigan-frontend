---
name: react-ui-components
description: |
  Building React UI components for SPAs styled with Tailwind CSS v4 and a token-based design system in core/ui that mirrors the Figma Design System and Foundations - Figma variable names as theme tokens, Figma text styles as type utilities, shadcn/ui components copied in and restyled on Radix primitives, the cn helper and cva variants, prop design (className passthrough, native prop spreading, ref as a prop), icons exported from Figma as SVG components, the Icon and IconButton wrappers, slots through children and asChild, theme tokens instead of raw colors or dark: variants, light and dark following the system, user-facing text through react-i18next (namespaces, typed keys, plurals, interpolation, date and number formatting), accessibility basics, and dev-only previews for every design system component. Use this skill whenever writing or changing a component that is not a Root/Screen (buttons, cards, list items, inputs, dialogs, menus, toolbars), adding a design system component, adding an icon, styling with Tailwind, adding translations, or reviewing accessibility. For Root/Screen components, see react-presentation-mvi. Trigger on phrases like "create a component", "Figma component", "SVG", "button", "card", "dialog", "input", "text field", "dropdown", "menu", "shadcn", "Radix", "Tailwind", "className", "cn", "cva", "variant", "icon", "IconButton", "design system", "theme", "color", "dark mode", "token", "translation", "i18n", "t(", "useTranslation", "plural", "format date", "aria-label", "accessibility", "a11y", or "preview".
---

# React UI Components

## Scope

This skill covers every component that is not a page-level Root or Screen: design system components in `src/core/ui/` and feature components in `src/features/<feature>/components/`.

- Every component on the Figma **Design System** page lives in `core/ui`, including the ones only one feature uses (Card, Column, Board tile, Panel, Drop zone, ...). They take plain props (strings, numbers, label colors), never domain types, so `core` never imports a feature.
- A feature component that isn't on the Design System page lives in that feature. It moves to `core/ui` when a second feature needs it. It then loses every feature-specific word: all text comes in through props.

---

## The Design System (`core/ui`)

`core/ui` is the code version of the Figma file's **Design System** page (components) and **Foundations** page (tokens). Figma is the source of truth: a component's variants, sizes, states and slots are the ones in Figma, no more and no fewer.

`core/ui` is the only place that imports Radix, through the unified `radix-ui` package (`import { Dialog } from 'radix-ui'`). Features import from `@/core/ui`, which lint enforces for both `radix-ui` and `@radix-ui/*` (see **react-project-structure**).

Everything is exported from `src/core/ui/index.ts`. Icons are also available as a namespace: `import { icons } from '@/core/ui'`.

### From Figma to `core/ui`

1. Find the component on the Design System page and read it with the Figma MCP (`get_design_context`, `get_screenshot`). If the MCP call fails, stop and report it. Never build a component from a guess.
2. Build it as described below, with the variants Figma defines.
3. Add a preview section (see [Previews](#previews)).

### shadcn/ui as the base

shadcn/ui components are copied into the project, not installed as a package. They give us Radix behavior (focus handling, keyboard support, ARIA) and a component structure. Their look is replaced with our tokens.

To add one:

1. Generate it with the shadcn CLI (or copy it from the docs) into `src/core/ui/`.
2. Replace every shadcn color and radius class (`bg-primary`, `text-muted-foreground`, `rounded-md` from their scale) with the project's token classes.
3. Rename the file to PascalCase and switch to named exports, `type` and our prop conventions below.
4. Remove variants the Figma component doesn't have, and add the ones it has.
5. Add a preview section (see [Previews](#previews)).

Like Material 3 on Android, the library is the starting point for behavior, not for the visual design.

### `cn` and variants

`cn` (`src/core/ui/cn.ts`) is `clsx` plus a `tailwind-merge` extended for this theme: the `type-*` utilities are their own class group (they conflict with font size, weight, family, line height and tracking, not with `text-*` colors), and the named size, radius and shadow tokens are registered so `cn('min-h-control-sm', 'min-h-control-touch')` keeps the last one. Register new custom utilities there too.

```tsx
// Shortened from src/core/ui/Button.tsx
const buttonVariants = cva(
  'inline-flex max-w-full min-w-[0] items-center justify-center gap-7 rounded-6 whitespace-nowrap outline-none focus-visible:shadow-focus-accent disabled:opacity-45',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-text-on-accent not-disabled:not-aria-disabled:hover:bg-accent-hover',
        secondary: 'border border-border-strong bg-background-surface text-text-primary shadow-small',
        danger: 'bg-danger text-text-on-danger',
      },
      size: {
        small: 'min-h-control-sm px-10 type-sans-13-medium-100 phone:min-h-control-touch-sm phone:px-16 phone:type-sans-14-medium-100',
        medium: 'min-h-control-md px-13 type-sans-13.5-medium-100 phone:min-h-control-touch phone:px-16 phone:type-sans-15-medium-100',
      },
    },
    defaultVariants: { variant: 'primary', size: 'medium' },
  },
)
```

- Variants use `cva`, as shadcn does. Variant values are the Figma variant names in camelCase (`dangerGhost` for "Danger ghost"). The prop is `variant`, not `style`, because `style` is the React style prop.
- **Touch sizes are not a prop.** Components with Default and Touch variants in Figma write the Default classes first and the Touch pair under `phone:` (see [Breakpoints](#breakpoints-and-the-phone-condition)). Components without a Touch variant in Figma (Icon button, for example) keep their size on phones; the screen picks the size Figma uses.
- **States Figma doesn't draw** come from existing tokens: primary hover is `accent-hover`, secondary, ghost and icon button hover is `background-hover`, danger buttons don't change on hover, keyboard focus is `shadow-focus-accent`. Inputs and text areas show their Figma Focus state on any focus (`focus:` / `focus-within:`), and the danger ring in their error state.

---

## Styling with Tokens

- **Colors, radii, spacing, breakpoints and type styles come only from the theme.** The theme replaces Tailwind's default palette, so `bg-blue-500` produces no CSS.
- **No raw values.** No hex colors in components, no arbitrary values like `bg-[#fff]` or `p-[13px]`. Arbitrary values can't be blocked by lint, so review catches them.
- **No `dark:` variants.** Each token class points at a CSS variable, and the theme swaps the variable values under `prefers-color-scheme: dark`. `bg-background-surface` is correct in both themes. The theme always follows the system. There is no in-app theme switch.
- The theme lives in `src/core/ui/theme/`. Read values with the Figma MCP (`get_variable_defs`), never from screenshots.

### Token names come from Figma

Every Figma variable and style is exactly one theme token in `src/core/ui/theme/theme.css`. The name follows the Figma variable: `/` becomes `-`, and a trailing `/default` is dropped. There is no token without a Figma variable.

| Figma variable | Theme variable | Example class |
|---|---|---|
| `background/app`, `surface`, `column`, `sidebar`, `hover`, `skeleton`, `skeleton-highlight`, `scrim`, `toast` | `--color-background-app`, ... | `bg-background-surface` |
| `text/primary`, `muted`, `faint`, `on-accent`, `on-danger`, `toast` | `--color-text-primary`, ... | `text-text-muted` |
| `border/default`, `strong`, `accent-subtle`, `danger-subtle` | `--color-border`, `--color-border-strong`, ... | `border-border`, `border-border-strong` |
| `accent/default`, `hover`, `soft` | `--color-accent`, `--color-accent-hover`, `--color-accent-soft` | `bg-accent`, `bg-accent-soft` |
| `danger/default`, `soft`; `success/default`, `soft` | `--color-danger`, `--color-danger-soft`, `--color-success`, ... | `text-danger`, `bg-success` |
| `label/red` ... `label/slate` (20 colors) | `--color-label-red`, ... | `bg-label-teal` |
| `shadow/small`, `popover-1`, ... | `--color-shadow-small`, ... | only used inside the shadow tokens |
| `space/1` ... `space/32` (23 steps) | `--spacing-1` ... `--spacing-32` | `p-12`, `gap-7` |
| `radius/1` ... `radius/16`, `radius/full` | `--radius-1` ... `--radius-full` | `rounded-6`, `rounded-full` |
| `height/control-sm`, `control-md`, `control-touch-sm`, `control-touch`, `input`, `icon-button-small`, `-medium`, `-large` | `--spacing-control-sm`, ... | `min-h-control-md`, `size-icon-button-small` |
| `width/sidebar-tablet`, `sidebar-desktop`, `panel-tablet`, `panel-desktop` | `--spacing-sidebar-tablet`, ... | `w-sidebar-tablet desktop:w-sidebar-desktop` |
| Effect styles `Shadow/Small`, `Popover`, `Drag`, `Panel`, `Raised` | `--shadow-small`, ... | `shadow-popover` |
| Effect styles `Focus/Accent`, `Focus/Danger` | `--shadow-focus-accent`, `--shadow-focus-danger` | `focus-visible:shadow-focus-accent` |

- Colors swap through private variables (`--c-accent`) under `prefers-color-scheme: dark`. Components only use the public token classes.
- Tailwind's default palette, spacing scale, radii, text sizes, shadows, breakpoints, font weights, line heights and letter spacings are removed. `bg-blue-500`, `p-17`, `rounded-md`, `text-sm`, `font-bold` and `leading-tight` produce no CSS.
- **Spacing classes are Figma px.** `p-12` is 12 px, `gap-5` is 5 px. Only the 23 Figma steps exist (1–16, 18, 20, 22, 24, 25, 28, 32). Spacing and sizes stay in px; only text scales with the user's font size.
- **Zero has no step.** `min-w-0`, `inset-0` and `p-0` produce no CSS. Write zero values as `min-w-[0]`, `inset-[0]`, `p-[0]`.
- **Control heights are minimums** (`min-h-control-md`, not `h-control-md`), so controls grow when the user's text is larger. Single-line labels use `truncate` with `min-w-[0]` on their flex parent instead of wrapping.
- Values Figma draws without a variable (a 44 px icon box, a 276 px column) are arbitrary values taken from the Figma node. Anything else arbitrary is a review finding.
- All token variables are emitted (`@theme static`), so `var(--color-label-teal)` also works in inline styles.

### Type

- **Raw text styles.** Each of the 59 Figma text styles is one utility named after it: `Sans/13.5 Medium/145%` → `type-sans-13.5-medium-145`, `Sans/18 SemiBold/120% · -1.5% LS` → `type-sans-18-semibold-120-ls-1.5`, `Mono/11 Medium/100% · +6% LS · Caps` → `type-mono-11-medium-100-ls6-caps`. Each sets family, size in `rem`, weight, line height, letter spacing and caps. Components use the style their Figma node has.
- **Roles.** The 7 Foundations roles are `type-page-title`, `type-screen-title`, `type-card-title`, `type-body`, `type-label`, `type-metadata` and `type-section-label`. They switch to the phone size by themselves (Page title 22 → 28, Card title 13.5 → 14.5, Body 13.5 → 15). Screens use the roles.
- Don't combine `text-*` sizes, `font-*` weights or `leading-*` by hand; those scales don't exist.
- Fonts are Geist and Geist Mono from Fontsource, imported in `src/main.tsx` (`font-sans`, `font-mono`).

### Breakpoints and the phone condition

The theme defines three custom variants. These are the only place the numbers appear:

| Variant | Condition | Use |
|---|---|---|
| `phone:` | narrower than 640 px **or** lower than 480 px | Touch sizes, phone layout |
| `tablet:` | at least 640 × 480 | layout from tablet up |
| `desktop:` | at least 1024 px wide and 480 px high | desktop widths |

- Tailwind's `sm:`, `md:`, `lg:` don't exist.
- Write components desktop-first for size: Default classes, then `phone:` overrides.
- When JS needs to know the layout, read it from the CSS (see `AppLayout`, which checks whether the panel is `position: fixed`) instead of repeating the numbers in a media query string.
- `AppLayout` (`core/ui/layout/`) owns the app shell: sidebar or phone app bar, content, and the optional side panel, sized with the `w-sidebar-*` and `w-panel-*` tokens.

### Motion

Overlays (dialogs, sheets, menus, popovers, toasts) animate only under `motion-safe:` with the `animate-*` tokens in the theme, so they appear without sliding or scaling under reduced motion. The skeleton shimmer (`skeleton-shimmer`) is static under reduced motion.

---

## Prop Design

```tsx
type NoteCardProps = {
  note: Note
  isSelected: boolean
  onSelectedChange: (selected: boolean) => void
  className?: string
}
```

- **Props in order:** required data first, then state, then callbacks, then `className`.
- **`className` is the `Modifier`.** Every component that renders an element accepts `className` and merges it onto the outer element with `cn`. The parent controls placement and spacing (margin, width, grid position). The component controls its own look.
- **Wrapping a native element:** take `ComponentProps<'button'>` (or the element in question) and spread the rest onto it, so `type`, `aria-*`, `data-*` and event handlers pass through.
- **`ref` is a regular prop** in React 19. No `forwardRef`. Input components must pass `ref` to the `input` so React Hook Form's `register` works.
- **Booleans** read as a state: `isSelected`, `isLoading`. Native names stay native: `disabled`, `required`.
- **Callbacks** are `on<Event>`: `onClick`, `onSelectedChange`. A controlled value is `value` + `onValueChange` (or `open` + `onOpenChange`), matching Radix.
- **Pass the smallest thing the component needs.** A component that shows a title and a date gets `title` and `updatedAt`, or the domain object if it really uses most of it. Never pass a query result object or the whole screen state.

### Local state

Components may hold state that only affects how they look: hover, a menu being open, a tooltip, which tab of a self-contained widget is active. Make it controlled (`open`/`onOpenChange`) only when a parent needs to drive it. Radix components already manage their own open state when uncontrolled.

---

## Icons

```tsx
<Icon icon={PlusIcon} />                                  // 16 px, hidden from screen readers
<Icon icon={StarIcon} size={19} label={t('notes:favorite')} />
<IconButton icon={TrashIcon} label={t('notes:delete')} size="small" onClick={...} />
```

Icons are SVGs exported from Figma. There is no icon library.

```tsx
// src/core/ui/icons/TrashIcon.tsx
export function TrashIcon(props: ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.13333}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="..." />
    </svg>
  )
}
```

- One file per icon in `src/core/ui/icons/`, named `<Name>Icon.tsx` after the Figma icon. Add an icon when a feature first needs it, exported from Figma with the MCP. Never draw or copy an icon from somewhere else.
- Replace every hard-coded fill and stroke color with `currentColor`. Keep the `viewBox` from Figma, remove fixed `width` and `height`.
- Icons are rendered through `Icon` or `IconButton` from `core/ui`, which limit size to the sizes Figma uses (12, 13, 15, 16, 19, 20, 24). Never render an icon component directly. All 27 Figma icons exist; add one only when Figma adds one.
- An icon next to visible text has no label and is hidden from assistive technology.
- An icon-only button requires `label`. `IconButton` makes it a required prop, so a missing label is a type error.
- Icon color follows the text color (`currentColor`). Set color on the parent with a token class.

---

## Slots

- `children` is the main slot.
- Named slots are `ReactNode` props: `leading`, `trailing`, `actions`.
- To render a design system component as another element, use Radix's `asChild` (`<Button asChild><Link to="/notes">...</Link></Button>`). That keeps the link a real link with button styling.

---

## Text and Translations

All user-facing text comes from translation files through react-i18next. Text only shown on the dev-only preview page is exempt.

```tsx
const { t } = useTranslation('notes')

<h2>{t('list.title')}</h2>
<p>{t('list.count', { count: notes.length })}</p>
<p>{t('list.updated', { date: note.updatedAt })}</p>
```

```json
{
  "list": {
    "title": "Notes",
    "count_one": "{{count}} note",
    "count_other": "{{count}} notes",
    "updated": "Updated {{date, datetime(dateStyle: medium)}}"
  }
}
```

- **One namespace per feature**, named after the feature, plus a shared `common` namespace. A feature adds its English JSON together with the feature.
- **Keys are typed.** The i18next type declaration is derived from the English resources, so a key that doesn't exist fails `npm run typecheck`.
- **No concatenation.** `t('a') + name + t('b')` breaks in languages with a different word order. Use interpolation.
- **Plurals** use `count` and `_one` / `_other` suffixes. Other languages add the forms they need (`_few`, `_many`).
- **Dates and numbers** are formatted with i18next's built-in formatters (`datetime`, `number`, `relativetime`, `list`), which use `Intl` and the active language. Outside `t`, use `Intl.DateTimeFormat(i18n.resolvedLanguage, ...)`. Never format with a fixed locale or by hand.
- **`core/ui` components don't call `t`.** Every visible or accessible string comes in as a prop, including generic words like a dialog's close label. Labels for icon-only controls are required props, so a missing one is a type error.
- **Schema messages are translation keys.** Zod error messages in form schemas are keys like `'notes:form.titleRequired'`. `useTranslatedError()` from `core/i18n` turns them into text. It's the one place that translates a key that isn't known at compile time.
- Rich text with markup in a translation uses the `Trans` component, never `dangerouslySetInnerHTML`.

---

## Accessibility

- Every interactive element has an accessible name: visible text, a `<label>`, or `aria-label` for icon-only controls.
- Inputs have a visible `<label>` connected with `htmlFor` and `useId`. Error text is linked with `aria-describedby` and the input gets `aria-invalid`.
- Focus is always visible. Never remove the focus outline without a `focus-visible:` replacement.
- Use Radix-based components for dialogs, menus, popovers, tabs and tooltips. Don't hand-build them.
- Don't use color alone to convey state. Add an icon or text.
- Disabled buttons that should still explain themselves use `aria-disabled` and a tooltip instead of `disabled`.

---

## Previews

Every `core/ui` component has a section on the dev-only design system preview page. It shows each variant, each size and each meaningful state: default, disabled, loading, with an error, with long text that has to wrap or truncate, and with and without optional slots.

- The preview page is `preview.html` with `src/preview/`, a second Vite entry that `vite build` doesn't include. It has one section per Figma Design System section, in Figma order, plus Foundations. `preview.html?layout` shows `AppLayout` full screen. It shows the active OS theme, so check both.
- Feature components and Screens don't get previews. Their component tests cover their states (see **react-integration-testing**).

---

## Checklist: Building a Component

- [ ] Lives in `core/ui` if it's on the Figma Design System page or a second feature needs it, otherwise in the feature
- [ ] Read from Figma with the MCP, with exactly the variants, sizes and states Figma defines
- [ ] Design system components start from shadcn/Radix and are restyled with tokens
- [ ] Only token classes named after Figma variables, no raw colors, no `dark:`, arbitrary values only for Figma values without a variable and for zero (`min-w-[0]`)
- [ ] Touch sizes under `phone:` where Figma has a Touch variant; control heights as `min-h-*`; single-line labels truncate
- [ ] Accepts `className` merged with `cn` on the outer element, spreads native props where it wraps an element
- [ ] Variants with `cva`, named by purpose
- [ ] Icons exported from Figma, `currentColor`, rendered through `Icon`/`IconButton`, icon-only buttons have a label
- [ ] All text from translation files, plurals and formatting through i18next
- [ ] Accessible name, label, visible focus, keyboard support
- [ ] `core/ui` components have a preview section covering every variant and state
