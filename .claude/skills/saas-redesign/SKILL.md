---
name: saas-redesign
description: Redesign this Vue 3 app's UI into a modern SaaS layout — convert the top nav bar into a collapsible left sidebar (+ slim top bar), unify spacing, and apply a polished professional look. Use when asked to modernize the UI, add a sidebar, redesign the navigation, or improve the app's visual design.
---

# SaaS Redesign — Top Nav → Collapsible Left Sidebar

Convert the app shell from a horizontal top navigation bar into a modern SaaS-style layout:
a **collapsible left sidebar** for navigation plus a **slim top bar** for page context and utilities.
Preserve every route, all i18n behavior, and all existing functionality — this is a visual/layout
redesign, not a feature change.

## Mission & Guardrails

- **Goal:** left sidebar (logo + nav) + slim top bar (page title, filters, language, profile),
  collapsible on desktop and an off-canvas drawer on mobile.
- **MANDATORY — delegate all `.vue` work to the `vue-expert` subagent.** Per the project CLAUDE.md,
  ANY time you create or significantly modify a `.vue` file you MUST use the `vue-expert` agent. Do
  not hand-edit `.vue` files in this skill; pass `vue-expert` the spec below.
- **No emojis in UI.** Use inline SVG icons (design-system rule).
- **Preserve i18n.** Keep using `t('nav.*')` for labels; add keys to BOTH `en.js` and `ja.js`.
- **Keep Composition API** (`<script setup>` or `setup()`), scoped styles, unique `v-for` keys
  (never the array index).
- Keep all six routes working: `/`, `/inventory`, `/orders`, `/spending`, `/demand`, `/reports`.

## Target Files

| File | Change |
|------|--------|
| `client/src/App.vue` | **Primary.** Restructure `.app` from `flex-direction: column` to a sidebar + content row. Add `.sidebar`, `.topbar`, `.content` regions. Introduce `:root` design tokens. Wire collapse/mobile state. |
| `client/src/components/FilterBar.vue` | Move into the slim top bar. Remove the `position: sticky; top: 70px` offset — it now lives in the content column's header, not under a full-width top nav. |
| `client/src/components/ProfileMenu.vue` | Reposition into the top bar (right side). Verify the dropdown still anchors correctly (`top: calc(100% + 0.5rem); right: 0`). |
| `client/src/components/LanguageSwitcher.vue` | Reposition into the top bar (right side, before ProfileMenu). Verify dropdown positioning. |
| `client/src/locales/en.js` & `ja.js` | Add new labels: `nav.reports` (currently hardcoded English in App.vue — fix it), `nav.collapse`, `nav.expand`, `nav.openMenu`. |
| `client/src/composables/useSidebar.js` *(new, optional)* | Shared reactive state (`collapsed`, `mobileOpen`) so the top bar hamburger and sidebar toggle stay in sync. Mirror the pattern in `composables/useFilters.js`. |

## Layout Spec

```
┌──────┬────────────────────────────────────┐
│ LOGO │  ☰  Page Title      [filters] 🌐 👤 │  ← slim top bar (sticky)
│      ├────────────────────────────────────┤
│ Nav  │                                     │
│  •   │        router-view content          │
│  •   │                                     │
│──────│                                     │
│  ‹    │  ← collapse toggle (pinned bottom)  │
└──────┴────────────────────────────────────┘
```

**Sidebar**
- Fixed left, full viewport height, own vertical scroll for the nav list.
- Width: `256px` expanded, `64px` collapsed (icons only) — transition `width 0.2s ease`.
- Top: logo/company name (`nav.companyName` + `nav.subtitle`); hide the text when collapsed, keep a mark.
- Middle: nav list — each item is icon + label; label hidden when collapsed (show `title`/`aria-label`).
- Bottom: collapse/expand toggle button (`nav.collapse` / `nav.expand`).

**Top bar**
- Sticky at top of the content column, ~`64px` tall, white with bottom border (`--slate-300`).
- Left: mobile hamburger (`nav.openMenu`, shown < 768px), then the page title.
- Right: `FilterBar` (or a filter trigger), `LanguageSwitcher`, `ProfileMenu`.

**Content column**
- `margin-left` equal to the current sidebar width (`256px` / `64px`), transitioned to match.
- Keep the existing `max-width` content wrapper and page padding for consistency.

**Responsive (add — the app currently has NO media queries)**
- `< 768px`: sidebar becomes an off-canvas drawer (translateX off-screen by default) with a
  semi-transparent backdrop; the hamburger toggles `mobileOpen`; clicking the backdrop or a nav link closes it.
- Content column drops its `margin-left` on mobile (drawer overlays instead of pushing).

## Design Tokens

