# scriptable-todo-web

Vanilla HTML/CSS/JS todo app with Eisenhower Matrix. No build step, no package manager, no server.

## Run

Open `index.html` in a browser — no dev server needed.

## Architecture

- `index.html` — single-page app shell
- `styles.css` — all styling (dark neumorphism)
- `app.js` — all app logic (vanilla JS, ~360 lines)
- External API: `https://scriptable-todo.onrender.com/api/todos`

## Data & State

- Todos are fetched/created/updated/deleted via the external API
- Category tags embedded in title: `!ui` (Do First), `!nui` (Schedule), `!uni` (Delegate), empty (Eliminate)
- Filter persisted in `localStorage` under key `meor-filter`
- Quadrants defined in `app.js:3-8`

## Design

- Dark neumorphism (modern skeuomorphism) — dual-shadow depth, no borders
- Emoji favicon (`📝`) set via inline SVG data URI in `<head>`
- System sans-serif font, rounded corners (14–16px)
- Keep the design style consistent when adding/changing elements

## No

No tests, no lint, no typecheck, no CI, no package.json, no frameworks.
