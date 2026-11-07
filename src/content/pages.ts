import { createElement as h, type ReactNode } from 'react'
import no from '../i18n/locales/no.json' with { type: 'json' }
import en from '../i18n/locales/en.json' with { type: 'json' }
import { guides } from './guides/index.ts'

export type Language = 'no' | 'en'
export type InfoPage = 'about' | 'privacy' | 'terms' | 'faq' | 'contact' | 'guides'
export type GuideSlug = keyof typeof guides & string
export const GUIDE_SLUGS = Object.keys(guides) as GuideSlug[]
export { INFO_PATHS, guidePath } from '../../shared/site-pages.js'
import { INFO_PATHS, guidePath } from '../../shared/site-pages.js'
export const copyFor = (language: Language) => language === 'en' ? en : no
export const guideFor = (slug: GuideSlug, language: Language) => guides[slug][language]
export const guideSlug = (pathname: string): GuideSlug | undefined => {
  const match = /^\/games\/([^/]+)\/?$/.exec(pathname)
  return match && Object.hasOwn(guides, match[1]) ? match[1] as GuideSlug : undefined
}
export const infoPage = (pathname: string): InfoPage | undefined =>
  (Object.keys(INFO_PATHS) as InfoPage[]).find(key => INFO_PATHS[key].replace(/\/$/, '') === pathname.replace(/\/$/, ''))

/** No browser state or hooks: used by React and by the build's initial HTML. */
export function EditorialArticle({ page, slug, language, action }: { page?: InfoPage; slug?: GuideSlug; language: Language; action?: ReactNode }) {
  const copy = copyFor(language)
  const c = copy.content
  const section = (title: string, paragraphs: string[]) => h('section', { key: title }, h('h2', null, title), ...paragraphs.map(p => h('p', { key: p }, p)))
  const back = h('a', { className: 'back-link', href: slug ? INFO_PATHS.guides : '/' }, h('span', { className: 'back-arrow', 'aria-hidden': 'true' }, '←'), slug ? c.backToGuides : copy.legal.back)
  const contact = h('p', { className: 'legal-contact' }, h('a', { href: '/contact/' }, copy.contact.openForm), ' · ', h('a', { href: 'mailto:support@spillarena.no' }, 'support@spillarena.no'))
  if (slug) {
    const guide = guideFor(slug, language)
    return h('article', { className: 'legal-page game-guide' }, back,
      h('p', { className: 'eyebrow' }, c.guidesLink), h('h1', null, guide.title), h('p', { className: 'legal-lead' }, guide.intro), action,
      ...guide.sections.map(s => section(s.h, s.p)),
      h('section', { className: 'guide-faq' }, h('h2', null, c.faqTitle), ...guide.faq.map(item => h('div', { key: item.q, className: 'faq-item' }, h('h3', null, item.q), h('p', null, item.a)))),
      h('p', null, h('a', { href: '/#games' }, copy.lobby.explore), ' · ', h('a', { href: '/games/' }, c.guidesLink)), contact)
  }
  if (page === 'guides') return h('article', { className: 'legal-page guide-index' }, back,
    h('h1', null, c.guidesTitle), h('p', { className: 'legal-lead' }, c.guidesIntro),
    h('ul', { className: 'guide-grid' }, ...GUIDE_SLUGS.map(key => guideCard(key, language))))
  if (page === 'about') return h('article', { className: 'legal-page' }, back,
    h('h1', null, c.aboutTitle), h('p', { className: 'legal-lead' }, c.aboutIntro),
    ...c.aboutSections.map(s => section(s.h, s.p)),
    h('p', null, h('a', { href: 'https://github.com/SpillArena' }, 'GitHub'), ' · ', h('a', { href: 'https://emilb.no' }, 'Emil Berglund')), contact)
  if (page === 'contact') return h('article', { className: 'legal-page' }, back,
    h('h1', null, copy.contact.title), h('p', { className: 'legal-lead' }, copy.contact.intro),
    h('p', null, language === 'no' ? 'Kontaktskjemaet trenger JavaScript. Du kan også sende e-post til support@spillarena.no. Beskriv hvilket spill det gjelder, hva du gjorde og hvilken enhet og nettleser du bruker.' : 'The contact form needs JavaScript. You can also email support@spillarena.no. Include the game, what happened, and your device and browser.'), contact)
  if (!page) return null
  const legal = copy.legal[page]
  const sections = page === 'faq' ? copy.legal.faq.items.map(item => ({ h: item.q, p: [item.a] })) : copy.legal[page].sections
  return h('article', { className: 'legal-page' }, back, h('h1', null, legal.title),
    h('p', { className: 'legal-lead' }, legal.intro), page !== 'faq' && h('p', { className: 'legal-updated' }, copy.legal.updated),
    ...sections.map(s => section(s.h, s.p)), contact)
}

