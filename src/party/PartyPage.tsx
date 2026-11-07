import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy, Crown, Gamepad2, Link2Off, Lock, LogOut, PartyPopper, Repeat, Rocket, Shuffle, Sparkles, UserMinus, Users, type LucideIcon } from 'lucide-react'
import { useAccount } from '../account'
import { useGames } from '../hooks/useGames'
import { partyLimits } from '../../shared/games-registry.js'
import { gameIcon } from '../data/games'
import { useParty } from './context'
import { gameSlug } from './slug'

const WHY_ICONS: LucideIcon[] = [Link2Off, Crown, Repeat, Lock]
const STEP_ICONS: LucideIcon[] = [Users, Crown, Repeat]
const STARTER_COUNT = 8

type Item = { title: string; text: string }

/** The party screen: create or join with a code, then the leader picks what everyone plays. */
export default function PartyPage() {
  const { t } = useTranslation()
  const { isSignedIn, username } = useAccount()
  const games = useGames()
  const { view, status, error, isLeader, create, join, leave, selectGame, kick, transfer, clearError } = useParty()
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [starter, setStarter] = useState(() => Math.floor(Math.random() * STARTER_COUNT))

  const copy = () => {
    void navigator.clipboard?.writeText(view?.code ?? '').then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1800) }, () => undefined)
  }
  const errorText = error ? t(`party.errors.${error}`, { defaultValue: t('party.errors.error') }) : null
  // Only games with a multiplayer room, and each one fits the party as it stands or says why not.
  const online = view ? view.members.filter(member => member.online).length : 0
  const seats = view ? view.members.length : 0
  const playable = games.filter(game => !game.disabled && game.liveUrl && partyLimits(gameSlug(game)))
  const fit = (game: (typeof games)[number]) => {
    const limits = partyLimits(gameSlug(game))!
    if (!view) return null
    if (online < limits.min) return t('party.needMore', { min: limits.min })
    if (seats > limits.max) return t('party.needFewer', { max: limits.max })
    return null
  }
  const range = (game: (typeof games)[number]) => {
    const { min, max } = partyLimits(gameSlug(game))!
    return min === max ? t('party.playersExact', { count: min }) : t('party.playersRange', { min, max })
  }
  const steps = t('party.steps', { returnObjects: true }) as Item[]
  const why = t('party.why', { returnObjects: true }) as Item[]
  const starters = t('party.starters', { returnObjects: true }) as string[]
  const nextStarter = () => setStarter(current => (current + 1 + Math.floor(Math.random() * (starters.length - 1))) % starters.length)

  const hero = <header className="party-hero">
    <p className="eyebrow party-eyebrow"><PartyPopper size={14} aria-hidden="true" />{t('party.eyebrow')}</p>
    <h1 id="party-title">{t('party.heroTitle')}<span className="party-beta">{t('betaLabel')}</span></h1>
    <p className="party-lead">{t('party.lead')}</p>
  </header>

  const gamesGrid = (interactive: boolean) => <ul className="party-games">
    {playable.map(game => {
      const blocked = fit(game)
      const body = <>
        <img src={gameIcon(game)} alt="" width={40} height={40} />
        <span className="party-game-text"><span>{game.title}{game.beta && <small>{t('party.beta')}</small>}</span><small className="party-game-meta">{blocked ?? range(game)}</small></span>
      </>
      return <li key={game.id}>
        {interactive
          ? <button className="party-game" type="button" disabled={Boolean(blocked)} onClick={() => selectGame(gameSlug(game))}>{body}</button>
          : <div className="party-game is-static">{body}</div>}
      </li>
    })}
  </ul>

  const starterCard = <aside className="party-starter" aria-live="polite">
    <div className="party-starter-head">
      <span className="party-starter-title"><Sparkles size={16} aria-hidden="true" />{t('party.starterTitle')}</span>
      <button className="text-button" type="button" onClick={nextStarter}><Shuffle size={14} aria-hidden="true" />{t('party.starterShuffle')}</button>
    </div>
    <p key={starter} className="party-starter-text">{starters[starter % starters.length]}</p>
  </aside>

  if (!isSignedIn) return <section className="party-page" aria-labelledby="party-title">
    {hero}
    <div className="party-card party-signin">
      <h2>{t('party.signInFirst')}</h2>
      <p>{t('party.signInHint')}</p>
      <a className="button primary" href="#login">{t('account.signIn')}</a>
    </div>
    <h2>{t('party.stepsTitle')}</h2>
    <ol className="party-steps">{steps.map((step, i) => { const Icon = STEP_ICONS[i]; return <li key={step.title}><span className="party-step-num">{i + 1}</span><Icon size={20} aria-hidden="true" /><strong>{step.title}</strong><p>{step.text}</p></li> })}</ol>
    <h2>{t('party.whyTitle')}</h2>
    <ul className="party-why">{why.map((item, i) => { const Icon = WHY_ICONS[i]; return <li key={item.title}><Icon size={20} aria-hidden="true" /><strong>{item.title}</strong><p>{item.text}</p></li> })}</ul>
  </section>

  if (!view) {
    const busy = status === 'connecting' || status === 'reconnecting'
    return <section className="party-page" aria-labelledby="party-title">
      {hero}
      {errorText && <p className="party-error" role="alert">{errorText}</p>}
      <div className="party-start">
        <div className="party-card party-card-create">
          <span className="party-card-icon"><Rocket size={22} aria-hidden="true" /></span>
          <h2>{t('party.createTitle')}</h2>
          <p>{t('party.createText')}</p>
          <button className="button primary" type="button" disabled={busy} onClick={create}>{t('party.create')}</button>
        </div>
        <form className="party-card" onSubmit={event => { event.preventDefault(); join(code) }}>
          <span className="party-card-icon"><Gamepad2 size={22} aria-hidden="true" /></span>
          <h2>{t('party.joinTitle')}</h2>
          <p>{t('party.joinText')}</p>
          <label htmlFor="party-code">{t('party.codeLabel')}</label>
          <input id="party-code" className="party-code-input" value={code} maxLength={4} autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="ABCD"
            onChange={event => { setCode(event.target.value.toUpperCase().replace(/[^A-Z]/g, '')); if (error) clearError() }} />
          <button className="button secondary" type="submit" disabled={busy || code.length !== 4}>{t('party.join')}</button>
        </form>
      </div>
      <h2>{t('party.stepsTitle')}</h2>
      <ol className="party-steps">{steps.map((step, i) => { const Icon = STEP_ICONS[i]; return <li key={step.title}><span className="party-step-num">{i + 1}</span><Icon size={20} aria-hidden="true" /><strong>{step.title}</strong><p>{step.text}</p></li> })}</ol>
      <h2>{t('party.gamesTitle')}</h2>
      <p className="party-muted-line">{t('party.gamesText')}</p>
      {gamesGrid(false)}
      <p className="party-muted-line">{t('party.soloNote')}</p>
      <h2>{t('party.whyTitle')}</h2>
      <ul className="party-why">{why.map((item, i) => { const Icon = WHY_ICONS[i]; return <li key={item.title}><Icon size={20} aria-hidden="true" /><strong>{item.title}</strong><p>{item.text}</p></li> })}</ul>
      {starterCard}
    </section>
  }

  const me = username?.toLowerCase()
  return <section className="party-page" aria-labelledby="party-title">
    <h1 id="party-title" className="party-title-small">{t('party.title')}<span className="party-beta">{t('betaLabel')}</span></h1>
    {status === 'reconnecting' && <p className="party-error" role="status">{t('party.reconnecting')}</p>}
    {errorText && <p className="party-error" role="alert">{errorText}</p>}
    <div className="party-ticket">
      <div className="party-ticket-main">
        <span className="eyebrow">{t('party.inviteTitle')}</span>
        <p className="party-code" aria-label={view.code.split('').join(' ')}>{view.code}</p>
        <p className="party-ticket-text">{t('party.inviteText')} {t('party.autoRoom')}</p>
      </div>
      <div className="party-ticket-actions">
        <button className="button primary" type="button" onClick={copy}>{copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}{copied ? t('party.copied') : t('party.copy')}</button>
        <button className="button secondary" type="button" onClick={leave}><LogOut size={16} aria-hidden="true" />{t('party.leave')}</button>
      </div>
    </div>

    <h2>{t('party.members', { count: view.members.length })}</h2>
    <ul className="party-members">
      {view.members.map(member => {
        const leader = member.name.toLowerCase() === view.leader.toLowerCase()
        return <li key={member.name} className={member.online ? undefined : 'is-offline'}>
          <span className={`party-avatar${leader ? ' is-leader' : ''}`} aria-hidden="true">{member.name.slice(0, 1).toUpperCase()}</span>
          <span className="party-member-name">{member.name}{member.name.toLowerCase() === me && <span className="party-muted">({t('party.you')})</span>}{leader && <Crown size={14} aria-label={t('party.leader')} />}</span>
          {!member.online && <span className="party-muted">{t('party.offline')}</span>}
          {isLeader && !leader && <span className="party-member-actions">
            <button className="text-button" type="button" onClick={() => transfer(member.name)}><Crown size={14} aria-hidden="true" />{t('party.makeLeader')}</button>
            <button className="text-button" type="button" onClick={() => kick(member.name)}><UserMinus size={14} aria-hidden="true" />{t('party.kick')}</button>
          </span>}
        </li>
      })}
    </ul>

    <h2>{isLeader ? t('party.pickGame') : t('party.waitingForLeader', { name: view.leader })}</h2>
    <p className="party-muted-line">{isLeader ? t('party.pickGameText') : t('party.waitingText')}</p>
    {isLeader && <p className="party-muted-line">{t('party.countHint', { count: online })}</p>}
    {isLeader ? gamesGrid(true) : <>{starterCard}<h2>{t('party.gamesTitle')}</h2>{gamesGrid(false)}</>}
  </section>
}
