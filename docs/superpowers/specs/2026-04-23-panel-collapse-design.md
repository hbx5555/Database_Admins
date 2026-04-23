# Collapsible SubItemsPanel Design

**Date:** 2026-04-23  
**Scope:** Stage 1 — layout toggle only, no routing or multi-table changes

---

## Goal

The hamburger (≡) icon in `IconSidebar` toggles the `SubItemsPanel` open and closed with a smooth Gmail-style slide animation. The grid expands to fill the freed space.

---

## State

`panelOpen: boolean` lives in `App.tsx`, initialized to `true`.

```ts
const [panelOpen, setPanelOpen] = useState(true)
const handleTogglePanel = () => setPanelOpen(p => !p)
```

No localStorage persistence — always opens as `true` on page refresh.

---

## Animation: Clipping Wrapper

`SubItemsPanel` is wrapped in a clipping div in `App.tsx`:

```tsx
<div style={{
  width: panelOpen ? 200 : 0,
  overflow: 'hidden',
  flexShrink: 0,
  transition: 'width 250ms ease',
}}>
  <SubItemsPanel
    totalCount={sourceRows.length}
    onAddItem={handleAddItem}
    activeStatusFilter={activeStatusFilter}
    onStatusChange={setStatusFilter}
  />
</div>
```

- The panel's own `width: 200px` and `flexShrink: 0` remain unchanged
- The wrapper clips the panel content as it shrinks to 0
- The `border-right` on the panel disappears cleanly as it's clipped
- `MainContent`'s `flex: 1` naturally expands to fill the freed space during the transition
- `minWidth: 1044` on the app root remains — no change to minimum layout width

---

## IconSidebar

Accepts one new prop:

```ts
interface IconSidebarProps {
  onTogglePanel: () => void
}
```

The existing hamburger button (already rendered, `aria-label="Toggle menu"`, currently no-op) gets `onClick={onTogglePanel}`. Icon stays `menu` in both states — no icon change (matches Gmail behaviour).

---

## Files Changed

| File | Change |
|------|--------|
| `src/App.tsx` | Add `panelOpen` state + `handleTogglePanel` + wrap SubItemsPanel in clipping div |
| `src/components/layout/IconSidebar.tsx` | Add `onTogglePanel` prop, wire to hamburger button |

---

## Out of Scope

- Persisting collapsed state to localStorage
- Changing the hamburger icon based on open/closed state
- Any animation on `MainContent` itself (flex reflow handles it)
- Mobile/responsive breakpoints
- Keyboard shortcut for toggling
