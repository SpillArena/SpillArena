import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import i18n from './i18n/i18n'
import './index.css'
import { CookieConsentProvider } from './context/CookieConsentProvider'
import { ThemeProvider } from './context/ThemeContext'
import { AccentProvider } from './context/AccentProvider'
import './ui/arena.css'
import './ui/lobby.css'
import App from './App'
import CookieConsentBanner from './components/CookieConsentBanner'
import { hideLoader, installGameLinkLoader } from './ui/loader'

/*
 * Økten lagres bare når samtykket er gitt. Uten det lever innloggingen i minnet
 * og dør med fanen — spilleren kommer inn, men blir ikke husket. Den koblingen
 * ligger nå i src/account/ (session.ts leser svaret fra consent.ts), felles for
 * forsiden og alle spillene, så den trenger ikke settes opp her.
 */

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

// lasteren fra index.html har stått siden første byte; nå er det noe å vise
requestAnimationFrame(hideLoader)
installGameLinkLoader(game => i18n.t('lobby.loadingGame', { title: game.title }))
