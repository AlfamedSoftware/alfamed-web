import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app'
import './index.css'
import { BrowserRouter } from 'react-router'
import { ThemeProvider } from '@/components/theme-provider'
import { authBaseUrl } from '@/lib/auth'

async function checkApiHealth() {
  try {
    const response = await fetch(`${authBaseUrl}/health`)

    if (!response.ok) {
      console.log('API offline')
      return
    }

    const data = await response.json()
    if (data?.status === 'ok') {
      console.log('API online')
      return
    }

    console.log('API offline')
  } catch {
    console.log('API offline')
  }
}

void checkApiHealth()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
