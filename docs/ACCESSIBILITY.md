# Accessibility

Accessibility was treated as a design constraint rather than a pass at the end. A tool modelling
public-interest research infrastructure should be usable by the researchers who need it, and the
patterns below were chosen before the components were built rather than retrofitted onto them.

This document also records **known gaps**, because a page claiming conformance it has not been
independently audited for would be making the same kind of unverifiable assertion the product spends
its time discouraging.

## Target

WCAG 2.2 Level AA as the design target. **No formal audit has been carried out**, and no conformance
claim is made. What follows is what was implemented and what is known to be outstanding.

## Structure and navigation

- **Skip link** to `#main` as the first focusable element, visible on focus.
- `<main>` carries `tabIndex={-1}` so the skip link moves focus rather than only scrolling.
- One `<h1>` per page; heading levels descend without skipping.
- Landmarks throughout: `<header>`, `<nav>`, `<main>`, `<footer>`, `<aside>`, plus `<section>`
  elements with `aria-labelledby` pointing at their own heading.
- Multiple navigations are distinguished by accessible name: "Primary", "Primary (mobile)",
  "Project sections", "Application steps", "Breadcrumb", "Catalogue filters", "Footer", "Rule
  categories", "Case study contents".
- `aria-current="page"` on the active primary and project navigation item; `aria-current="step"` on
  the active application step.

## Focus

A single focus treatment is defined once in `globals.css` and applied to every interactive element:

```css
:where(a, button, input, select, textarea, summary, [tabindex]):focus-visible {
  outline: none;
  ring: 2px solid theme(colors.cyan.600);
  ring-offset: 2px;
}
```

It is never removed anywhere in the codebase. `:focus-visible` means pointer users do not see a ring
on click while keyboard users always do.

## Forms

- Every input, textarea and select has a programmatically associated `<label>`. Where a visible
  label would be redundant the label is `sr-only` rather than absent.
- Hints are linked with `aria-describedby`, so they are announced with the field rather than
  orphaned.
- Required fields carry `aria-required`; the visual asterisk is `aria-hidden` because the attribute
  already conveys it.
- Word-count feedback sits next to the label as text, not as colour alone.
- Validation messages on project creation use `role="alert"`.
- Checkbox groups use `<fieldset>`-equivalent grouping via `role="group"` with `aria-labelledby`.
- The role switcher uses `aria-pressed` on toggle buttons within a labelled group.

## Data visualisation

The rule applied throughout: **a value must never be readable only from a bar's width or a swatch's
colour.**

