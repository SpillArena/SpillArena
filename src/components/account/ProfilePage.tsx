import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowUpRight, KeyRound, LogOut, Pencil, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { fetchAccount, levelProgress } from '../../account'
import type { AccountOverview, GameId } from '../../account'
import { gameIcon, games, type Game } from '../../data/games'
import { formatDate } from '../../lib/formatDate'
import Dialog from '../../ui/Dialog'
import AdminPanel from '../admin/AdminPanel'
import RenameForm from './RenameForm'
import RecoveryCodeForm from './RecoveryCodeForm'

// Game-specific profile documents only share their XP field.
function xpOf(progress: unknown): number | null {
  if (typeof progress !== 'object' || progress === null) return null
  const xp = (progress as { xp?: unknown }).xp
  return typeof xp === 'number' && Number.isFinite(xp) && xp >= 0 ? xp : null
}
const idOf = (game: Game) => new URL(game.liveUrl).pathname.split('/').filter(Boolean)[0] as GameId

function SignedInProfile({ username, onSignOut, onPlay }: { username: string; onSignOut: () => void; onPlay: (game: Game) => void }) {
  const { t, i18n } = useTranslation()
  const [overview, setOverview] = useState<AccountOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const [editing, setEditing] = useState<'rename' | 'recovery' | null>(null)
  const [adminOpen, setAdminOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetchAccount().then(result => {
      if (cancelled) return
      if (result.ok) { setOverview(result.data); setError(null) }
      else setError(result.error)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [username, attempt])

  const refresh = () => { setLoading(true); setError(null); setAttempt(value => value + 1) }
  const saved = games.map(game => ({ game, entry: overview?.games[idOf(game)], xp: xpOf(overview?.games[idOf(game)]?.progress) }))
  const totalXp = saved.reduce((total, item) => total + (item.xp ?? 0), 0)
  const globalLevel = levelProgress(totalXp)
  const formatNumber = (value: number) => value.toLocaleString(i18n.resolvedLanguage === 'no' ? 'nb-NO' : 'en-US')

  return <section className="profile-page" aria-labelledby="profile-title">
    <a className="back-link" href="#"><ArrowLeft size={16} aria-hidden="true" />{t('profile.backToGames')}</a>
    <div className="profile-heading"><div className="profile-avatar" aria-hidden="true">{[...username].slice(0, 2).join('').toUpperCase()}</div><div className="profile-identity"><p className="eyebrow">{t('account.yourProfile')}</p><h1 id="profile-title">{username}</h1>{overview?.createdAt && <p className="profile-member">{t('account.memberSince', { date: formatDate(overview.createdAt) })}</p>}</div><button type="button" className="button secondary" onClick={() => setEditing('rename')}><Pencil size={16} aria-hidden="true" />{t('account.rename')}</button></div>
    <p className="profile-lead">{t('profile.intro')}</p>
    {loading ? <p className="profile-state" role="status">{t('profile.loading')}</p> : error ? <div className="form-error" role="alert"><p>{t(`account.errors.${error}`, { defaultValue: t('account.errors.service_failed') })}</p><button type="button" className="button secondary" onClick={refresh}>{t('profile.retry')}</button></div> : <>
      <div className="profile-stats"><div><span>{t('profile.totalXp')}</span><strong>{formatNumber(totalXp)} <small>XP</small></strong></div><div><span>{t('profile.arenaLevel')}</span><strong>{globalLevel.level}</strong><progress max={100} value={globalLevel.pct} aria-label={t('profile.arenaLevel')} /><p>{t('profile.nextLevel', { count: globalLevel.need - globalLevel.into, level: globalLevel.level + 1 })}</p></div><div><span>{t('profile.gamesWithProgress')}</span><strong>{saved.filter(item => item.xp !== null).length}<small> / {games.length}</small></strong></div></div>
      <div className="section-heading profile-games-heading"><div><p className="eyebrow">{t('profile.yourArena')}</p><h2>{t('profile.gameProgress')}</h2></div><a className="inline-link" href="#games">{t('lobby.explore')} ↗</a></div>
      <ul className="profile-game-grid">{saved.map(({ game, entry, xp }) => {
        const level = xp === null ? null : levelProgress(xp)
        return <li className="profile-game" key={game.id}><div className="profile-game-top"><img src={gameIcon(game)} alt="" width={64} height={64} /><div><p className="category-label">{t(`lobby.categories.${game.category}`)}</p><h3>{game.title}</h3></div><a className="icon-button" href={game.liveUrl} aria-label={`${t('lobby.play')}: ${game.title}`} onClick={event => { if (game.beta || !(event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)) { event.preventDefault(); onPlay(game) } }}><ArrowUpRight size={19} /></a></div>
          {level ? <><div className="profile-game-values"><span>{t('profile.gameLevel', { level: level.level })}</span><span>{xp === null ? null : formatNumber(xp)} XP</span></div><progress max={100} value={level.pct} aria-label={`${game.title}: ${t('profile.gameLevel', { level: level.level })}`} /><p className="profile-game-note">{t('profile.lastSaved', { date: formatDate(entry?.updatedAt) })}</p></> : <p className="profile-game-note">{t('account.notPlayed')} · {t('profile.startPlaying')}</p>}
        </li>
      })}</ul>
    </>}
    <section className="profile-account" aria-labelledby="profile-account-title"><div><p className="eyebrow">{t('account.title')}</p><h2 id="profile-account-title">{t('profile.accountSettings')}</h2><p>{t('profile.recoveryDescription')}</p></div><div className="profile-account-actions">
      {overview?.hasRecoveryCode !== undefined && <button type="button" className="button secondary" onClick={() => setEditing('recovery')}><KeyRound size={16} aria-hidden="true" />{t(overview.hasRecoveryCode ? 'account.recovery.replace' : 'account.recovery.create')}</button>}
      {overview?.admin && <button type="button" className="button secondary" onClick={() => setAdminOpen(true)}><ShieldCheck size={16} aria-hidden="true" />{t('admin.open')}</button>}
      <button type="button" className="button text-button" onClick={onSignOut}><LogOut size={16} aria-hidden="true" />{t('account.signOut')}</button>
    </div></section>
    {overview?.hasRecoveryCode === false && <div className="form-warning"><p>{t('account.recovery.missing')}</p></div>}
    <Dialog open={editing !== null} onClose={() => setEditing(null)} dismissible={false} title={t(editing === 'rename' ? 'profile.renameTitle' : 'account.recovery.savedTitle')}>
      {editing === 'rename' ? <RenameForm current={username} onCancel={() => setEditing(null)} onDone={() => { setEditing(null); refresh() }} /> : <RecoveryCodeForm username={username} replacing={overview?.hasRecoveryCode === true} onCancel={() => setEditing(null)} onDone={() => { setEditing(null); refresh() }} />}
    </Dialog>
    <AdminPanel open={adminOpen} onClose={() => setAdminOpen(false)} username={username} />
  </section>
}

export default function ProfilePage({ username, onSignOut, onPlay }: { username: string | null; onSignOut: () => void; onPlay: (game: Game) => void }) {
  const { t } = useTranslation()
  if (!username) return <section className="guest-profile"><p className="eyebrow">{t('account.yourProfile')}</p><h1>{t('lobby.accountTitle')}</h1><p>{t('profile.signInIntro')}</p><a className="button primary" href="#login">{t('account.signIn')}<ArrowUpRight size={16} aria-hidden="true" /></a><a className="back-link" href="#">{t('profile.guestPlay')}</a></section>
  return <SignedInProfile key={username} username={username} onSignOut={onSignOut} onPlay={onPlay} />
}
