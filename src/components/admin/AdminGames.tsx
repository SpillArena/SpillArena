import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AVAILABILITIES, type Availability, type GameSetting } from '../../../shared/game-settings.js'
import { fetchGameSettings, saveGameSetting } from '../../admin/api'
import { errorText } from '../../admin/format'
import type { AdminErrorCode } from '../../admin/types'
import { applyGameSetting } from '../../hooks/useGames'
import { Button, Card, ErrorNotice, Muted } from './ui'

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
  if (!games) return <Muted>{t('admin.loading')}</Muted>
  return <div className="flex flex-col gap-4">
    <div><h3 className="text-lg font-semibold">{t('admin.games.title')}</h3><Muted>{t('admin.games.help')}</Muted></div>
    {games.map(game => <GameRow key={game.game} game={game} />)}
  </div>
}

function GameRow({ game }: { game: GameSetting }) {
  const { t } = useTranslation()
  const [saved, setSaved] = useState(game)
  const [availability, setAvailability] = useState(game.availability)
  const [beta, setBeta] = useState(game.beta)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<AdminErrorCode | null>(null)
  const [done, setDone] = useState(false)
  const dirty = availability !== saved.availability || beta !== saved.beta
  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy || !dirty) return
    setBusy(true); setError(null); setDone(false)
    const setting = { ...game, availability, beta }
    const result = await saveGameSetting(setting)
    setBusy(false)
    if (result.ok) { setSaved(setting); applyGameSetting(setting); setDone(true) }
    else setError(result.error)
  }
  return <Card>
    <form onSubmit={event => void save(event)} aria-label={game.title} aria-busy={busy} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><h4 className="font-semibold">{game.title}</h4><span className="text-xs" style={{ color: 'var(--text-subtle)' }}>/{game.game}/</span></div>
      <div className="grid grid-cols-[1fr_auto] items-end gap-3 sm:flex sm:flex-wrap sm:gap-4">
        <label className="col-span-2 flex min-w-0 flex-1 flex-col gap-1 text-sm">{t('admin.games.availability')}
          <select className="w-full rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)', background: 'var(--surface-card)' }} value={availability} disabled={busy} onChange={event => { setAvailability(event.target.value as Availability); setDone(false) }}>
            {AVAILABILITIES.map(value => <option key={value} value={value}>{t(`admin.games.${value}`)}</option>)}
          </select>
        </label>
        <label className="flex cursor-pointer items-center gap-2 py-2 text-sm"><input type="checkbox" checked={beta} disabled={busy} onChange={event => { setBeta(event.target.checked); setDone(false) }} />{t('betaLabel')}</label>
        <Button type="submit" disabled={busy || !dirty} variant="primary" className="min-h-10">{t(busy ? 'admin.games.saving' : 'admin.games.save')}</Button>
      </div>
      <Muted>{t(`admin.games.hint.${availability}`)}</Muted>
      {error && <ErrorNotice>{errorText(t, error)}</ErrorNotice>}
      <span role="status" className="text-sm">{done && !dirty ? t('admin.games.saved') : ''}</span>
    </form>
  </Card>
}
