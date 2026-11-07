import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { LogOut, Users } from 'lucide-react'
import { useAccount } from '../account'
import { useGames } from '../hooks/useGames'
import { useParty } from './context'
import { gameSlug, partyGameUrl } from './slug'

/**
 * The game a party plays, on top of the lobby. The party socket lives in PartyProvider, above this, so it survives the
 * switch. The game is same origin (the router serves it under /<slug>), which is also what lets us catch a game's own
 * "back to the lobby" link: loaded in this frame it would be refused (the lobby cannot be framed) and leave a blank page.
 */
export default function PartyGameFrame() {
  const { t } = useTranslation()
  const games = useGames()
  const { username } = useAccount()
  const { view, isLeader, leave, selectGame } = useParty()
  const slug = view?.game ?? null
  const shown = useRef(false)
  const title = games.find(game => gameSlug(game) === slug)?.title ?? slug ?? ''
  // The click handler outlives renders, and the leader can change while a game is open.
  const latest = useRef({ isLeader, selectGame })
  useEffect(() => { latest.current = { isLeader, selectGame } })

  useEffect(() => {
    if (!slug) return
    document.documentElement.style.overflow = 'hidden'
    return () => { document.documentElement.style.overflow = '' }
  }, [slug])

  // The leader ended the game: everyone lands on the party screen.
  useEffect(() => {
    if (slug) shown.current = true
    else if (shown.current) { shown.current = false; window.location.hash = 'party' }
  }, [slug])

  if (!view || !slug) return null

  /** Links out of the game to the lobby are the leader's call (end the game) and a no-op for everyone else. */
  const watchLinks = (frame: HTMLIFrameElement) => {
    try {
      frame.contentDocument?.addEventListener('click', event => {
        const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
        if (!link || link.origin !== window.location.origin) return
        const first = link.pathname.split('/')[1]
        if (first === slug) return
        event.preventDefault()
        if (latest.current.isLeader) latest.current.selectGame(null)
      }, true)
    } catch { /* a cross-origin document cannot be watched, and cannot be reached from here either */ }
  }

  return <div className="party-frame" role="region" aria-label={t('party.playing', { title })}>
    <div className="party-bar">
      <span className="party-bar-title"><Users size={16} aria-hidden="true" />{t('party.bar', { code: view.code, count: view.members.length })}</span>
      <span className="party-bar-game">{title}</span>
      <span className="party-bar-actions">
        {isLeader && <button className="text-button" type="button" onClick={() => selectGame(null)}>{t('party.changeGame')}</button>}
        <button className="text-button" type="button" onClick={leave}><LogOut size={14} aria-hidden="true" />{t('party.leave')}</button>
      </span>
    </div>
    <iframe key={`${slug}-${view.round}`} className="party-iframe" src={partyGameUrl(slug, view.code, view.round, Boolean(username && view.host?.toLowerCase() === username.toLowerCase()))} title={title} allow="autoplay; fullscreen; clipboard-write" onLoad={event => watchLinks(event.currentTarget)} />
  </div>
}
