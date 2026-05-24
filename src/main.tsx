import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CladdProvider } from '@cladd-ui/react'
import './index.css'
import App from './app.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CladdProvider>
      <App />
    </CladdProvider>
  </StrictMode>,
)
