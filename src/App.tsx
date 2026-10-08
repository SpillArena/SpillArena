import { useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { games, type Game } from './data/games'
import { getSession, useAccount } from './account'
import HeaderSection from './components/header/HeaderSection'
import HeroSection from './components/main/HeroSection'
import GamesSection from './components/main/GamesSection'
import BetaWarningModal from './components/main/BetaWarningModal'
import FooterSection from './components/footer/FooterSection'
import AuthModal from './components/account/AuthModal'
import ProfilePage from './components/account/ProfilePage'
import Dialog from './ui/Dialog'
import { goToGame } from './ui/loader'

type Page = 'home' | 'login' | 'register' | 'recover' | 'profile'
function currentPage(): Page {
  if (new URL(window.location.href).searchParams.has('recover')) return 'recover'
  const hash = window.location.hash.slice(1)
  return ['login', 'register', 'recover', 'profile'].includes(hash) ? hash as Page : 'home'
}

export default function App() {
  const { t, i18n } = useTranslation()
  const { username, isSignedIn, signOut } = useAccount()
  const [page, setPage] = useState<Page>(currentPage)
  const [betaGame, setBetaGame] = useState<Game | null>(null)
  const [pickedGame, setPickedGame] = useState<Game | null>(null)

  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.has('recover')) {
      url.searchParams.delete('recover')
      url.hash = 'recover'
      window.history.replaceState(window.history.state, '', url)
    }
    const onHashChange = () => {
      setPage(currentPage())
      requestAnimationFrame(() => {
        if (window.location.hash === '#games') document.getElementById('games')?.scrollIntoView()
        else { window.scrollTo(0, 0); document.getElementById('main-content')?.focus({ preventScroll: true }) }
      })
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage === 'no' ? 'nb' : 'en'
    document.title = page === 'home' ? 'SpillArena · ' + t('headerTitle') : t(page === 'profile' ? 'account.yourProfile' : page === 'register' ? 'account.register' : page === 'recover' ? 'account.recovery.title' : 'account.signIn') + ' · SpillArena'
  }, [page, i18n.resolvedLanguage, t])

  const handleGameClick = (game: Game) => {
    if (game.disabled || !game.liveUrl) return
    if (game.beta) setBetaGame(game)
    else goToGame(game, t('lobby.loadingGame', { title: game.title }))
  }
  const pickGame = () => {
    const pool = games.filter(game => !game.disabled && game.liveUrl && game !== pickedGame)
    if (pool.length) setPickedGame(pool[Math.floor(Math.random() * pool.length)])
  }

  return <div className="lobby-app">
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); document.getElementById('main-content')?.scrollIntoView() }}>{t('profile.skipContent')}</a>
    <HeaderSection username={username} onSelectGame={handleGameClick} />
    <main className="arena-container lobby-content" id="main-content" tabIndex={-1}>
      {page === 'home' ? <>
        <HeroSection onSurprise={pickGame} />
        <GamesSection onClick={handleGameClick} />
        <aside className="account-strip" aria-labelledby="account-strip-title"><div className="account-symbol" aria-hidden="true"><ArrowUpRight size={28} /></div><div><h2 id="account-strip-title">{t('lobby.accountTitle')}</h2><p>{t('lobby.accountDescription')}</p></div><a className="button secondary" href={isSignedIn ? '#profile' : '#login'}>{t(isSignedIn ? 'account.yourProfile' : 'lobby.accountMore')}<ArrowUpRight size={16} aria-hidden="true" /></a></aside>
      </> : page === 'profile' ? <ProfilePage username={username} onSignOut={() => { signOut(); window.location.hash = '' }} onPlay={handleGameClick} /> :
        <AuthModal key={page} open presentation="page" initialMode={page} onClose={() => { window.location.hash = getSession() ? 'profile' : '' }} />}
    </main>
    <FooterSection />
    <BetaWarningModal game={betaGame} onClose={() => setBetaGame(null)} onConfirm={() => { if (betaGame) goToGame(betaGame, t('lobby.loadingGame', { title: betaGame.title })) }} />
    <Dialog open={pickedGame !== null} onClose={() => setPickedGame(null)} title={pickedGame?.title ?? ''} eyebrow={t('lobby.pickedLabel')}>
      {pickedGame && <><img className="picked-art" src={pickedGame.showcase} alt="" /><p>{t(`lobby.descriptions.${pickedGame.id}`)}</p>{pickedGame.beta && <p className="dialog-note">{t('betaWarningMessage', { title: pickedGame.title })}</p>}
        <div className="dialog-actions"><button className="button secondary" type="button" onClick={pickGame}>{t('lobby.pickAgain')}</button><a className="button primary" href={pickedGame.liveUrl}>{t('lobby.play')}<ArrowUpRight size={16} aria-hidden="true" /></a></div></>}
    </Dialog>
  </div>
}
