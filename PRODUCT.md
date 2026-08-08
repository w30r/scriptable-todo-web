# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Existing codebase answers this: vanilla HTML/CSS/JS. No build step, no package manager, no server. Open `index.html` in a browser.

## Users

Single user (Meor Syamil) in Malaysia (en-MY locale, UTC+8). Personal productivity hub used daily across devices: capture tasks, prioritize, track shopping, focus sessions, and maintain a work knowledge base.

## Product Purpose

Personal second brain. Two apps in one repo, both backed by the same Express + Mongoose backend on Render:

- **Second Brain** (`index.html`): todo list organized by Eisenhower quadrant (Do First / Schedule / Delegate / Eliminate), shopping list with categories, calendar view of due dates, pomodoro timer, and RPG gamification (XP, levels, streaks, confetti). Success = tasks actually completed, momentum sustained via streaks.
- **ELSA Work Hub** (`elsa.html`): knowledge base of cards with titles, content, and categories, organized into tabs; supports export to static HTML / plain text for feeding into Gemini Notebook and a server-rendered export endpoint.

## Positioning

Gamification is the differentiator: completing tasks earns XP scaled by quadrant importance (Do First = 20 XP down to Eliminate = 5 XP), streak multipliers (1x / 1.5x / 2x at 3 and 7 days), level curve capped at Lv. 20. Momentum and progression make a plain todo app into something the user returns to daily.

## Operating Context

- All app logic in `app.js` (~1450 lines), styling in `styles.css` (dark neumorphic theme), markup in `index.html` / `elsa.html`.
- Backend lives in sibling repo `../scriptable-todo/` (Express 5 + Mongoose 9), deployed at `https://scriptable-todo.onrender.com`.
- API endpoints used: `/api/todos`, `/api/shopping`, `/api/progress` (RPG state), `/api/elsacontext/export`.
- UI text and dates use en-MY; streak days counted in UTC+8.
- RPG progression spec documented in `docs/superpowers/specs/2026-06-11-rpg-progression-design.md` (XP table, level curve, streak rules, UI components).

## Capabilities and Constraints

### Capabilities
- Todos: create, edit (via modal), rename, delete, clear completed; tags embedded in title (`!ui`/`!nui`/`!uni`, empty = Eliminate); drag-and-drop between quadrants; search; filter All/Active/Completed; due dates.
- Shopping: add with category, inline rename on double-click, checkbox toggle, clear bought, search, category filter.
- Calendar: month view, prev/next nav, due-date dots (done/overdue/upcoming), click day to add task with that date, click dot to edit.
- Pomodoro: 25 min focus / 5 min break, pause/resume/reset, session count persisted.
- RPG: XP, level (cap 20), streak, total completed, level-up confetti + sound.
- Stats dashboard: level/XP/streak/done, weekly bar chart, quadrant distribution, shopping category breakdown, 30-day streak grid.
- Sounds via Web Audio API `SoundManager` (check/uncheck/add/delete/drop/click/success/levelUp).
- Keyboard: `/` or `n` focuses add (shopping) or opens new-task modal; `Escape` closes modals.

### Constraints
- No auth — single user, data shared across everything.
- No build step; pure vanilla JS, no frameworks, no tests, no lint.
- Free Render tier: cold starts happen; frontend retries fetch every 5s while API spins up.
- Filters/tab/session state persisted in `localStorage` (`meor-filter`, `meor-shop-filter`, `meor-tab`, `meor-pomo-sessions`).
- RPG progression state synced to backend `/api/progress`; falls back to defaults if API unavailable.
- No XSS risk taken — user content escaped via `escapeHtml()`.

## Brand Commitments

- App title "Second Brain"; h1 reads "Second Brain"; HTML title "meor todo list".
- ELSA app titled "ELSA — Work Hub".
- Dark neumorphic aesthetic (dark gray surfaces, subtle shadows, rounded corners), Apple SF system font stack, accent colors: green/blue/purple/orange/red from iOS palette.
- RPG identity: green level number, orange streak (🔥 emoji), green→blue XP bar.

## Evidence on Hand

- Working deployed backend: `https://scriptable-todo.onrender.com`.
- RPG design spec: `docs/superpowers/specs/2026-06-11-rpg-progression-design.md`.
- Live frontends: `index.html`, `elsa.html`.
- No testimonials, no press, no other users.

## Product Principles

1. Momentum over raw count — streaks and XP reward consistent daily completion, never punish unchecking or deleting.
2. Capture friction must stay near zero — `/` or `n` opens add from anywhere; add works by quadrant tap.
3. Importance-aware prioritization — Eisenhower quadrants and per-quadrant XP encode that not all tasks weigh the same.
4. Vanilla and durable — no build step, no frameworks; everything must keep working by opening a file.
5. Data lives server-side, state lives locally — items on Render, UI prefs in localStorage.

## Accessibility & Inclusion

- Keyboard support: `/`, `n`, `Escape`.
- Color conveys quadrant/category state; text labels also present (no pure-color indicators).
- No product-specific accessibility standard established beyond the above.
