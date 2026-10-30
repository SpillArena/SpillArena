import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, CheckCircle2, Clock3, Gamepad2, LoaderCircle, LockKeyhole, RotateCcw, Save } from 'lucide-react'
import { AVAILABILITIES, type Availability, type GameSetting } from '../../../shared/game-settings.js'
import { fetchGameSettings, saveGameSetting } from '../../admin/api'
import { errorText } from '../../admin/format'
import type { AdminErrorCode } from '../../admin/types'
import { gameIcon, games as catalogue } from '../../data/games'
import { applyGameSetting } from '../../hooks/useGames'
import { ErrorNotice } from './ui'
import './admin-games.css'

const STATUS_ICONS = { available: CheckCircle2, coming_soon: Clock3, unavailable: LockKeyhole }

export default function AdminGames() {
  const { t } = useTranslation()
  const [games, setGames] = useState<GameSetting[] | null>(null)
  const [error, setError] = useState<AdminErrorCode | null>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let cancelled = false
    void fetchGameSettings().then(result => {
      if (cancelled) return
      if (result.ok) { setGames(result.data.games); setError(null) }
      else setError(result.error)
    })
    return () => { cancelled = true }
  }, [attempt])
  if (error) return <ErrorNotice onRetry={() => setAttempt(n => n + 1)}>{errorText(t, error)}</ErrorNotice>
  if (!games) return <div className="admin-games-loading" role="status"><LoaderCircle size={20} aria-hidden="true" />{t('admin.loading')}</div>
  return <section className="admin-games" aria-labelledby="admin-games-title">
    <header className="admin-games-heading">
      <div><p className="admin-games-eyebrow">{t('admin.games.eyebrow')}</p><h3 id="admin-games-title">{t('admin.games.title')}</h3></div>
      <span className="admin-games-total"><Gamepad2 size={15} aria-hidden="true" />{t('admin.games.total', { count: games.length })}</span>
      <p className="admin-games-intro">{t('admin.games.help')}</p>
    </header>
    <dl className="admin-games-summary" aria-label={t('admin.games.availability')}>
      {AVAILABILITIES.map(status => {
        const Icon = STATUS_ICONS[status]
        return <div key={status} data-availability={status}>
          <dt><Icon size={14} aria-hidden="true" />{t(`admin.games.${status}`)}</dt>
          <dd>{games.filter(game => game.availability === status).length}</dd>
        </div>
      })}
    </dl>
    <div className="admin-games-grid">
      {games.map(game => <GameRow key={game.game} game={game} onSaved={setting => setGames(current => current?.map(item => item.game === setting.game ? setting : item) ?? null)} />)}
    </div>
  </section>
}

function GameRow({ game, onSaved }: { game: GameSetting; onSaved: (setting: GameSetting) => void }) {
  const { t } = useTranslation()
  const [saved, setSaved] = useState(game)
  const [availability, setAvailability] = useState(game.availability)
  const [beta, setBeta] = useState(game.beta)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<AdminErrorCode | null>(null)
  const [done, setDone] = useState(false)
  const dirty = availability !== saved.availability || beta !== saved.beta
  const art = catalogue.find(item => new URL(item.liveUrl).pathname.split('/')[1] === game.game)
  const icon = art && gameIcon(art)
  const StatusIcon = STATUS_ICONS[saved.availability]
  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy || !dirty) return
    setBusy(true); setError(null); setDone(false)
    const setting = { ...game, availability, beta }
    const result = await saveGameSetting(setting)
    setBusy(false)
    if (result.ok) { setSaved(setting); applyGameSetting(setting); onSaved(setting); setDone(true) }
    else setError(result.error)
  }
  const reset = () => {
    setAvailability(saved.availability); setBeta(saved.beta); setError(null); setDone(false)
  }
  return <form onSubmit={event => void save(event)} aria-label={game.title} aria-busy={busy} className="admin-game" data-dirty={dirty}>
    <header className="admin-game-header">
      <div className="admin-game-identity">
        {icon ? <img src={icon} alt="" width={44} height={44} className="admin-game-icon" /> : <span className="admin-game-icon admin-game-icon--fallback"><Gamepad2 size={22} aria-hidden="true" /></span>}
        <div><h4>{game.title}</h4><p>/{game.game}/</p></div>
      </div>
      <span className="admin-game-badge" data-availability={saved.availability}><StatusIcon size={12} aria-hidden="true" />{t(`admin.games.${saved.availability}`)}</span>
    </header>
    <fieldset className="admin-game-availability" disabled={busy}>
      <legend>{t('admin.games.availability')}</legend>
      <div className="admin-game-options">
        {AVAILABILITIES.map(value => {
          const Icon = STATUS_ICONS[value]
          return <label key={value} data-availability={value}>
            <input type="radio" name={`availability-${game.game}`} value={value} checked={availability === value} onChange={() => { setAvailability(value as Availability); setDone(false) }} />
            <span><Icon size={16} aria-hidden="true" /><span>{t(`admin.games.${value}`)}</span></span>
          </label>
        })}
      </div>
    </fieldset>
    <p className="admin-game-hint">{t(`admin.games.hint.${availability}`)}</p>
    <label className="admin-game-beta">
      <span className="admin-game-beta-copy"><span>{t('betaLabel')}</span><span id={`beta-help-${game.game}`}>{t('admin.games.betaHelp')}</span></span>
      <span className="admin-game-switch">
        <input type="checkbox" role="switch" aria-label={t('betaLabel')} aria-describedby={`beta-help-${game.game}`} checked={beta} disabled={busy} onChange={event => { setBeta(event.target.checked); setDone(false) }} />
        <span aria-hidden="true"><span>{beta && <Check size={11} strokeWidth={3} />}</span></span>
      </span>
    </label>
    {error && <ErrorNotice>{errorText(t, error)}</ErrorNotice>}
    <footer className="admin-game-footer">
      <span role="status" className="admin-game-feedback" data-state={dirty ? 'dirty' : done ? 'saved' : 'idle'}>
        {done && !dirty ? <><Check size={13} aria-hidden="true" />{t('admin.games.saved')}</> : dirty ? <><span className="admin-game-unsaved-dot" />{t('admin.games.unsaved')}</> : t('admin.games.upToDate')}
      </span>
      <div className="admin-game-actions">
        {dirty && <button type="button" className="admin-game-reset" onClick={reset} disabled={busy} aria-label={t('admin.games.reset')} title={t('admin.games.reset')}><RotateCcw size={15} aria-hidden="true" /></button>}
        <button type="submit" className="admin-game-save" disabled={busy || !dirty}>
          {busy ? <LoaderCircle size={14} className="admin-game-spinner" aria-hidden="true" /> : <Save size={14} aria-hidden="true" />}
          {t(busy ? 'admin.games.saving' : 'admin.games.save')}
        </button>
      </div>
    </footer>
  </form>
}
