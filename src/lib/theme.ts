import { parse } from 'jsonc-parser'

const CSS_VAR_MAP: Record<string, string> = {
  sidebarBackground: '--accent-primary',
  sidebarIconActive: '--accent-secondary',
  panelBackground:   '--surface-panel',
  panelItemActive:   '--surface-secondary',
  surfacePrimary:    '--surface-primary',
  pageBackground:    '--page-background',
}

export async function loadTheme(): Promise<void> {
  try {
    const res = await fetch('/theme.jsonc', { cache: 'no-cache' })
    if (!res.ok) return
    const text = await res.text()
    const { colors } = parse(text) as { colors: Record<string, string> }
    const root = document.documentElement
    for (const [key, cssVar] of Object.entries(CSS_VAR_MAP)) {
      if (colors[key]) root.style.setProperty(cssVar, colors[key])
    }
  } catch {
    // Leave CSS defaults in place if theme file is missing or malformed
  }
}
