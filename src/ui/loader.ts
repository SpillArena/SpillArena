import { games, type Game } from '../data/games'

/*
 * SpillArena-lasteren: brikkene i logoen som lander én etter én langs S-en.
 *
 * Markupen og stilen ligger i index.html, ikke her. Den skal vises FØR
 * JavaScript-pakken er lastet, og det er bare index.html som er der da. Denne
 * filen skrur den samme lasteren av når appen er klar, og på igjen når
 * spilleren går fra forsiden inn i et spill. Da står den på til nettleseren
 * har byttet side, og spilleren ser noe annet enn en hvit skjerm mens spillet
 * laster.
 */

const element = () => document.getElementById('arena-loader')

export function hideLoader(): void {
  element()?.classList.add('is-hidden')
}

export function showLoader(label: string): void {
  const loader = element()
  if (!loader) return
  const text = loader.querySelector('.arena-loader-label')
  if (text) text.textContent = label
  // fra nå av er siden bak: gjør den uskarp i stedet for å dekke den
  loader.classList.remove('is-boot', 'is-hidden')
}

/** Går til spillet, med lasteren oppe mens det henter seg inn. */
export function goToGame(game: Game, label: string): void {
  showLoader(label)
  window.location.assign(game.liveUrl)
}

/** Full adresse uten skråstrek til slutt, så /melodyrush og /melodyrush/ er samme spill. */
const normalizeUrl = (url: string) => new URL(url, window.location.href).href.replace(/\/+$/, '')

/**
 * Viser lasteren for VANLIGE lenker til et spill også — utvalgt spill, «Spill
 * nå» i en dialog — uten at hver av dem må huske det.
 *
 * Bare et klikk som blir i fanen: med Ctrl, ⌘, Shift eller midtknapp åpnes
 * spillet et annet sted, og denne siden skal ikke dekkes til. Et klikk en
 * komponent allerede har tatt hånd om (`preventDefault`) går gjennom
 * `goToGame` selv, eller skal ikke navigere i det hele tatt.
 */
export function installGameLinkLoader(labelFor: (game: Game) => string): () => void {
  const byUrl = new Map(games.filter(game => game.liveUrl).map(game => [normalizeUrl(game.liveUrl), game]))

  const onClick = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
    if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return
    const game = byUrl.get(normalizeUrl(link.href))
    if (game) showLoader(labelFor(game))
  }

  /*
   * Tilbake-knappen kan hente forsiden fra bfcache, akkurat slik den var — med
   * lasteren oppe. Da skal den bort med en gang.
   */
  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) hideLoader()
  }

  document.addEventListener('click', onClick)
  window.addEventListener('pageshow', onPageShow)
  return () => {
    document.removeEventListener('click', onClick)
    window.removeEventListener('pageshow', onPageShow)
  }
}
