import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app'
import './index.css'
import { BrowserRouter, useNavigate } from 'react-router'
import { ThemeProvider } from '@/components/theme-provider'
import { setNavigationCallback } from '@/lib/api-client'

function AppWithNavigation() {
  const navigate = useNavigate()
  
  // Configura o callback de navegação para erros de autenticação
  setNavigationCallback((path: string) => navigate(path))
  
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppWithNavigation />
    </BrowserRouter>
  </StrictMode>,
)
