---
name: Second Brain
description: Pastel-on-obsidian Eisenhower companion with a floating glass dock.
colors:
  mint: "#7be3c9"
  mint-soft: "#b6f2dd"
  banner-mint: "#9bf0d3"
  banner-sky: "#74c8e8"
  green: "#30d158"
  blue: "#0a84ff"
  orange: "#ff9f0a"
  purple: "#bf5af2"
  red: "#ff453a"
  coral: "#ffc3b2"
  coral-soft: "#ffd9cc"
  q2-mint: "#b6eccd"
  q2-mint-soft: "#d9f6e2"
  sky: "#b2d6ff"
  sky-soft: "#d8eaff"
  lavender: "#d2c2ff"
  lavender-soft: "#e9e2ff"
  icon-yellow: "#ffe66d"
  icon-pink: "#ffc8d6"
  obsidian-bg: "#0d0d0f"
  surface: "#1c1c20"
  surface-soft: "#232327"
  glass: "rgba(28, 28, 32, 0.72)"
  glass-border: "rgba(255, 255, 255, 0.08)"
  ink: "#111111"
  ink-faint: "rgba(17, 17, 17, 0.6)"
  text-primary: "#f2f2f7"
  text-secondary: "#aeaeb2"
  text-tertiary: "#8e8e93"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"SF Pro Display\", \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif"
    fontSize: "clamp(26px, 6vw, 32px)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  headline:
    fontSize: "22px"
    fontWeight: 800
    letterSpacing: "-0.02em"
  title:
    fontSize: "19px"
    fontWeight: 700
    letterSpacing: "-0.02em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"SF Pro Display\", \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0.04em"
rounded:
  sm: "14px"
  md: "20px"
  lg: "26px"
  xl: "32px"
  pill: "999px"
spacing:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "22px"
components:
  button-primary:
    backgroundColor: "linear-gradient(135deg, #7be3c9, #74c8e8)"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "12px 18px"
  input-search:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.pill}"
    padding: "13px 18px"
  chip-active:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  nav-tab:
    textColor: "{colors.text-tertiary}"
    rounded: "{rounded.md}"
    padding: "6px 10px"
  nav-tab-active:
    backgroundColor: "rgba(123, 227, 201, 0.1)"
    textColor: "{colors.mint}"
    rounded: "{rounded.md}"
    padding: "6px 10px"
  float-add-btn:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    size: "58px"
  quadrant-q1:
    backgroundColor: "linear-gradient(180deg, #ffd9cc 0%, #ffc3b2 100%)"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  quadrant-q2:
    backgroundColor: "linear-gradient(180deg, #d9f6e2 0%, #b6eccd 100%)"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  quadrant-q3:
    backgroundColor: "linear-gradient(180deg, #d8eaff 0%, #b2d6ff 100%)"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  quadrant-q4:
    backgroundColor: "linear-gradient(180deg, #e9e2ff 0%, #d2c2ff 100%)"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  rpg-badge:
    backgroundColor: "rgba(17, 17, 17, 0.88)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.pill}"
    padding: "8px 14px 8px 16px"
---

# Design System: Second Brain

## Overview

**Creative North Star: "The Obsidian Companion"**

