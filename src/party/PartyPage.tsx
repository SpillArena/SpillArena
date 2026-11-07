import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy, Crown, LogOut, UserMinus } from 'lucide-react'
import { useAccount } from '../account'
import { useGames } from '../hooks/useGames'
import { gameIcon } from '../data/games'
import { useParty } from './context'
import { gameSlug } from './slug'

/** The party screen: create or join with a code, then the leader picks what everyone plays. */
export default function PartyPage() {
  const { t } = useTranslation()
  const { isSignedIn } = useAccount()
  const games = useGames()
  const { view, status, error, isLeader, create, join, leave, selectGame, kick, transfer, clearError } = useParty()
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)

  const copy = () => {
    void navigator.clipboard?.writeText(view?.code ?? '').then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1800) }, () => undefined)
  }
  const errorText = error ? t(`party.errors.${error}`, { defaultValue: t('party.errors.error') }) : null

  if (!isSignedIn) return <section className="party-page" aria-labelledby="party-title">
    <h1 id="party-title">{t('party.title')}</h1>
    <p className="party-lead">{t('party.signInFirst')}</p>
    <a className="button primary" href="#login">{t('account.signIn')}</a>
  </section>

  if (!view) {
    const busy = status === 'connecting' || status === 'reconnecting'
    return <section className="party-page" aria-labelledby="party-title">
      <h1 id="party-title">{t('party.title')}</h1>
      <p className="party-lead">{t('party.lead')}</p>
      {errorText && <p className="party-error" role="alert">{errorText}</p>}
      <div className="party-start">
        <div className="party-card">
          <h2>{t('party.createTitle')}</h2>
          <p>{t('party.createText')}</p>
          <button className="button primary" type="button" disabled={busy} onClick={create}>{t('party.create')}</button>
        </div>
        <form className="party-card" onSubmit={event => { event.preventDefault(); join(code) }}>
          <h2>{t('party.joinTitle')}</h2>
          <label htmlFor="party-code">{t('party.codeLabel')}</label>
          <input id="party-code" className="party-code-input" value={code} maxLength={4} autoComplete="off" autoCapitalize="characters" spellCheck={false}
            onChange={event => { setCode(event.target.value.toUpperCase().replace(/[^A-Z]/g, '')); if (error) clearError() }} />
          <button className="button secondary" type="submit" disabled={busy || code.length !== 4}>{t('party.join')}</button>
        </form>
      </div>
    </section>
  }

  return <section className="party-page" aria-labelledby="party-title">
    <h1 id="party-title">{t('party.title')}</h1>
    {status === 'reconnecting' && <p className="party-error" role="status">{t('party.reconnecting')}</p>}
    {errorText && <p className="party-error" role="alert">{errorText}</p>}
    <div className="party-header">
      <div>
        <span className="eyebrow">{t('party.codeLabel')}</span>
        <p className="party-code" aria-label={view.code.split('').join(' ')}>{view.code}</p>
      </div>
      <button className="button secondary" type="button" onClick={copy}>{copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}{copied ? t('party.copied') : t('party.copy')}</button>
      <button className="button secondary" type="button" onClick={leave}><LogOut size={16} aria-hidden="true" />{t('party.leave')}</button>
    </div>

    <h2>{t('party.members', { count: view.members.length })}</h2>
    <ul className="party-members">
      {view.members.map(member => {
        const leader = member.name.toLowerCase() === view.leader.toLowerCase()
        return <li key={member.name} className={member.online ? undefined : 'is-offline'}>
          <span className="party-member-name">{member.name}{leader && <Crown size={14} aria-label={t('party.leader')} />}</span>
          {!member.online && <span className="party-muted">{t('party.offline')}</span>}
          {isLeader && !leader && <span className="party-member-actions">
            <button className="text-button" type="button" onClick={() => transfer(member.name)}><Crown size={14} aria-hidden="true" />{t('party.makeLeader')}</button>
            <button className="text-button" type="button" onClick={() => kick(member.name)}><UserMinus size={14} aria-hidden="true" />{t('party.kick')}</button>
          </span>}
        </li>
      })}
    </ul>

    <h2>{isLeader ? t('party.pickGame') : t('party.waitingForLeader', { name: view.leader })}</h2>
    {isLeader && <ul className="party-games">
      {games.filter(game => !game.disabled && game.liveUrl).map(game => <li key={game.id}>
        <button className="party-game" type="button" onClick={() => selectGame(gameSlug(game))}>
          <img src={gameIcon(game)} alt="" width={40} height={40} />
          <span>{game.title}{game.beta && <small>{t('party.beta')}</small>}</span>
        </button>
      </li>)}
    </ul>}
  </section>
}
