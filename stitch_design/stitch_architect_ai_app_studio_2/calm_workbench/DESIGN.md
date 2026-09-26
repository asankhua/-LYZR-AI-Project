---
name: Calm Workbench
colors:
  surface: '#faf8ff'
  surface-dim: '#d6d9eb'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e5e7f9'
  surface-container-highest: '#dfe2f4'
  on-surface: '#171b28'
  on-surface-variant: '#464555'
  inverse-surface: '#2c303d'
  inverse-on-surface: '#eef0ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#5b5e6a'
  on-secondary: '#ffffff'
  secondary-container: '#dddfee'
  on-secondary-container: '#5f626f'
  tertiary: '#45484b'
  on-tertiary: '#ffffff'
  tertiary-container: '#5d6063'
  on-tertiary-container: '#d9dbde'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#e0e2f0'
  secondary-fixed-dim: '#c3c6d4'
  on-secondary-fixed: '#181b26'
  on-secondary-fixed-variant: '#434652'
  tertiary-fixed: '#e0e3e6'
  tertiary-fixed-dim: '#c4c7ca'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#44474a'
  background: '#faf8ff'
  on-background: '#171b28'
  surface-variant: '#dfe2f4'
typography:
  display:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '500'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-default:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-medium:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  body-compact:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-compact-medium:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  caption-medium:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  code-default:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  code-compact:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-compact: 0.75rem
  gutter-expanded: 1.5rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.375rem
  space-md: 0.5rem
  space-base: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 3rem
---

## Brand & Style

This design system delivers a calm, precision-engineered workbench aesthetic built for sustained, high-cognitive-load workflows. Tailored for engineers, systems architects, and technical operators, the visual direction prioritizes utility, extreme structural clarity, and content-first composition. The interface intentionally suppresses ornamental distractions in favor of generous negative space, systematic 1px hairline segmentation, and muted surfaces. 

The emotional signature is steady, quiet, and reliable. Drawing from modern functional minimalism and Swiss grid methodology, chrome elements remain unobtrusive, giving full prominence to code, diagrams, structural data, and analytical readouts.

## Colors

The palette is engineered for prolonged optical comfort, high legibility, and surgical focal points.

- **Canvas & Surfaces:**
  - `Canvas Background`: `#FAFBFD` — an ultra-faint cool tint that prevents blinding monitor glare.
  - `Base Surface`: `#FFFFFF` — standard background for raised panels, cards, sheets, and active content regions.
  - `Secondary Surface`: `#F3F5F8` — subtle recessed tier for sidebars, inactive rails, table footers, and toggle trays.
- **Lines & Boundaries:**
  - `Border / Line`: `#E3E6EC` — standard 1px structural boundary that defines planes without visual noise.
- **Typography:**
  - `Primary Text`: `#1F2330` — deep slate-charcoal delivering crisp contrast without the harshness of pure black.
  - `Muted Text`: `#6B7280` — neutral mid-tone for labels, hints, timestamps, and secondary descriptors.
- **Accents:**
  - `Primary Accent`: `#4F46E5` — deep indigo reserved for focal interactive elements, active states, and critical selection cues.
  - `Soft Accent Surface`: `#EEF0FF` — subtle, high-tint indigo wash for active tabs, selected rows, and contextual badges.
- **Semantic Feedback:**
  - `Success`: `#22A06B` — controlled pine green for valid states, deployments, and healthy telemetry.
  - `Warning`: `#E5A50A` — amber-ochre for non-blocking alerts and caution indicators.
  - `Danger`: `#D9443A` — punchy crimson for errors, destruct actions, and failed pipeline stages.

## Typography

The typography scale relies on two core typefaces: **Inter** for all interface copy, titles, and administrative controls, paired with **JetBrains Mono** for code snippets, filesystem paths, technical metadata, status pill readouts, and numerical specs.

- **Weight Discipline:** Restrict text strictly to `400` (Regular) for running text and tabular data, and `500` (Medium) for labels, headings, buttons, and emphasized identifiers. Never use bold (700+) to maintain a calm, uncrowded texture.
- **Hierarchy & Proportions:** Structural headings lean on subtle weight and negative letter-spacing rather than excessive sizing differences.
- **Monospace Integration:** Monospace strings rendered in JetBrains Mono use optical sizing parity (`12px` or `13px`) matching companion body text, preserving baseline alignment across mixed-content cells and inline code tags.

## Layout & Spacing

Layouts follow an adaptable, density-aware grid model engineered for workbench panels, sidebars, and infinite-canvas workspaces.