/** Poster file names and lobby categories per game. Posters are copied to /art/games/ by the build. */
const GUIDE_META: Record<GuideSlug, { art: string; category: 'strategy' | 'words' | 'knowledge' | 'music' | 'party' }> = {
  fleetbot: { art: 'FleetBot', category: 'strategy' }, hangbot: { art: 'HangBot', category: 'words' },
  scribblebot: { art: 'ScribbleBot', category: 'words' }, atlasmaster: { art: 'AtlasMaster', category: 'knowledge' },
  proportionpanic: { art: 'ProportionPanic', category: 'knowledge' }, pixelpanic: { art: 'PixelPanic', category: 'words' },
  erashuffle: { art: 'EraShuffle', category: 'knowledge' }, melodyrush: { art: 'MelodyRush', category: 'music' },
  hitline: { art: 'Hitline', category: 'music' }, sipzone: { art: 'SipZone', category: 'party' }, cracked: { art: 'Cracked', category: 'words' },
}
export const posterPath = (slug: GuideSlug, language: Language) => `/art/games/${GUIDE_META[slug].art}.${language}.svg`

/** "FleetBot: slagskip mot bot" becomes a name and a tagline for the card. */
function splitTitle(title: string) {
  const [name, ...rest] = title.split(': ')
  const tagline = rest.join(': ')
  return { name, tagline: tagline && tagline[0].toUpperCase() + tagline.slice(1) }
}

function guideCard(slug: GuideSlug, language: Language) {
  const guide = guideFor(slug, language)
  const { name, tagline } = splitTitle(guide.title)
  const copy = copyFor(language)
  return h('li', { key: slug, className: 'guide-card' },
    h('img', { className: 'guide-poster', src: posterPath(slug, language), alt: '', width: 1200, height: 675, loading: 'lazy', decoding: 'async' }),
    h('div', { className: 'guide-card-body' },
      h('p', { className: 'eyebrow' }, copy.lobby.categories[GUIDE_META[slug].category]),
      h('h2', null, h('a', { href: guidePath(slug) }, name)),
      tagline && h('p', { className: 'guide-tagline' }, tagline),
      h('p', { className: 'guide-intro' }, guide.intro),
      h('span', { className: 'guide-more', 'aria-hidden': 'true' }, copy.content.guideLink, ' →')))
}

export function HomeIntroduction({ language }: { language: Language }) {
  const c = copyFor(language).content
  return h('section', { className: 'home-introduction', 'aria-labelledby': 'introduction-title' },
    h('h2', { id: 'introduction-title' }, c.homeTitle), h('p', null, c.homeIntro), h('p', null, c.homeDetail),
    h('nav', { 'aria-label': c.guidesLink }, h('a', { className: 'button secondary', href: '/games/' }, c.guidesLink), h('a', { className: 'button text-button', href: '/about/' }, c.aboutLink)))
}

export function pageMetadata(language: Language, page?: InfoPage, slug?: GuideSlug) {
  const copy = copyFor(language)
  if (slug) return { title: guideFor(slug, language).title, description: guideFor(slug, language).intro, path: guidePath(slug) }
  if (page === 'about') return { title: copy.content.aboutTitle, description: copy.content.aboutIntro, path: INFO_PATHS.about }
  if (page === 'guides') return { title: copy.content.guidesTitle, description: copy.content.guidesIntro, path: INFO_PATHS.guides }
  if (page === 'contact') return { title: copy.contact.title, description: copy.contact.intro, path: INFO_PATHS.contact }
  if (page) return { title: copy.legal[page].title, description: copy.legal[page].intro, path: INFO_PATHS[page] }
  return { title: copy.seoTitle, description: copy.content.homeIntro, path: '/' }
}
