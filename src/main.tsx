import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'react-datasheet-grid/dist/style.css'
import App from './App.tsx'
import { loadTheme } from './lib/theme.ts'

loadTheme().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
