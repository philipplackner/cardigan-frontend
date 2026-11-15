# Artifact review (light): add-design-system

**Verdict:** Ready
**Reviewed:** 2026-11-15, schema `careful-planning`, repo kind `code`

All 15 findings applied on 2026-11-15. No blockers open and none rejected.

| Pass | Blocker | Major | Minor |
|---|---|---|---|
| Testability | 0 | 2 | 3 |
| Security | 0 | 0 | 0 |
| Hidden assumptions | 0 | 3 | 2 |
| Design contract | 0 | 4 | 1 |

## Findings

### D1: Clearing the spacing scale removes `min-w-0`, `inset-0`, `p-0` and `top-0`
**Severity:** major · **Status:** applied
**Location:** design.md > Decisions > Spacing, radius and size; Components > Truncation (D20); Layout component (D19)
**Current text:** "With the multiplier cleared, `p-17` produces no CSS." and "Single-line labels ... use `truncate` and `min-w-0` on their flex parent."
**Failure scenario:** Verified with Tailwind 4.3.5 in this repo: with `--spacing-*: initial`, the classes `min-w-0`, `inset-0`, `p-0` and `top-0` produce no CSS, because bare numbers go through `--spacing` and Figma has no `space/0`. Truncation (D20) silently fails because flex children don't shrink, and the phone panel (`fixed inset-0`) isn't positioned. Task 2.3 only checks that `p-17` is missing, so nothing catches it.
**Fix:** Add to design.md under Spacing, radius and size: "Figma has no 0 step, so bare-number classes such as `min-w-0`, `inset-0` and `p-0` produce no CSS. Zero values use arbitrary values (`min-w-[0]`, `inset-[0]`, `p-[0]`); the skill update lists this." Add to task 2.3: "…and verify `min-w-[0]` and `inset-[0]` produce CSS while `min-w-0` does not." (Adding a `--spacing-0` token instead would break D24's "no token without a Figma variable" and needs a new decision.)

### D2: design.md changes the D5 type-utility names based on a false limitation
**Severity:** major · **Status:** applied
**Location:** design.md > Typography > Raw style utilities (D5)
**Current text:** "`Sans/13.5 Medium/145%` → `type-sans-13_5-medium-145` ... A dot can't appear in an `@utility` name, so `.` becomes `_`."
**Failure scenario:** decisions.md D5 fixes the name as `type-sans-13.5-medium-145`. Verified with Tailwind 4.3.5: `@utility type-sans-13.5-medium-145` compiles and generates `.type-sans-13\.5-medium-145`. The skill update and the mobile-aligned naming would follow the design and drift from the decision.
**Fix:** Replace the two sentences with: "The name follows the style: `Sans/13.5 Medium/145%` → `type-sans-13.5-medium-145`, and `Mono/11 Medium/100% · +6% LS · Caps` → `type-mono-11-medium-100-ls6-caps` (D5). A letter-spacing suffix becomes `ls<n>` or `ls-<n>`."

### D3: Drop zone misses `dragover`, so dropping a file opens it in the tab
**Severity:** major · **Status:** applied
**Location:** design.md > Components > Drop zone; tasks.md > 11.4; spec > Requirement: File drop zone
**Current text:** "It owns native `dragenter`, `dragleave` and `drop` handling for the Over state"
**Failure scenario:** Without `preventDefault()` on `dragover`, the `drop` event never fires and the browser opens the dropped file, navigating away from the app. `dragleave` also fires when the pointer moves onto a child element, so the Over state flickers off while the file is still over the zone. Task 11.4 never checks an actual drop, so this ships.
**Fix:** design.md: "It handles `dragenter`, `dragover` and `drop` with `preventDefault()`, and tracks enter/leave with a depth counter so moving over child elements keeps the Over state." Spec, add scenario: "#### Scenario: Drop a file — **WHEN** the user drops a file on the drop zone — **THEN** the screen receives that file, the zone returns to Default, and the page does not navigate." Task 11.4: "…check by hand that dragging a file over shows Over, moving over the zone's text keeps Over, leaving resets it, dropping hands the file to `onFiles` without navigating, and Enter on browse opens the file picker."

### D4: The preview page can't get the theme and fonts while importing only `@/core/ui`
**Severity:** major · **Status:** applied
**Location:** design.md > Preview page (D14); Typography (fonts); tasks.md > 2.5, 3.1
**Current text:** "`@fontsource-variable/geist` and `@fontsource-variable/geist-mono` are imported once in `src/main.tsx`." and "The preview imports only `@/core/ui`."
**Failure scenario:** `src/preview/main.tsx` is a separate entry. Fonts live in `src/main.tsx` and Tailwind plus `theme.css` in `src/index.css`, neither under `@/core/ui`. The preview renders in a fallback font without tokens, so every "check against Figma" is wrong, or the implementer breaks the import rule.
**Fix:** design.md, Preview page: "The preview entry imports `@/index.css` and the two Fontsource packages, exactly like `src/main.tsx`, and otherwise only `@/core/ui`." Task 3.1: "…verify the preview page uses Geist and the theme tokens."

### T1: Loading button scenario doesn't cover form submission
**Severity:** major · **Status:** applied
**Location:** specs/web-design-system/spec.md > Requirement: Loading buttons
**Current text:** "**WHEN** the user clicks or presses Enter on a button that is loading **THEN** its action does not run and the spinner keeps showing"
**Failure scenario:** The design uses `aria-disabled`, not `disabled`, so the button still takes part in implicit form submission. Pressing Enter in the password field while login is loading submits the form again. An implementation that only skips the `onClick` prop passes the current scenario.
**Fix:** Add: "#### Scenario: Submit a form whose submit button is loading — **WHEN** a form's submit button is loading and the user presses Enter in one of the form's text inputs — **THEN** the form is not submitted again." Catches: a Button that ignores `onClick` but doesn't call `preventDefault()` on the click event.

### T2: Layout widths are stated by width only and contradict the phone condition
**Severity:** major · **Status:** applied
**Location:** specs/web-design-system/spec.md > Requirement: Layout regions per breakpoint
**Current text:** "a 224 px sidebar from 640 px wide, and a 248 px sidebar from 1024 px wide"
**Failure scenario:** A 1280×420 window is a phone by the Phone condition but gets a 248 px sidebar by this sentence. A test written from this text fails the design's custom variants, or a width-only implementation passes it.
**Fix:** "The app layout SHALL show a top app bar and no sidebar on a phone. When the viewport is not a phone, it SHALL show a 224 px sidebar below 1024 px wide and a 248 px sidebar from 1024 px wide." Add scenario: "#### Scenario: Short wide window — **WHEN** the viewport is 1280 px wide and 420 px high — **THEN** the app bar is shown and no sidebar." Catches: `desktop:` defined as `width >= 1024px` without the height condition.

### A1: Toast timer pause and swipe-to-dismiss are not stated
**Severity:** major · **Status:** applied
**Location:** specs/web-design-system/spec.md > Requirement: Toast behavior
**Current text:** "A success toast SHALL close by itself after 4 seconds."
**Failure scenario:** Radix Toast pauses the timer while the pointer is over the viewport, while focus is inside it and while the window is unfocused, and dismisses on swipe. A tester who leaves the pointer resting on the toast, or switches tabs, sees it stay and files a bug. Another implementer turns the pausing off. This is behavior the user hasn't decided, so confirm before applying.
**Fix:** Append: "The 4-second timer SHALL pause while the pointer is over the toast, while focus is inside it, and while the window doesn't have focus, and SHALL restart when that ends. A toast SHALL also close when swiped to the right." Change the success scenario WHEN to: "a success toast is shown, the window keeps focus, and the pointer is not over the toast".

### A2: Radix scroll lock needs inline `<style>` under the production CSP
**Severity:** major · **Status:** applied
**Location:** design.md > Risks / Trade-offs (missing); tasks.md > 13
**Current text:** (none) AGENTS.md only fixes `script-src 'self'`.
**Failure scenario:** Radix Dialog's scroll lock (`react-remove-scroll`) injects a `<style>` element. If the hosting CSP has `default-src 'self'` or `style-src 'self'` without `'unsafe-inline'` or a nonce, the browser blocks it. The background then scrolls behind every dialog and bottom sheet in production, while the dev server (no CSP) looks fine.
**Fix:** Add to design.md Risks: "[Radix's scroll lock injects a `<style>` element] → The hosting CSP must allow it (`style-src 'self' 'unsafe-inline'`). Note this in `react-security` when hosting is set up." Add task 13.5: "Serve `dist/` with `Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'` and check that opening a dialog locks page scroll and the console shows no CSP violation."

### A3: The phone full-screen panel has no modality rule
**Severity:** major · **Status:** applied
**Location:** specs/web-design-system/spec.md > Requirement: Layout regions per breakpoint; design.md > Layout component
**Current text:** "When `panel` is set, it renders fixed over the whole viewport."
**Failure scenario:** On a phone the content behind the panel stays in the tab order and the accessibility tree. Keyboard and screen reader users reach hidden controls behind the card detail. One implementer makes the panel modal, another doesn't, and the cards feature inherits whichever.
**Fix:** Spec, append: "On a phone, while the side panel is open, the content behind it SHALL NOT be reachable by keyboard or assistive technology." Design: "On phones the layout sets `inert` on the content region while `panel` is set." Add scenario: "**WHEN** a side panel is open on a phone and the user presses Tab repeatedly — **THEN** focus never reaches an element behind the panel."

### T3: Modal overlays requirement contradicts the Progress dialog requirement
**Severity:** minor · **Status:** applied
**Location:** specs/web-design-system/spec.md > Requirement: Modal overlays and keyboard
**Current text:** "Dialogs and bottom sheets SHALL keep keyboard focus inside while open, close on Escape or on a click on the scrim"
**Failure scenario:** Read alone, a test from this requirement fails a correct Progress dialog.
**Fix:** "…close on Escape or on a click on the scrim (except Progress dialogs, see below), and return focus…"

### T4: Text area growth is only tested while typing
**Severity:** minor · **Status:** applied
**Location:** specs/web-design-system/spec.md > Requirement: Text areas grow with their content
**Current text:** "**WHEN** the user types a title that wraps to three lines"
**Failure scenario:** The `scrollHeight` approach runs on input. A text area opened with an existing long description, or one whose panel gets narrower, shows a scrollbar or clipped text.
**Fix:** Add: "#### Scenario: Existing long title — **WHEN** a Title text area is shown with a value that wraps to three lines — **THEN** it is three lines high before any input." and "#### Scenario: Narrower container — **WHEN** the viewport narrows so the title wraps to more lines — **THEN** the text area grows to show all text." Catches: height set only in the `input` handler.

### T5: "Every interactive component" shows the focus ring is too broad
**Severity:** minor · **Status:** applied
**Location:** specs/web-design-system/spec.md > Requirement: Visible keyboard focus
**Current text:** "Every interactive component SHALL show the Figma focus ring when it receives focus from the keyboard."
**Failure scenario:** Menu items and options move focus with arrow keys and Figma draws them with a Highlighted state, not a ring. A test from this text fails correct menus.
**Fix:** "Every interactive component SHALL show the Figma focus ring when it receives focus from the keyboard, except menu items and options, which show their Highlighted state instead."

### A4: Bottom sheet off phones and overlay animation under reduced motion are undefined
**Severity:** minor · **Status:** applied
**Location:** specs/web-design-system/spec.md > Requirement: Bottom sheet; Requirement: Skeleton shimmer
**Current text:** "A bottom sheet SHALL slide in from the bottom edge on a phone"
**Failure scenario:** What a bottom sheet looks like when a screen opens one on tablet, and whether the slide, dialog and toast animations run under reduced motion, is left to each implementer. Needs a user decision.
**Fix:** "A bottom sheet SHALL only be used on a phone. When the user prefers reduced motion, bottom sheets, dialogs and toasts SHALL appear and disappear without sliding or scaling."

### A5: Drop zone file count and non-file drags are undefined
**Severity:** minor · **Status:** applied
**Location:** specs/web-design-system/spec.md > Requirement: File drop zone
**Current text:** "SHALL hand dropped files to the screen"
**Failure scenario:** One implementer sets `multiple` on the input, another doesn't. Dragging selected text over the zone may show Over and call `onFiles([])`.
**Fix:** "The drop zone SHALL accept one file at a time. It SHALL show the Over state only for drags that carry files, and SHALL ignore drops without files."

### D5: Several default Tailwind scales stay, against the design goal
**Severity:** minor · **Status:** applied
**Location:** design.md > Goals; Theme file layout, point 2
**Current text:** "Classes that aren't Figma values produce no CSS." and the list of cleared namespaces.
**Failure scenario:** `--font-weight-*`, `--leading-*`, `--tracking-*`, `--container-*`, `--blur-*` and `--drop-shadow-*` aren't cleared, so `font-bold`, `leading-tight` and `max-w-md` still work and can bypass the type utilities.
**Fix:** Add `--font-weight-*: initial`, `--leading-*: initial`, `--tracking-*: initial`, `--container-*: initial`, `--blur-*: initial`, `--drop-shadow-*: initial`, `--inset-shadow-*: initial` to the cleared list, and to task 2.6: "verify `font-bold` and `leading-tight` produce no CSS."

## Trust boundaries

- Imported files (Drop zone): a malicious file could be passed on. Design hands `File[]` to the transfer feature, which owns type and size checks. Stopped by delegation; see D3 and A5 for correctness gaps.
- User text in inputs, labels, file names: rendered by React as text; no `dangerouslySetInnerHTML` is planned. Stopped.
- Preview page: could leak into production. Stopped by the spec's production-build scenario and task 13.4.
- Hosting CSP: see A2 (availability gap, not an exploit).
- New dependencies (`radix-ui`, cva, clsx, tailwind-merge, Fontsource): supply-chain risk, approved in D13. No spec gap.
- No network, auth, deep links or storage in this change.

## Coverage

Checked all 18 requirements and 26 scenarios in `specs/web-design-system/spec.md`, plus proposal, design, decisions and tasks. Read AGENTS.md, `openspec/config.yaml`, `theme.css`, `index.css`, `main.tsx`, `vite.config.ts`, `.oxlintrc.json`, `lintBoundaries.test.ts`, the CSP section of `react-security`, and `domain-label` from `cardigan-shared-specs`. D1 and D2 were confirmed by compiling sample classes with the repo's Tailwind 4.3.5. No main specs exist in `openspec/specs/`. No other active changes. Not read: the full `react-ui-components` skill, the Figma file, and Radix source (A1 and A2 rely on known Radix behavior).

## Applied changes

All 15 findings were applied as recommended, at the user's request ("apply the recommendations"), without a walk-through.

- `specs/web-design-system/spec.md`: layout widths stated as "not a phone", plus a phone panel `inert` rule and two scenarios (T2, A3); focus-ring exception for menu items and options (T5); loading-button form-submit scenario (T1); a new requirement "Toast timer pause and swipe" with two scenarios (A1, split out so the toast requirement stays under the length limit); a Progress exception in Modal overlays (T3); bottom sheet phone-only and reduced motion for overlays (A4); two text-area scenarios (T4); drop zone single file, file-only drags, and a drop scenario (D3, A5).
- `design.md`: more theme namespaces cleared (D5); zero values as arbitrary values, `min-w-[0]` for truncation, `inset-[0]` for the phone panel (D1); D5 type names restored and the `.` → `_` rule removed (D2); loading-button `preventDefault()` (T1); text area resizes on mount, input and width changes (T4); drop zone `dragover`, depth counter, file-only drags, single file (D3, A5); Radix toast defaults kept (A1); a new Motion section (A4); phone panel `inert` (A3); preview imports `@/index.css` and fonts (D4); CSP risk (A2); skill update notes zero values.
- `tasks.md`: checks added to 2.3, 2.6, 3.1, 5.1, 6.2, 7.3, 9.4, 10.3 and 11.4, and a new task 13.5 for the CSP scroll lock (A2). No checkboxes changed.
- `proposal.md`: no change needed.

**Behavior not in decisions.md:** A1 (toast pause and swipe), A3 (inert content behind the phone panel), A4 (bottom sheet phone-only, no overlay motion under reduced motion) and A5 (one file per drop) add product behavior that decisions.md doesn't cover. They don't contradict any decision. decisions.md was not edited; add them there if you want them recorded as decisions.

`openspec validate add-design-system --strict` passes.
