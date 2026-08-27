import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Hide Pro islands (footer bar, etc.) until the menu theme is applied.
document.documentElement.classList.add('hb-booting')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