A personal second brain carried like a pocket notebook laid on a slab of dark obsidian. The page is a single column on a deep near-black ground (#0d0d0f); the only full-bleed color moment is the pastel gradient hero banner, and every interactive surface above the ground is either a pastel card carrying dark ink text or a dark-glass control. The density is low and the rhythm is calm: one banner, three filter capsules, four quadrant cards, a stats row, and a floating glass dock that keeps every destination one thumb away even on desktop.

The world was restyled from a prior flat-dark dashboard identity, and it refuses that grammar outright. There is no browser-tab strip, no dashboard grid of chrome cards, no toolbars. Navigation lives in a floating glass dock with a raised white add button; the Eisenhower matrix is four warm pastel cards you can drag tasks between; the hero's bottom-right corner is scooped out by a page-colored notch that nests the stats button. The result reads as a handheld companion — a pinned, pastel-toned user brief — rather than a management console.

Two divergences between the intended direction and the build are recorded as build truth. Per-quadrant "live progress bars" did not land on the quadrant cards themselves: the cards carry a live task-count badge, while live progress appears as the XP fill inside the hero's RPG badge and as per-quadrant hbar fills in the stats dashboard. And the JS-driven unicode glyphs on the pomodoro/delete/close/calendar-nav buttons (▶ ⟳ ⏸ ✕ ← → ⏱ ☕) exist because their labels swap at runtime; they are a carried defect, not a system rule.

**Key Characteristics:**
- One-column obsidian surface with a single pastel-gradient hero banner, scooped at the bottom-right.
- Pastel-tinted quadrant cards (coral / mint / sky / lavender) carrying dark ink (#111) text.
- Bright mint progress fills and a bright green accent on dark tracks — progress never renders pale-on-pale.
- A floating glass dock (backdrop blur, 8% white hairline) as the only persistent navigation.
- Squircle corner language scaled to surface size (14–32px), pills reserved for one-line controls.
- Stroke-drawn inline SVG icons (2px, round caps); no filled glyph fonts.

## Colors

A warm pastel "paper" palette floats over a cold obsidian ground: the four quadrant tints and the mint brand accent do all the emotional work, while every functional status color comes from the iOS palette.

### Primary
- **Mint** (#7be3c9): the single brand accent. Signals active/selected on dark surfaces (dock tab, filter capsule border, today's calendar cell, stat values), fills the checked state, and pairs with sky in the mint→sky gradient used by primary buttons and chart bars. Never used as a text color on pastel surfaces.
- **Banner Mint** (#9bf0d3) and **Banner Sky** (#74c8e8): the two ends of the hero banner's 135° gradient (with mint at 40%) and the XP-fill gradient's highlight.
- **Mint Soft** (#b6f2dd): the active filter capsule's icon well.

### Secondary
- **Accent Green** (#30d158): the canonical progress fill on dark tracks; also the "bought/done" status on calendar task dots and the grocery category color.
- **Accent Blue** (#0a84ff): status on dark surfaces (upcoming task dots, watsons category, edit actions).
- **Accent Orange** (#ff9f0a): pomodoro focus identity (icon, running time) and mrdiy category.
- **Accent Purple** (#bf5af2): online category, quadrants in the distribution chart.
- **Accent Red** (#ff453a): destructive actions (clear buttons, delete hover, overdue states).

### Tertiary
- **Coral** (#ffc3b2) / **Coral Soft** (#ffd9cc): the Do First (q1) card gradient, 180° soft→base.
- **Leaf Mint** (#b6eccd) / **Leaf Mint Soft** (#d9f6e2): the Schedule (q2) card gradient.
- **Sky** (#b2d6ff) / **Sky Soft** (#d8eaff): the Delegate (q3) card gradient.
- **Lavender** (#d2c2ff) / **Lavender Soft** (#e9e2ff): the Eliminate (q4) card gradient.
- **Capsule Yellow** (#ffe66d) and **Capsule Pink** (#ffc8d6): the All and Completed filter icons, completing the three-accent filter trio (with Mint Soft).

### Neutral
- **Obsidian Ground** (#0d0d0f): the page background, with a radial #17171b glow bleeding in from the top.
- **Surface** (#1c1c20) / **Surface Soft** (#232327): dark control fills, row backgrounds, and stat/chart boxes.
- **Glass** (rgba(28,28,32,0.72)) / **Glass Border** (rgba(255,255,255,0.08)): the dock, pomodoro bar, calendar nav, and modal hairlines.
- **Ink** (#111111): the only text on pastel surfaces — headline, card labels, todo titles.
- **Ink Faint** (rgba(17,17,17,0.6)): secondary text on pastel surfaces (greeting, sublabels, meta).
- **Text Primary** (#f2f2f7) / **Secondary** (#aeaeb2) / **Tertiary** (#8e8e93): the dark-surface text ramp.

### Named Rules
**The Ink-on-Pastel Rule.** Pastel surfaces carry only dark ink (#111) text; the white/dark text ramp is reserved for dark surfaces. The moment a fill is pastel, its foreground must be ink — and bright iOS accents never sit on pastel fills as text.

**The One-Accent Rule.** Mint is the only brand accent. It signals active, selected, today, and progress. Green/blue/orange/purple/red are functional status colors (done, upcoming, focus, category, destructive) — they never compete for brand attention on a pastel surface.

**The Bright-Fill Rule.** Progress reads bright-on-dark, never pale-on-pale: mint-to-sky gradients or accent green (#30d158) on dark tracks. A pastel card never carries a progress fill.

## Typography

**Display Font:** System SF stack (`-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif`)
**Body Font:** Same system SF stack.
**Label/Mono Font:** None distinct; the pomodoro timer uses `font-variant-numeric: tabular-nums` on the system stack so digits don't jump.

**Character:** A single quiet system face — no display type, no serif, no mono — so the pastel world stays the personality and the type stays weight, spacing, and color. Hierarchy is carried by weight (400→800), size (9.5px→32px), and letter-spacing (positive tracking on labels, negative on display only).

### Hierarchy
- **Display** (800, `clamp(26px, 6vw, 32px)`, 1.15, −0.03em): the hero headline "You Have N Tasks in This Month", where N is the live count. Negative tracking at its strongest; only on this one line.
- **Headline** (800, 22px, −0.02em): large numerals in the stats dashboard (Level / XP / Streak / Done boxes).
- **Title** (700, 19px, −0.02em): modal headers ("Edit Task", "New Task", "Stats Dashboard") and the hero avatar monogram.
- **Body** (400, 15px, 1.45): inputs, selects, and base text. Task titles run at 600/14.5px; meta at 500/11.5px; shopping names at 600/14.5px.
- **Label** (600, 12px, 0.04em, uppercase): filter capsules, chips, and section headers. The micro-caps ramp runs 9.5px (dock) → 11px (card pills, calendar headers) → 12px (filter capsules) → 13px (section headers), weight 600–700, tracking 0.04–0.08em.

### Named Rules
**The Display-Only Tracking Rule.** Negative letter-spacing is reserved for display/headline/title type (hero −0.03em, numerals and modal headers −0.02em). Body and meta text never go below 0 tracking; labels track positive (0.04–0.08em) and uppercase.

**The Micro-Caps Rule.** Short status labels are uppercase micro-caps: 9.5–13px, weight 600–700, tracking 0.04–0.08em. They never render in sentence case, and never in display weight.

## Layout

A single 720px column centered on the obsidian ground (max-width 760px once the viewport reaches ≥1200px). The container is `padding: 16px 16px 132px` — the bottom 132px is dock clearance so the fixed glass nav never covers content. The column uses a small gap rhythm: 8px inside items and lists, 12px between top-level blocks, 14px between sections, 16px between matrix cards. The matrix is a 2-column grid until the **640px breakpoint**, where it stacks to one column, the container tightens (14px 12px 128px), the XP bar shortens to 80px, and the shopping input row stacks.

Vertical structure is fixed by role, top to bottom: hero banner → glass pomodoro bar → filter capsules → search → quadrant matrix → stats row (then the hidden shopping and calendar sections swap in via the dock). The first viewport shows the greeting, the headline with the live task count, the RPG level/XP/streak pill bottom-left of the banner, and the dark stats button nested in the banner's scoop notch bottom-right.

The dock is `position: fixed; left: 50%`, bottom 14px, `width: min(calc(100% - 28px), 500px)`, with the white add button raised 26px above its rim. It is the only fixed element and the only navigation.

## Elevation & Depth

A hybrid system: **tonal layering + soft ambient shadows + one glass layer.** The ground is flat; pastel cards and dark controls sit one ambient shadow above it; the dock floats highest with a deeper shadow and backdrop blur. There is no hard-offset, no neobrutalist, no lift-on-hover beyond a 2px translate.

### Shadow Vocabulary
- **card** (`0 12px 30px rgba(0, 0, 0, 0.45), 0 2px 6px rgba(0, 0, 0, 0.3)`): resting elevation for the hero banner and the four quadrant cards.
- **float** (`0 16px 40px rgba(0, 0, 0, 0.5)`): the glass dock and modal cards — the highest floating layer.
- **add** (`0 10px 26px rgba(0, 0, 0, 0.45)`): the dock's raised white add button.
- **notch** (`0 6px 18px rgba(0, 0, 0, 0.32)`): small controls popping off their surface (the banner notch button, the RPG badge, the pomodoro bar).
- **badge** (`0 6px 16px rgba(0, 0, 0, 0.28)`): the RPG badge's own shadow (ambient, near-black).

### Named Rules
**The Glass-Restraint Rule.** Backdrop blur appears on exactly the glass family: the dock (22px), the pomodoro and calendar nav bars (16px), and the modal overlay (10px over rgba(13,13,15,0.84)). Cards and inputs are solid fills plus shadow — blur is for floating chrome, never for content surfaces.

## Shapes

The form language is squircle-with-pills. Corners step with surface size: **sm 14px** for todo items, inputs, and calendar cells; **md 20px** for rows, capsules, and the calendar nav; **lg 26px** for the four quadrant cards; **xl 32px** for the hero banner, dock, and modal cards. Perfect circles (pill radius, 999px) are reserved for one-line controls, chips, badges, progress tracks, the avatar, icon wells, and all round buttons. The one bespoke silhouette is the hero's **scoop notch**: a 56px page-colored circle cut out of the banner's bottom-right corner, into which the 50px dark stats button nests.

### Named Rules
**The Squircle Scale Rule.** Corner radius follows surface size — items 14px, rows/capsules 20px, cards 26px, shell surfaces 32px. A small control never wears a shell radius and a large surface never wears an item radius; pills only for one-line controls and progress tracks.

## Components

### Buttons
- **Shape:** pill or perfect circle; never square corners.
- **Primary:** mint→sky gradient (135°) fill, ink (#111) 700-weight text, pill, padding 12px 18px. Hover brightens (filter brightness 1.06) and lifts 1px; active scales to 0.96. Used for Add and Save.
- **Float add:** 58px white circle with an ink 2.6px-stroke plus; raised 26px above the dock; hover scales to 1.07, active 0.94.
- **Notch button:** 50px circle, rgba(17,17,17,0.92) fill, white 2px-stroke stats icon, nested in the hero notch; hover scales to 1.06.
- **Circular controls:** 32px soft-filled circles (pomodoro, calendar nav, modal close) that brighten on hover; touch targets grow to 38–40px under `(hover: none)`.
- **Focus:** all buttons get a 3px mint outline with 2px offset on `:focus-visible`.

### Chips
- **Filter capsules:** tall dark capsules (#222226, radius 20px) with a pastel circular icon well (38px, colored by state: yellow / mint-soft / pink) and a micro-caps label. Active = mint border + slightly lighter fill (#2b2b30) + brighter label; hover lifts 2px.
- **Pill chips:** one-line filter/shop chips — dark surface fill, glass hairline, tertiary text; active flips to mint fill with ink text.
- **Status pills on pastel:** dark rgba(17,17,17,0.9) pills with near-white text — quadrant name pills (11px micro-caps) and count badges (13px/700, min 30px).

### Cards / Containers
- **Hero banner:** the signature surface — mint→sky 135° gradient, radius 32px, card shadow, a faint ink dot-pattern overlay (opacity 0.5), greeting + avatar top row, display headline, RPG badge bottom-left, scoop notch bottom-right.
- **Quadrant cards:** 180° pastel gradients (coral / leaf mint / sky / lavender) over radius 26px, ink text, 1px rgba(17,17,17,0.06) hairline, card shadow. Header = dark label pill + sublabel + count badge; body = the draggable todo list (min-height 44px) with a dashed-ink outline on drag-over.
- **Rows (shopping):** dark surface fills, radius 20px, glass hairline; hover softens to surface-soft.
- **Stat boxes:** surface-soft fills, radius 20px, centered 22px mint numerals over micro-caps labels.

### Inputs / Fields
- **Style:** surface-soft fill (search uses surface), 1px glass hairline, radius 14px (search pill 999px), padding 12px 14px, placeholder in text-tertiary.
- **Focus:** border shifts to mint and fill lifts to surface; global `:focus-visible` mint outline at 3px/2px.

### Navigation
- **Style:** the floating glass dock — glass fill, 22px blur, white 8% hairline, radius 32px, float shadow, centered bottom. Tabs are 2px-stroke SVG icons over 9.5px micro-caps labels in text-tertiary; active = mint icon + label on a faint mint (10%) well; hover brightens and lifts 1px. The white add button is the dock's center and its strongest affordance.

### Signature: the RPG badge
A dark pill (rgba(17,17,17,0.88)) docked bottom-left in the hero banner: mint 700-weight level text ("Lv. N"), a 110×6px pill track at white 16% holding a mint→banner-mint gradient fill that animates width in 0.5s spring ease, and a 12px streak label. On level-up the level text pulses (0.6s scale 1→1.25→1) while confetti falls.

### Signature: todo items on pastel
White 38% translucency chips (radius 14px) floating on the pastel cards, hover 58%: a 20px round checkbox (ink fill + mint check on checked, hover scale 1.12), ink 600-weight title (struck-through at 55% opacity when complete), 11.5px ink-faint meta with a green due-date (#1e7a3d) that flips to red (#c0241a) when overdue, and a hover-revealed round delete button that fills dark on hover.

### Signature: bottom-sheet modals
Bottom-anchored overlays (rgba(13,13,15,0.84) + 10px blur) rising to a surface card (radius 32px, max-width 520px, 560px wide variant, float shadow) that animates up in 0.28s spring ease. Inside: a title row with a close circle, full-width inputs, a 2×2 quadrant picker reusing the four pastel gradients with a 2px ink border on selection, and a mint→sky gradient Save button.

### Signature: data viz in the stats dashboard
- **Chart bars:** 7 flexing columns on a 130px baseline; done days fill mint→sky (180°), idle days stay surface-soft; labels in 11px tertiary.
- **Horizontal bars:** 12px pill tracks on surface-soft with bright fills — quadrant fills use accent colors (q1 red, q2 green, q3 blue, q4 purple), category fills use the category color — animating width in 0.5s spring ease.
- **Streak grid:** auto-fill 14px squares with 3px gaps; active days mint, today outlined in mint with 1px offset.

## Do's and Don'ts

### Do:
- **Do** keep the ground obsidian and the pastels on top: pastel fills and bright accents live only on elevated cards and the banner, never on the page background.
- **Do** put ink (#111) text on every pastel surface, and the dark text ramp on every dark surface.
- **Do** use mint for active/selected/today/progress, and reserve green/blue/orange/purple/red for functional status.
- **Do** render progress bright-on-dark (mint/sky gradients or accent green on dark tracks).
- **Do** scale corner radius with surface size (14/20/26/32px) and use pills for one-line controls and tracks.
- **Do** draw icons as inline 2px-stroke round-cap SVGs with `stroke="currentColor"`.
- **Do** give every interactive control a 3px mint `:focus-visible` outline with 2px offset.

### Don't:
- **Don't** reintroduce the old flat-dark dashboard grammar: no browser-tab strip, no dashboard chrome grid, no toolbar.
- **Don't** put bright iOS accents or white text on pastel fills — pastel carries ink only.
- **Don't** use blur on content surfaces; backdrop-filter belongs to the dock, glass bars, and modal overlay.
- **Don't** apply negative letter-spacing below the display/headline/title tier.
- **Don't** set corner radius in single digits or mix a pill and a squircle within one component's radius family.
- **Don't** add a second brand accent to compete with mint.
