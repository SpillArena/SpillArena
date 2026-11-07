import { useGames } from './hooks/useGames'
import { useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { gameBanner, type Game } from './data/games'
import { adsRequested, getSession, useAccount } from './account'
import { isAdFreePage } from './lib/adFreePages'
import HeaderSection from './components/header/HeaderSection'
import HeroSection from './components/main/HeroSection'
import GamesSection from './components/main/GamesSection'
import BetaWarningModal from './components/main/BetaWarningModal'
import InstallPrompt from './components/main/InstallPrompt'
import FooterSection from './components/footer/FooterSection'
import AuthModal from './components/account/AuthModal'
import ProfilePage from './components/account/ProfilePage'
import { EditorialArticle, HomeIntroduction, guideSlug, pageMetadata, type InfoPage } from './content/pages'
import { currentPage, legacyInfoPath, type Page } from './lib/pages'
import ContactForm from './components/main/ContactForm'
import Dialog from './ui/Dialog'
import { goToGame } from './ui/loader'
import { useGlobalLoader } from './ui/useGlobalLoader'
import PartyPage from './party/PartyPage'
import { useParty } from './party/context'
import { gameSlug } from './party/slug'

export default function App() {
  const { t, i18n } = useTranslation()
  const games = useGames()
  const party = useParty()
  const { username, isSignedIn, signOut } = useAccount()
  const [page, setPage] = useState<Page>(currentPage)
  const [betaGame, setBetaGame] = useState<Game | null>(null)
  const [pickedGame, setPickedGame] = useState<Game | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [accountDeleted, setAccountDeleted] = useState(false)
  useGlobalLoader(signingOut, t('account.signingOut'))

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    try {
      const pending = signOut()
      window.location.hash = ''
      setPage('home')
      await pending
    } finally {
      setSigningOut(false)
    }
  }

  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.has('recover')) {
      url.searchParams.delete('recover')
      url.hash = 'recover'
      window.history.replaceState(window.history.state, '', url)
    }
    const onHashChange = () => {
      // reklameskriptet kan ikke fjernes fra en side, bare lastes uten, se src/lib/adFreePages.ts
      const legacyPath = legacyInfoPath()
      if (legacyPath) { window.location.assign(legacyPath); return }
      if (adsRequested() && isAdFreePage()) {
        window.location.reload()
        return
      }
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
    const slug = guideSlug(window.location.pathname)
    const accountPage = ['login', 'register', 'recover', 'profile', 'party'].includes(page)
    const metadata = pageMetadata(i18n.resolvedLanguage === 'en' ? 'en' : 'no',
      ['home', 'guide'].includes(page) || accountPage ? undefined : page as InfoPage, page === 'guide' ? slug : undefined)
    document.title = accountPage
      ? t(page === 'party' ? 'party.title' : page === 'profile' ? 'account.yourProfile' : page === 'register' ? 'account.register' : page === 'recover' ? 'account.recovery.title' : 'account.signIn') + ' · SpillArena'
      : page === 'home' ? metadata.title : metadata.title + ' · SpillArena'
    document.querySelector('meta[name="description"]')?.setAttribute('content', metadata.description)
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', `https://spillarena.no${metadata.path}`)
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title)
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', metadata.description)
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', `https://spillarena.no${metadata.path}`)
    document.querySelector('meta[name="robots"]')?.setAttribute('content', accountPage ? 'noindex, follow' : 'index, follow')
  }, [page, i18n.resolvedLanguage, t])

  /** In a party the leader's pick goes to everyone, and nobody else opens a game on their own. */
  const launch = (game: Game) => {
    if (!party.view) goToGame(game, t('lobby.loadingGame', { title: game.title }))
    else if (party.isLeader) party.selectGame(gameSlug(game))
    else window.location.hash = 'party'
  }
  const handleGameClick = (game: Game) => {
    game = games.find(item => item.id === game.id) ?? game
    if (game.disabled || !game.liveUrl) return
    if (party.view && !party.isLeader) { window.location.hash = 'party'; return }
    if (game.beta) setBetaGame(game)
    else launch(game)
  }
  const pickGame = () => {
    const pool = games.filter(game => !game.disabled && game.liveUrl && game !== pickedGame)
    if (pool.length) setPickedGame(pool[Math.floor(Math.random() * pool.length)])
  }

  const slug = guideSlug(window.location.pathname)
  const guideGame = slug ? games.find(game => new URL(game.liveUrl).pathname.split('/')[1] === slug) : undefined

  return <div className="lobby-app">
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); document.getElementById('main-content')?.scrollIntoView() }}>{t('profile.skipContent')}</a>
    <HeaderSection username={username} onSelectGame={handleGameClick} />
    <main className="arena-container lobby-content" id="main-content" tabIndex={-1}>
      {accountDeleted && <p className="account-deleted-notice" role="status">{t('account.deletion.success')}</p>}
      {page === 'home' ? <>
        <HeroSection onSurprise={pickGame} onPlay={handleGameClick} />
        <GamesSection onClick={handleGameClick} />
        <HomeIntroduction language={i18n.resolvedLanguage === 'en' ? 'en' : 'no'} />
        <aside className="account-strip" aria-labelledby="account-strip-title"><div className="account-symbol" aria-hidden="true"><ArrowUpRight size={28} /></div><div><h2 id="account-strip-title">{t('lobby.accountTitle')}</h2><p>{t('lobby.accountDescription')}</p></div><a className="button secondary" href={isSignedIn ? '#profile' : '#login'}>{t(isSignedIn ? 'account.yourProfile' : 'lobby.accountMore')}<ArrowUpRight size={16} aria-hidden="true" /></a></aside>
      </> : page === 'contact' ? <ContactForm /> : page === 'privacy' || page === 'terms' || page === 'faq' || page === 'about' || page === 'guides' || page === 'guide' ? <EditorialArticle page={page === 'guide' ? undefined : page} slug={slug} action={guideGame && (guideGame.disabled ? <p role="status">{t('content.unavailable')}</p> : <button className="button primary" type="button" onClick={() => handleGameClick(guideGame)}>{t('content.play')}<ArrowUpRight size={16} aria-hidden="true" /></button>)} language={i18n.resolvedLanguage === 'en' ? 'en' : 'no'} /> : page === 'party' ? <PartyPage /> : page === 'profile' ? <ProfilePage username={username} onSignOut={() => void handleSignOut()} onPlay={handleGameClick} onDeleted={() => { setAccountDeleted(true); window.location.hash = ''; setPage('home') }} /> :
        <AuthModal key={page} open presentation="page" initialMode={page} onClose={() => { window.location.hash = getSession() ? 'profile' : '' }} />}
    </main>
    <FooterSection />
    <InstallPrompt />
    <BetaWarningModal game={betaGame} onClose={() => setBetaGame(null)} onConfirm={() => { if (betaGame && !games.find(item => item.id === betaGame.id)?.disabled) launch(betaGame) }} />
    <Dialog open={pickedGame !== null} onClose={() => setPickedGame(null)} title={pickedGame?.title ?? ''} eyebrow={t('lobby.pickedLabel')}>
      {pickedGame && <><img className="picked-art" src={gameBanner(pickedGame, i18n.resolvedLanguage)} alt="" /><p>{t(`lobby.descriptions.${pickedGame.id}`)}</p>{pickedGame.beta && <p className="dialog-note">{t('betaWarningMessage', { title: pickedGame.title })}</p>}
        <div className="dialog-actions"><button className="button secondary" type="button" onClick={pickGame}>{t('lobby.pickAgain')}</button><a className="button primary" href={games.find(item => item.id === pickedGame.id)?.disabled ? undefined : pickedGame.liveUrl} onClick={party.view ? event => { event.preventDefault(); setPickedGame(null); handleGameClick(pickedGame) } : undefined}>{t('lobby.play')}<ArrowUpRight size={16} aria-hidden="true" /></a></div></>}
    </Dialog>
  </div>
}