Colors are currently **hardcoded** throughout. Promote them to `:root` CSS variables in `App.vue`
and refactor the sidebar/top-bar styles to consume them (leave unrelated view styles alone unless
trivially adjacent):

```css
:root {
  --slate-900: #0f172a;  --slate-600: #64748b;  --slate-300: #e2e8f0;
  --slate-100: #f1f5f9;  --slate-50: #f8fafc;   --white: #ffffff;
  --blue-600: #2563eb;   --blue-50: #eff6ff;
  --green: #10b981;      --amber: #f59e0b;      --red: #ef4444;

  --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem;
  --space-4: 1rem;    --space-5: 1.5rem; --space-6: 2rem;

  --radius-control: 6px; --radius-card: 10px;
  --shadow-nav: 0 1px 3px 0 rgba(0,0,0,0.05);
  --shadow-card: 0 4px 12px rgba(0,0,0,0.06);
  --shadow-dropdown: 0 10px 25px rgba(0,0,0,0.1);

  --sidebar-w: 256px; --sidebar-w-collapsed: 64px; --topbar-h: 64px;

  --font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

Active nav item: text `--blue-600` on `--blue-50` background (matches the current `.active` style).

## Nav Item Pattern

Drive the nav from a single array so labels, routes, and icons stay in one place:

```js
const navItems = [
  { to: '/',          key: 'nav.overview',       icon: 'grid'  },
  { to: '/inventory', key: 'nav.inventory',      icon: 'box'   },
  { to: '/orders',    key: 'nav.orders',         icon: 'cart'  },
  { to: '/spending',  key: 'nav.finance',        icon: 'chart' },
  { to: '/demand',    key: 'nav.demandForecast', icon: 'trend' },
  { to: '/reports',   key: 'nav.reports',        icon: 'doc'   },
]
```

```vue
<router-link
  v-for="item in navItems"
  :key="item.to"
  :to="item.to"
  class="nav-item"
  :class="{ active: $route.path === item.to }"
  :aria-current="$route.path === item.to ? 'page' : undefined"
  :aria-label="collapsed ? t(item.key) : undefined"
  :title="collapsed ? t(item.key) : undefined"
>
  <IconComponent :name="item.icon" />
  <span v-show="!collapsed" class="nav-label">{{ t(item.key) }}</span>
</router-link>
```

Use inline SVG icons (`stroke="currentColor"`, `width/height="20"`) — no icon library dependency,
no emojis. Note the active-state matching must use `$route.path === item.to` (the `/` overview route
would otherwise match with `startsWith`).

## Accessibility & Polish

- `aria-current="page"` on the active link; `aria-label`/`title` on collapsed icon-only items.
- Collapse toggle: `aria-expanded` reflecting `!collapsed`; hamburger: `aria-label="{{ t('nav.openMenu') }}"`.
- Visible keyboard focus states on nav items and toggles.
- Wrap transitions in `@media (prefers-reduced-motion: reduce)` to disable them.
- No cumulative layout shift when collapsing (content margin transitions in lockstep with width).

## Execution Workflow

1. **Read** `App.vue` and the four components (`FilterBar`, `ProfileMenu`, `LanguageSwitcher`, and a
   view like `Dashboard.vue`) to confirm current structure before changing anything.
2. **Delegate to `vue-expert`** — hand it this spec (target files, layout, tokens, nav pattern, a11y).
   Have it implement App.vue first, then the component repositioning, then the locale keys, then the
   optional `useSidebar` composable.
3. **Verify** with the running app:
   - Start servers via the `/start` skill (frontend `http://localhost:3000`, backend `http://localhost:8001`).
   - Use Playwright MCP (`mcp__playwright__*`) to check:
     - All 6 routes load and the active nav item highlights correctly.
     - Desktop: sidebar expands/collapses; content margin follows; no layout shift.
     - Mobile (resize < 768px): hamburger opens the drawer; backdrop and nav-link click close it.
     - EN ⇄ JA: nav labels translate; no missing-key artifacts.
     - Take before/after screenshots.
4. **Review** — optionally run the `code-reviewer` agent on the diff.

## Checklist

✅ Delegate every `.vue` edit to `vue-expert`
✅ Keep all 6 routes + i18n; add `nav.reports` and toggle labels to `en.js` AND `ja.js`
✅ Inline SVG icons; CSS variable design tokens; unique `v-for` keys
✅ Collapsible desktop sidebar + mobile off-canvas drawer + slim top bar
✅ Accessible (aria-current / aria-expanded / focus states) and reduced-motion safe

❌ No emojis in the UI
❌ No hardcoded colors in the new sidebar/top-bar styles (use tokens)
❌ Don't break routes, dropdown positioning, or the FilterBar's filter behavior
❌ Don't use the array index as a `v-for` key
