/** PIN pages stay ad-free even if they are linked from a different path. */
const PIN_PAGES = new Set(['login', 'register', 'recover', 'profile'])

export function isPinPage(href: string = window.location.href): boolean {
  const url = new URL(href)
  return url.searchParams.has('recover') || PIN_PAGES.has(url.hash.slice(1))
}

/** Only the home catalogue may request ads. Guides, forms, help and unknown
 * routes stay ad-free. A loaded tag cannot be removed: App reloads on a hash
 * transition to an ad-free screen; ordinary page links load a new document. */
export function isAdFreePage(href: string = window.location.href): boolean {
  const url = new URL(href)
  return isPinPage(href) || url.pathname !== '/' || !['', '#games', '#main-content'].includes(url.hash)
}