- Quality meters use `role="meter"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and an
  `aria-label` containing the value in words. The numeral is also rendered as text next to the label.
- The sensitivity distribution bar in the minimisation review carries `role="img"` with an
  `aria-label` describing the full breakdown, and is accompanied by a text legend with counts.
- The four-bar quality strip on dataset cards is `aria-hidden`, because the same information is
  available in the dataset profile as labelled meters — decoration that duplicates accessible
  content is better hidden than announced twice.
- Readiness meters follow the same `role="meter"` pattern, with the score also present as text.

## Tables

- Every table has a `<caption>`, `sr-only` where a visible one would be redundant.
- Row headers use `<th scope="row">`; column headers use `<th scope="col">`.
- Sortable columns expose `aria-sort` on the header cell, updated to `ascending`/`descending`/`none`
  as state changes, with the control itself a real `<button>`.
- Wide tables scroll inside their own `overflow-x: auto` container. The page body never scrolls
  horizontally.

## Disclosure and dynamic content

- Every collapsible region uses a `<button>` with `aria-expanded` and `aria-controls`, and the panel
  uses the `hidden` attribute rather than CSS-only hiding.
- Facet groups, dataset panels in the variable selector, and the recommendation evidence panel all
  follow the same pattern.
- Result counts sit in `aria-live="polite"` regions, so filtering announces its outcome.
- The autosave indicator is `aria-live="polite"`, and export confirmations use `role="status"`.
- Native `<details>`/`<summary>` is used where a simple disclosure suffices.

## Colour and contrast

- The palette is built from a deep navy/ink scale, a muted cyan, warm white and sparing gold. Body
  text is `ink-700`–`ink-900` on `parchment-100` or white, which exceeds 4.5:1 throughout.
- Colour is never the sole carrier of meaning:
  - Severity badges pair colour with text ("Needs attention", "Advisory", "For information").
  - Sensitivity badges name the band.
  - Compatibility scores pair a coloured pill with a phrase ("Combines readily", "Needs planning",
    "Substantial obstacles") and a numeric score.
  - Completion markers in the next-steps list pair a symbol with `sr-only` text ("complete" /
    "outstanding").
- Decorative SVGs and glyphs carry `aria-hidden="true"`.

## Motion

`prefers-reduced-motion: reduce` is honoured globally in `globals.css`: all animations and
transitions collapse to near-zero duration, and `scroll-behavior` reverts to `auto`. The only
animation in the product is a 180 ms fade-in on newly revealed panels.

## Responsive and zoom

- Layouts use flexbox and grid with relative units; no fixed pixel widths on containers.
- Everything reflows to a single column at small widths without loss of content or function.
- Sticky elements are capped with `max-height` and made scrollable so they cannot trap content at
  high zoom.
- Tested by reflow at 320 px equivalent width and at 200% zoom.

## Print

A print stylesheet hides interactive chrome (`.no-print`), removes shadows, prevents section
splitting with `break-inside: avoid`, and expands external link URLs after their text. The
print-ready application view is plain semantic HTML rather than a generated PDF, so the browser's own
"print to PDF" produces a selectable, tagged, accessible document.

## Language

- `<html lang="en">` is set. The prototype is English-only.
- Links that open in a new tab announce it with `sr-only` text; `rel="noopener noreferrer external"`
  is set.
- Prose favours plain language. Terms of art are defined in the glossary, which marks clearly which
  are real concepts and which the prototype invented.

## Known gaps

Stated plainly rather than omitted:

1. **No independent audit.** No screen-reader testing with real assistive-technology users, and no
   automated axe/Lighthouse sweep is committed to CI. The patterns above are implemented by hand and
   verified by inspection and integration tests, which is not the same as an audit.
2. **English only.** No translation, no `lang` switching, and — more consequentially — the concept
   dictionary behind relevance matching is English-only, so a research question in another language
   scores zero. This is a functional accessibility barrier, not only a localisation gap.
3. **No user-adjustable text size or theme.** The design respects browser zoom and OS-level font
   scaling but offers no in-app control, and there is no dark theme.
4. **Range inputs for quality floors** are native `<input type="range">` with a text readout. Native
   ranges are keyboard-accessible but are a poor experience for fine values on touch; a numeric
   alternative alongside them would be better.
5. **Long forms have no in-page progress persistence indicator per field.** Autosave is announced
   globally in the header, but a user cannot tell which individual field last saved.
6. **No focus management on step change** in the application builder. Moving between steps updates
   the panel but does not move focus into it, so a screen-reader user must navigate to the new
   content manually.

Items 5 and 6 are the two most worth fixing next.

## Testing

Accessibility assertions are embedded in the integration tests rather than isolated, so a regression
in behaviour and a regression in semantics fail together:

- Queries use accessible roles and names throughout (`getByRole`, `getByLabelText`) rather than test
  ids, so a component that loses its accessible name fails its own test.
- Explicit assertions on `aria-expanded` state changes for facet groups.
- Explicit assertion that the result count is in an `aria-live="polite"` region.
- Explicit assertion that the current application step carries `aria-current="step"`.
- Explicit assertion that compact recommendation cards still expose the reason — a "compact" variant
  that hid the explanation would defeat the product's central commitment.
