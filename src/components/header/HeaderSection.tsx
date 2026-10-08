import logo from '../../assets/logo.svg'
import SettingsMenu from './SettingsMenu'
import AccountMenu from '../account/AccountMenu'
import SpotlightSearch from './SpotlightSearch'
import type { Game } from '../../data/games'

export default function HeaderSection({ username, onSelectGame }: { username: string | null; onSelectGame: (game: Game) => void }) {
  return <header className="site-header">
    <div className="arena-container header-row">
      <a className="brand" href="#" aria-label="SpillArena"><img src={logo} alt="" width={40} height={40} /><span>SpillArena<span className="brand-dot">.</span></span></a>
      <div className="header-search" role="search"><SpotlightSearch onSelect={onSelectGame} /></div>
      <div className="header-actions"><AccountMenu username={username} /><SettingsMenu /></div>
    </div>
  </header>
}