- **Grid Architecture:** Desktop views utilize a fluid 12-column grid or multi-pane column system (fixed navigation rail + flexible content panes) separated by clean `1px` continuous dividing rules.
- **Density & Padding:** Layout rhythm relies on generous structural whitespace offset by compact internal component padding. Containers and panel shells utilize `space-xl` (24px) or `space-2xl` (32px) margins to preserve breathing room, while internal data controls leverage dense micro-increments (`space-xs` to `space-base`).
- **Breakpoints:**
  - `Mobile` (< 768px): Single-column reflow, sidebars collapse into slide-out sheets, outer margins scale to `margin-mobile` (16px).
  - `Tablet` (768px - 1024px): Two-column layout, collateral toolbars convert to expandable dropdown headers.
  - `Desktop` (> 1024px): Full multi-panel layout with fixed collapsibles and dynamic canvas stretch.

## Elevation & Depth

Visual hierarchy is communicated primarily through **tonal separation** and **crisp 1px border articulation** rather than deep drop shadows.

- **Hairline Borders (`#E3E6EC`):** The primary boundary mechanism. Every panel, card, modal, and input sits within a calibrated 1px border.
- **Surface Nesting:** Depth is conveyed by contrasting `#FAFBFD` (canvas floor), `#FFFFFF` (elevated cards and working canvases), and `#F3F5F8` (recessed rails, code blocks, and inactive zones).
- **Faint Micro-Shadows:** Standard cards and flat panels carry zero shadow. For floating layers (dropdown menus, popovers, flyout dialogs, command palettes), use a single, whisper-quiet ambient shadow:
  - `Subtle Float`: `0 1px 2px 0 rgba(31, 35, 48, 0.04)`
  - `Overlay / Dialog`: `0 8px 24px -4px rgba(31, 35, 48, 0.08), 0 2px 6px -1px rgba(31, 35, 48, 0.03)`

## Shapes

The design system employs a rigorous, intentional shape hierarchy to distinguish structural panels from actionable controls and metadata pills:

- **10px Radius (`rounded-[10px]`):** Structural containers, cards, tables, dashboard widgets, and modal dialogs.
- **6px Radius (`rounded-[6px]`):** Interactive controls, standard buttons, form inputs, dropdown triggers, and context menus.
- **Full Pill (`rounded-full`):** Status badges, count pills, technical chips, and active user indicators.
- **Hairlines:** Uniform 1px thickness across all perimeter strokes.

## Components

### Buttons (Shadcn-Style Precision)
- **Primary:** Solid `#4F46E5` fill, `#FFFFFF` text, `6px` border-radius, font size `13px` / `14px` Medium. Hover: `#4338CA`. Active: `#3730A3`.
- **Outline (Neutral):** `#FFFFFF` fill, 1px `#E3E6EC` border, `#1F2330` text. Hover: `#F3F5F8`.
- **Ghost:** Transparent background, `#1F2330` text. Hover: `#F3F5F8`.
- **Destructive:** Transparent background or solid `#D9443A` with `#FFFFFF` text for irreversible actions.
- **Sizes:** Compact (`h-8`, px-3, text-13) and Standard (`h-9`, px-4, text-14).

### Input Fields & Selects
- Height `36px` (`h-9`), `6px` border-radius, 1px `#E3E6EC` solid border, `#FFFFFF` background.
- Focus: Crisp 1px `#4F46E5` border with an optional subtle focus ring (`ring-2 ring-[#EEF0FF]`). Zero harsh black outlines.
- Placeholder text in `#6B7280`.

### Cards & Workstation Panels
- `10px` border-radius, `#FFFFFF` surface, 1px `#E3E6EC` border.
- Header bars within cards can be separated by a continuous 1px bottom border `#E3E6EC` or placed on an `#F3F5F8` sub-panel strip.

### Badges, Chips & Spec Readouts
- Fully rounded (`rounded-full`), padding `2px 8px`, typography `12px` JetBrains Mono or Inter Medium.
- Default neutral chip: `#F3F5F8` fill, 1px `#E3E6EC` border, `#1F2330` text.
- Active accent chip: `#EEF0FF` fill, 1px `#4F46E5`/20 border, `#4F46E5` text.
- Semantic chips (Success, Warning, Danger): Soft tinted backgrounds with their respective semantic text colors.

### Checkboxes & Radios
- `16px` sizing. Checkboxes use `4px` border-radius; Radios are circular.
- 1px `#E3E6EC` border when unchecked. When checked: `#4F46E5` solid background with a white centered check or dot.

### Lists & Data Tables
- Clean horizontal 1px `#E3E6EC` row separators.
- Alternating stripes are avoided; hover states highlight the entire row with `#F3F5F8` transition.
- Headers rendered in `12px` Inter Medium with `#6B7280` text.