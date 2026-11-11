import { AD_FREE_GAMES } from '../../shared/games-registry.js'
import { PARTY_CODE } from '../../shared/party.js'

/** PIN pages stay ad-free even if they are linked from a different path. */
const PIN_PAGES = new Set(['login', 'register', 'recover', 'profile'])

/** Where PartyProvider keeps the party code of this tab. */
export const PARTY_STORAGE_KEY = 'spillarena.party'

export function isPinPage(href: string = window.location.href): boolean {
  const url = new URL(href)
  return url.searchParams.has('recover') || PIN_PAGES.has(url.hash.slice(1))
}

/** Any path that names an ad-free game: the game itself (/melodyrush/) and its guide (/games/melodyrush/). MelodyRush
 * and Hitline play Deezer's music, and that licence does not allow ads. This holds even if guides get ads one day. */
export function isAdFreeGamePath(href: string = window.location.href): boolean {
  return new URL(href).pathname.toLowerCase().split('/').some(part => AD_FREE_GAMES.includes(part))
}

/** A tab that sits in a party is ad-free: the leader can open MelodyRush or Hitline over the lobby at any moment
 * (PartyGameFrame), and a loaded ad tag cannot be removed. Only a stored code can exist at load; a party held in memory
 * was joined on #party, which never has the tag. */
export function isInParty(): boolean {
  try {
    return PARTY_CODE.test(window.sessionStorage.getItem(PARTY_STORAGE_KEY) ?? '')
  } catch { return false }
}

/** Only the home catalogue may request ads. Guides, forms, help and unknown
 * routes stay ad-free. A loaded tag cannot be removed: App reloads on a hash
 * transition to an ad-free screen; ordinary page links load a new document. */
export function isAdFreePage(href: string = window.location.href): boolean {
  const url = new URL(href)
  return isPinPage(href) || isAdFreeGamePath(href) || url.pathname !== '/' || !['', '#games', '#main-content'].includes(url.hash)
}
