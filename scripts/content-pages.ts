import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import { EditorialArticle, HomeIntroduction, GUIDE_SLUGS, INFO_PATHS, guideFor, guidePath, copyFor, pageMetadata, type InfoPage, type GuideSlug } from '../src/content/pages.ts'
import { GAME_DEFAULTS } from '../shared/game-settings.js'
import { renderSitemap } from '../shared/site-pages.js'

const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const CONTENT = /<!--app-content-->[\s\S]*?<!--\/app-content-->/

export function staticDocumentBody(page?: InfoPage, slug?: GuideSlug): string {
  const copy = copyFor('no')
  const body = page || slug ? h(EditorialArticle, { page, slug, language: 'no' }) : h('div', null,
    h('h1', null, 'SpillArena: gratis nettleserspill på norsk'), h(HomeIntroduction, { language: 'no' }),
    h('section', { className: 'legal-page', id: 'games' }, h('h2', null, copy.content.guidesTitle),
      ...GUIDE_SLUGS.map(key => h('section', { key }, h('h3', null, h('a', { href: guidePath(key) }, guideFor(key, 'no').title)),
        h('p', null, guideFor(key, 'no').intro))))
  )
  return renderToStaticMarkup(h('div', { className: 'lobby-app' },
    h('header', { className: 'site-header arena-container' }, h('a', { className: 'brand', href: '/' }, 'SpillArena.')),
    h('main', { className: 'arena-container lobby-content', id: 'main-content' }, body),
    h('footer', { className: 'site-footer arena-container' }, h('nav', { className: 'footer-links', 'aria-label': copy.lobby.footerNavigation },
      ...Object.entries(INFO_PATHS).map(([key, path]) => h('a', { key, href: path }, key === 'about' ? copy.content.aboutLink : key === 'guides' ? copy.content.guidesLink : key === 'contact' ? copy.contact.title : copy.legal[key as 'privacy' | 'terms' | 'faq'].title)))))
  )
}

/** Information is shipped in HTML as well as React; there is no crawler-only
 * version and no API/network dependency during a production build. */
export function contentPages(): Plugin {
  let outDir = ''
  return {
    name: 'spillarena-content-pages',
    configResolved(config) { outDir = resolve(config.root, config.build.outDir) },
    transformIndexHtml(html) {
      const list = JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList',
        itemListElement: GUIDE_SLUGS.map((slug, index) => ({ '@type': 'ListItem', position: index + 1,
          url: `https://spillarena.no${guidePath(slug)}`, name: guideFor(slug, 'no').title })) })
      return html.replace(CONTENT, `<!--app-content-->${staticDocumentBody()}<!--/app-content-->`)
        .replace(/<script type="application\/ld\+json">(?:(?!<\/script>)[\s\S])*?"@type": "ItemList"[\s\S]*?<\/script>/, `<script type="application/ld+json">${list}</script>`)
    },
    async writeBundle() {
      const template = await readFile(resolve(outDir, 'index.html'), 'utf8')
      if (!CONTENT.test(template)) throw new Error('Missing app content markers in built index.html')
      const pages = [
        ...Object.entries(INFO_PATHS).map(([page, path]) => ({ page: page as InfoPage, path, slug: undefined })),
        ...GUIDE_SLUGS.map(slug => ({ page: undefined, path: guidePath(slug), slug })),
      ]
      for (const { page, path, slug } of pages) {
        const { title, description } = pageMetadata('no', page, slug)
        const url = `https://spillarena.no${path}`
        let html = template.replace(CONTENT, `<!--app-content-->${staticDocumentBody(page, slug)}<!--/app-content-->`)
          .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(title)} · SpillArena</title>`)
          .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`)
          .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escape(description)}" />`)
          .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${escape(title)}" />`)
          .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${escape(description)}" />`)
          .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`)
          .replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${escape(title)}" />`)
          .replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${escape(description)}" />`)
          .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '')
        const schema = JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebPage', name: title, description, url, inLanguage: 'nb' }).replaceAll('<', '\\u003c')
        html = html.replace('</head>', `<script type="application/ld+json">${schema}</script>\n</head>`)
        const directory = resolve(outDir, path.slice(1))
        await mkdir(directory, { recursive: true })
        await writeFile(resolve(directory, 'index.html'), html)
      }
      // Static preview fallback; Pages serves the D1-backed function in production.
      await writeFile(resolve(outDir, 'sitemap.xml'), renderSitemap(GAME_DEFAULTS))
    },
  }
}
