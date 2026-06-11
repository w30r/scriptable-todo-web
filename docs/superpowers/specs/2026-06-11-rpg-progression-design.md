# RPG Progression System — Second Brain

## Overview

Gamify the Second Brain todo app with an RPG-style XP and leveling system. Complete tasks to earn XP, build streaks, and level up. All data lives in localStorage — no backend changes.

---

## XP System

### XP per action

| Action | Base XP | Notes |
|--------|---------|-------|
| Complete !ui (Do First) | 20 | Urgent & Important — highest reward |
| Complete !nui (Schedule) | 15 | Important, planned |
| Complete !uni (Delegate) | 10 | Urgent but not important |
| Complete no-tag (Eliminate) | 5 | Neither urgent nor important |
| Buy shopping item | 3 | Per item checked off |

XP is awarded when a todo or shopping item is **checked off** (toggled from incomplete → complete). Unchecking does NOT deduct XP (no penalty for re-opening a task).

### Streak Multiplier

| Streak Length | Multiplier |
|---------------|------------|
| 0-2 days | 1x (base) |
| 3-6 days | 1.5x |
| 7+ days | 2x |

Streak = consecutive calendar days where at least one task or shopping item was completed.

### XP Calculation

```
awarded_xp = base_xp * streak_multiplier
total_xp += awarded_xp
```

XP is rounded to nearest integer after multiplier.

---

## Leveling Curve

Level thresholds use an increasing gap formula:

```
xp_to_reach_level[N] = sum of (i * 30 + 20) for i = 1 to N-1
```

Which produces:

| Level | Cumulative XP | XP to next level |
|-------|---------------|-----------------|
| 1 | 0 | 50 |
| 2 | 50 | 80 |
| 3 | 130 | 110 |
| 4 | 240 | 140 |
| 5 | 380 | 170 |
| 6 | 550 | 200 |
| 7 | 750 | 230 |
| 8 | 980 | 260 |
| 9 | 1240 | 290 |
| 10 | 1530 | 320 |
| 11 | 1850 | 350 |
| 12 | 2200 | 380 |
| 13 | 2580 | 410 |
| 14 | 2990 | 440 |
| 15 | 3430 | 470 |
| 16 | 3900 | 500 |
| 17 | 4400 | 530 |
| 18 | 4930 | 560 |
| 19 | 5490 | 590 |
| 20 | 6080 | — (max) |

Cap at level 20. XP continues accumulating beyond cap but level stays at 20.

---

## Streak System

### Rules
- A streak day is any calendar day (UTC+8) where ≥1 completion occurred
- Streak increments when a completion happens on a new day
- Streak resets to 0 when a full calendar day passes with zero completions
- Only checked-off items count (not adds or deletes)
- Both todos and shopping items count toward streak

### Storage
- `meor-streak`: integer — current streak count
- `meor-last-date`: string — last date with a completion, stored as `YYYY-MM-DD`

### Algorithm (on every completion)
```
today = current date as YYYY-MM-DD
if meor-last-date === today:
    return  // already counted today, no change
if meor-last-date === yesterday:
    meor-streak += 1
else:
    meor-streak = 1
meor-last-date = today
```

---

## UI Components

### 1. Header Badge

Located below the "Second Brain" title, centered.

```
         Second Brain
  [Lv. 5] ▓▓▓▓▓▓▓░░░ 72%  🔥 3d
```

HTML structure:
```html
<div id="rpg-badge">
  <span class="rpg-level">Lv. 5</span>
  <div class="rpg-xp-bar">
    <div class="rpg-xp-fill" style="width: 72%"></div>
  </div>
  <span class="rpg-streak">🔥 3d</span>
</div>
```

CSS:
- `.rpg-badge` — inline-flex, centered, gap between elements, subtle background pill
- `.rpg-level` — bold, monospace or semi-mono font, green accent color
- `.rpg-xp-bar` — thin (4px height) rounded track, dark background, ~120px wide
- `.rpg-xp-fill` — gradient fill (green → blue), smooth width transition
- `.rpg-streak` — small text, orange/fire color
- When streak is 0: hide the streak element entirely

