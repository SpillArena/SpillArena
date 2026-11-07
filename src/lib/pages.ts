import { guideSlug, infoPage, INFO_PATHS } from '../content/pages.ts'

export type Page = 'home' | 'login' | 'register' | 'recover' | 'profile' | 'party' | 'privacy' | 'terms' | 'faq' | 'contact' | 'about' | 'guides' | 'guide'
const ACCOUNT_PAGES = ['login', 'register', 'recover', 'profile', 'party']

export function currentPage(href: string = window.location.href): Page {
  const url = new URL(href)
  if (url.searchParams.has('recover')) return 'recover'
  const hash = url.hash.slice(1)
  if (ACCOUNT_PAGES.includes(hash)) return hash as Page
  if (guideSlug(url.pathname)) return 'guide'
  return infoPage(url.pathname) ?? 'home'
}

/** Old shared links remain valid, but information pages now have real URLs. */
export function legacyInfoPath(href: string = window.location.href): string | undefined {
  const hash = new URL(href).hash.slice(1)
  return Object.hasOwn(INFO_PATHS, hash) ? INFO_PATHS[hash as keyof typeof INFO_PATHS] : undefined
}
