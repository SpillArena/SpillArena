import { useEffect, useState } from 'react'
import { Share, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const DISMISSED_KEY = 'spillarena:install-dismissed'

interface InstallEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

const isIos = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

function wasDismissed() {
  try { return localStorage.getItem(DISMISSED_KEY) === '1' } catch { return false }
}

/*
 * Ber telefonbrukere om å legge SpillArena på hjem-skjermen. Manifestet i
 * /site.webmanifest har scope "/", så den installerte appen dekker forsiden og
 * alle spillene under spillarena.no/<spill>.
 *
 * Android/Chrome gir oss en egen installeringsdialog (beforeinstallprompt).
 * iOS har ingen, så der viser vi hvor knappen ligger i Safari.
 */
export default function InstallPrompt() {
  const { t } = useTranslation()
  const [event, setEvent] = useState<InstallEvent | null>(null)
  const [hidden, setHidden] = useState(() => wasDismissed() || isStandalone())
  const ios = isIos()

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setEvent(e as InstallEvent)
    }
    const onInstalled = () => setHidden(true)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const touch = window.matchMedia('(pointer: coarse)').matches
  if (hidden || !touch || (!event && !ios)) return null

  const dismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, '1') } catch { /* private mode: it just comes back next visit */ }
    setHidden(true)
  }
  const install = async () => {
    if (!event) return
    await event.prompt()
    const { outcome } = await event.userChoice
    setEvent(null)
    if (outcome === 'accepted') setHidden(true)
  }

  return <aside className="install-prompt" aria-labelledby="install-prompt-title">
    <img src="/icon-192.png" alt="" width={44} height={44} />
    <div className="install-prompt-text">
      <strong id="install-prompt-title">{t('install.title')}</strong>
      <span>{event ? t('install.description') : <>{t('install.iosBefore')} <Share size={14} aria-label={t('install.shareIcon')} /> {t('install.iosAfter')}</>}</span>
    </div>
    {event && <button className="button primary" type="button" onClick={install}>{t('install.action')}</button>}
    <button className="install-prompt-close" type="button" onClick={dismiss} aria-label={t('install.dismiss')}><X size={18} aria-hidden="true" /></button>
  </aside>
}
