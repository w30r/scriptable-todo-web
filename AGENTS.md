# scriptable-todo-web

Vanilla HTML/CSS/JS todo + shopping app with Eisenhower Matrix. No build step, no package manager, no server.

## Run

Open `index.html` in a browser — no dev server needed.

## Architecture

- `index.html` — single-page app shell with tab navigation (TODO / SHOPPING)
- `styles.css` — all styling (dark neumorphism)
- `app.js` — all app logic (vanilla JS, ~650 lines)
- Backend: `../scriptable-todo/` (Express + Mongoose on Render)

## Data & State

### TODO tab

- Items fetched/created/updated/deleted via `https://scriptable-todo.onrender.com/api/todos`
- Category tags embedded in title: `!ui` (Do First), `!nui` (Schedule), `!uni` (Delegate), empty (Eliminate)
- Filter persisted in `localStorage` under key `meor-filter`
- Quadrants defined in `app.js:4-9`

### SHOPPING tab

- Items fetched/created/updated/deleted via `https://scriptable-todo.onrender.com/api/shopping`
- Each item has: `name`, `category` (grocery/watsons/mrdiy), `completed`
- Tab state persisted in `localStorage` under key `meor-tab`
- Category filter persisted in `localStorage` under key `meor-shop-filter`
- Categories defined in `app.js:11-15`

## Backend (`../scriptable-todo/`)

- Express 5 + Mongoose 9
- MongoDB via Mongoose
- Models: `Todo` (title, completed), `ShoppingItem` (name, category, completed)
- Routes: `/api/todos`, `/api/shopping` (both full CRUD + clear-completed)
- Deployed at: `https://scriptable-todo.onrender.com`

## No

No tests, no lint, no typecheck, no CI, no package.json, no frameworks.
