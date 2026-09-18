import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n/i18n'
import './index.css'
import { CookieConsentProvider } from './context/CookieConsentProvider'
import { ThemeProvider } from './context/ThemeContext'
import { AccentProvider } from './context/AccentProvider'
import App from './App'
import CookieConsentBanner from './components/CookieConsentBanner'
import { configureSession } from './account'
import { hasConsent } from './lib/cookieConsent'

/*
 * Økten lagres bare når samtykket er gitt. Uten det lever innloggingen i minnet
 * og dør med fanen — spilleren kommer inn, men blir ikke husket. Se
 * src/account/session.ts.
 */
configureSession({ hasConsent })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CookieConsentProvider>
      <ThemeProvider>
        <AccentProvider>
          <App />
          <CookieConsentBanner />
        </AccentProvider>
      </ThemeProvider>
    </CookieConsentProvider>
  </StrictMode>
)
