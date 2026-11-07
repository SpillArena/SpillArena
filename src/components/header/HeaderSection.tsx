import logo from '../../assets/logo.svg'
import SettingsMenu from './SettingsMenu'
import AccountMenu from '../account/AccountMenu'
import SpotlightSearch from './SpotlightSearch'
import type { Game } from '../../data/games'
import { Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useParty } from '../../party/context'

export default function HeaderSection({ username, onSelectGame }: { username: string | null; onSelectGame: (game: Game) => void }) {
  const { t } = useTranslation()
  const { view } = useParty()
  return <header className="site-header">
    <div className="arena-container header-row">
      <a className="brand" href="/" aria-label="SpillArena"><img src={logo} alt="" width={40} height={40} /><span>SpillArena<span className="brand-dot">.</span></span></a>
      <div className="header-search" role="search"><SpotlightSearch onSelect={onSelectGame} /></div>
      <div className="header-actions"><a className="account-button party-link" href="/#party" aria-label={view ? `${t('party.title')}: ${view.code}` : t('party.title')}><Users size={18} aria-hidden="true" /><span>{view ? view.code : t('party.title')}</span></a><AccountMenu username={username} /><SettingsMenu /></div>
    </div>
  </header>
}
