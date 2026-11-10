/* FIRST, before the deck's modules evaluate: the page as built, for the student download (see `deck/pristine.ts`). */
import './deck/pristine'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
