# Collapsible SubItemsPanel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the existing hamburger button in `IconSidebar` to toggle `SubItemsPanel` open/closed with a 250ms slide animation.

**Architecture:** `panelOpen` boolean state lives in `App.tsx` and defaults to `true` on every page load. `IconSidebar` receives an `onTogglePanel` callback. `SubItemsPanel` is wrapped in a clipping div whose `width` transitions between 200px and 0, letting `MainContent`'s `flex: 1` fill the freed space automatically.

**Tech Stack:** React 19, TypeScript, CSS transitions (no new dependencies), Vitest + @testing-library/react.

---

## File Map

| File | Change |
|------|--------|
| `src/components/layout/IconSidebar.tsx` | Add `onTogglePanel` prop, wire to hamburger button |
| `src/App.tsx` | Add `panelOpen` state, pass prop to `IconSidebar`, wrap `SubItemsPanel` in clipping div |
| `tests/IconSidebar.test.tsx` | New — verify hamburger click calls `onTogglePanel` |

---

## Task 1: Add onTogglePanel prop to IconSidebar

**Files:**
- Modify: `src/components/layout/IconSidebar.tsx`
- Create: `tests/IconSidebar.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/IconSidebar.test.tsx` with:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { IconSidebar } from '../src/components/layout/IconSidebar'

describe('IconSidebar', () => {
  it('calls onTogglePanel when the menu button is clicked', () => {
    const onTogglePanel = vi.fn()
    render(<IconSidebar onTogglePanel={onTogglePanel} />)
    fireEvent.click(screen.getByLabelText('Toggle menu'))
    expect(onTogglePanel).toHaveBeenCalledTimes(1)
  })

  it('does not throw when menu button is clicked multiple times', () => {
    const onTogglePanel = vi.fn()
    render(<IconSidebar onTogglePanel={onTogglePanel} />)
    fireEvent.click(screen.getByLabelText('Toggle menu'))
    fireEvent.click(screen.getByLabelText('Toggle menu'))
    expect(onTogglePanel).toHaveBeenCalledTimes(2)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --run tests/IconSidebar.test.tsx
```

Expected: FAIL — `IconSidebar` does not accept `onTogglePanel` prop yet.

- [ ] **Step 3: Update IconSidebar to accept and wire the prop**

Replace the entire contents of `src/components/layout/IconSidebar.tsx` with:

```tsx
interface IconSidebarProps {
  onTogglePanel: () => void
}

const NAV_ICONS = [
  { name: 'task_alt', label: 'Tasks', active: false },
  { name: 'folder', label: 'Projects', active: true },
  { name: 'person', label: 'Contacts', active: false },
  { name: 'leaderboard', label: 'Leads', active: false },
  { name: 'label', label: 'Statuses', active: false },
]

export function IconSidebar({ onTogglePanel }: IconSidebarProps) {
  return (
    <div style={{
      width: 56,
      minHeight: '100vh',
      background: 'var(--accent-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '16px 0',
      flexShrink: 0,
    }}>
      <button
        aria-label="Toggle menu"
        onClick={onTogglePanel}
        style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>menu</span>
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {NAV_ICONS.map(icon => (
          <button
            key={icon.name}
            title={icon.label}
            aria-label={icon.label}
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: icon.active ? 'var(--accent-secondary)' : 'transparent',
            }}
          >
            <span className="material-symbols-outlined" style={{
              fontSize: 24,
              color: icon.active ? 'white' : 'rgba(255,255,255,0.6)',
            }}>
              {icon.name}
            </span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <button
          aria-label="Settings"
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRadius: 'var(--radius-md)', padding: 4 }}
        >
          <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 24 }}>settings</span>
        </button>
        <button
          aria-label="User profile"
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-round)',
            background: 'var(--accent-secondary)',
            color: 'white',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontFamily: 'var(--font-captions)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          HD
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- --run tests/IconSidebar.test.tsx
```

Expected: 2 tests PASS.

- [ ] **Step 5: Run full test suite to check for regressions**

```bash
npm test -- --run
```

Expected: all 25 tests PASS (23 existing + 2 new). TypeScript will show one error in `App.tsx` about missing `onTogglePanel` prop — this is expected and fixed in Task 2.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/IconSidebar.tsx tests/IconSidebar.test.tsx
git commit -m "feat: add onTogglePanel prop to IconSidebar"
```

---

## Task 2: Wire panelOpen state and animation in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add useState import**

Open `src/App.tsx`. The first line currently imports only `useProjects`. Add `useState` to the React import. Since this project uses React 19 with the new JSX transform, there is no existing `import React` — add a new import:

```ts
import { useState } from 'react'
```

Place it as the first line of the file, before the existing imports.

- [ ] **Step 2: Add panelOpen state and toggle handler**

Inside the `App` function body, after the `useProjects()` destructuring block (after line 35), add:

```ts
const [panelOpen, setPanelOpen] = useState(true)
const handleTogglePanel = () => setPanelOpen(p => !p)
```

- [ ] **Step 3: Pass onTogglePanel to IconSidebar**

Update the `<IconSidebar />` JSX from:

```tsx
<IconSidebar />
```

to:

```tsx
<IconSidebar onTogglePanel={handleTogglePanel} />
```

- [ ] **Step 4: Wrap SubItemsPanel in the clipping div**

Replace the current `<SubItemsPanel ... />` block:

```tsx
<SubItemsPanel
    totalCount={sourceRows.length}
    onAddItem={handleAddItem}
    activeStatusFilter={activeStatusFilter}
    onStatusChange={setStatusFilter}
  />
```

with:

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

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Run all tests**

```bash
npm test -- --run
```

Expected: all 25 tests PASS.

- [ ] **Step 7: Start dev server and verify manually**

```bash
npm run dev
```

Check:
- Page loads with SubItemsPanel visible ("All / New / Started / Done" filter list shown)
- Clicking the ≡ hamburger icon smoothly slides the panel left (250ms), grid expands right
- Clicking ≡ again slides the panel back in, grid contracts
- Filter state (active status) is preserved across open/close cycles
- Page refresh shows the panel open

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire collapsible SubItemsPanel with slide animation"
```