Styling should be compact — one line, not adding much vertical space.

### 2. Level-up Celebration

When the player levels up:
1. **Sound**: Play a rising triumphant tone via SoundManager (new method `SoundManager.levelUp()` — 3 ascending notes: 523Hz → 659Hz → 784Hz, each 100ms)
2. **Confetti**: Spawn ~40 small colored squares/circles from the center of the header, fall downward with gravity and fade out over 1.5 seconds
3. **Level number flash**: The `.rpg-level` element gets a brief scale pulse (1 → 1.3 → 1) over 300ms

Confetti implementation (pure CSS/JS, no library):
- Create 40 `<div>` elements with random positions, colors (from the quadrant + accent palette), and animation delays
- Use `@keyframes confettiFall` { 0% { transform: translateY(0) rotate(0deg); opacity: 1 } 100% { transform: translateY(400px) rotate(720deg); opacity: 0 } }
- Clean up after animation ends

---

## Data Storage (localStorage)

| Key | Type | Example | Persisted when |
|-----|------|---------|----------------|
| `meor-xp` | number | 380 | On every completion |
| `meor-level` | number | 5 | On level-up |
| `meor-streak` | number | 3 | On first completion of a day |
| `meor-last-date` | string | "2026-06-11" | On first completion of a day |
| `meor-total-completed` | number | 47 | On every completion |

---

## Sound Integration

Add one new method to the existing `SoundManager`:

```js
levelUp() {
  this._tone(523, 0.1, 'sine', 0.07);
  setTimeout(() => this._tone(659, 0.1, 'sine', 0.07), 120);
  setTimeout(() => this._tone(784, 0.15, 'sine', 0.07), 240);
}
```

Triggered when level increases after awarding XP.

---

## Files to Modify

### `index.html`
- Add the `#rpg-badge` HTML element below the `<h1>` tag in the header

### `styles.css`
- `.rpg-badge` — flex row, centered, gap, margin-top
- `.rpg-level` — styled level text
- `.rpg-xp-bar` / `.rpg-xp-fill` — progress bar
- `.rpg-streak` — streak text
- `@keyframes confettiFall` — confetti animation
- `.confetti-piece` — absolute positioned, small colored square
- `.rpg-level.pulse` — scale animation on level-up

### `app.js`
- Add localStorage read/write helpers for XP/level/streak data
- Add `awardXP(baseXp)` function — calculates streak multiplier, awards XP, checks level-up
- Add `updateRpgBadge()` function — reads state, updates the badge DOM
- Add `triggerLevelUp()` function — plays sound, spawns confetti, pulses badge
- Hook into `toggleTodo()` and `toggleShoppingItem()` — call `awardXP()` when item is checked **completed** (not unchecked)
- Add `renderRpgBadge()` called on init and after any state change
- Handle streak calculation on each completion

---

## Edge Cases

- **No XP penalty** for unchecking or deleting items — only forward progress
- **XP cap at level 20**: XP continues accruing but level display stays at 20
- **Zero state**: New user has level 1, 0 XP, no streak — badge shows `Lv. 1` with empty bar, no streak
- **Streak reset**: If user misses a day, streak resets to 0 on next completion
- **Page refresh**: All progress survives via localStorage
- **Multiple completions same day**: XP awarded each time, streak not incremented past 1/day
- **Confetti cleanup**: DOM elements removed after animation completes (1.5s + small buffer)

---

## Verification

1. Open `index.html` in a browser
2. Check that the header shows `Lv. 1` with 0% XP bar, no streak
3. Complete a !ui todo → XP bar should fill partially, level may increase
4. Complete multiple tasks → XP accumulates, bar fills, level-up triggers confetti + sound
5. Refresh the page → all progress persists
6. Check streak: complete tasks on consecutive days → streak counter appears and grows
7. Miss a day → streak resets
8. Reach level 20 → level stays at 20, XP bar shows full
