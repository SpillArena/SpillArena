/** Keep the game documents readable before JS, with rules still accessible
 * after React mounts. Explicit command only: never modifies sibling repos as
 * a side effect of the hub build. --check is read-only; --write applies it. */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const hub = fileURLToPath(new URL('..', import.meta.url))
const roots = { fleetbot: 'FleetBot/battleship-frontend', hangbot: 'HangBot', scribblebot: 'ScribbleBot', atlasmaster: 'AtlasMaster', proportionpanic: 'ProportionPanic', pixelpanic: 'PixelPanic', erashuffle: 'EraShuffle', melodyrush: 'MelodyRush', hitline: 'Hitline', sipzone: 'SipZone', cracked: 'Cracked' }
const guides = Object.fromEntries(await Promise.all(Object.keys(roots).map(async slug => [slug, JSON.parse(await readFile(resolve(hub, `src/content/guides/${slug}.json`), 'utf8'))])))
const esc = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const css = `/* Shared by the initial HTML and the running game. Scoped to avoid changing gameplay. */
.spillarena-game-information { box-sizing: border-box; max-width: 840px; width: 100%; margin: 24px auto; padding: 20px; color: var(--ink, #292335); background: var(--paper, #f7f5ef); font: 400 15px/1.75 system-ui, sans-serif; overflow-wrap: anywhere; border-radius: 12px; }
.spillarena-game-information h2 { margin: 20px 0 8px; font: 600 19px/1.4 system-ui, sans-serif; color: inherit; }
.spillarena-game-information p { margin: 10px 0; font: inherit; color: inherit; }
.spillarena-game-information summary { cursor: pointer; min-height: 44px; padding: 8px 0; font-weight: 650; }
.spillarena-game-information a { color: inherit; text-decoration: underline; text-underline-offset: 3px; }
.spillarena-game-information :focus-visible { outline: 3px solid currentColor; outline-offset: 4px; }
.spillarena-game-information [data-game-info-language="en"] { display: none; }
html[lang^="en"] .spillarena-game-information [data-game-info-language="no"] { display: none; }
html[lang^="en"] .spillarena-game-information [data-game-info-language="en"] { display: block; }
@media (prefers-color-scheme: dark) { .spillarena-game-information { color: var(--ink, #f5f0f7); background: var(--paper, #211d29); } }
/* With scripting on, the game replaces the fallback in #root and moves the rules text into its footer dialog, so neither
   may flash as a card while the game loads. Still in the document, only out of sight. Without scripting they stay visible. */
@media (scripting: enabled) {
  #root > main.spillarena-game-information, body > section.spillarena-game-information { position: absolute; width: 1px; height: 1px; margin: 0; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
}
`
let changed = 0
for (const [slug, directory] of Object.entries(roots)) {
  const root = resolve(hub, '..', directory)
  const path = resolve(root, 'index.html')
  let html
  try { html = await readFile(path, 'utf8') } catch (error) {
    if (error.code !== 'ENOENT') throw error
    console.log(`${directory}: not checked out here, skipped`)
    continue
  }
  const original = html
  const block = '<!--game-information-->\n<section class="spillarena-game-information" aria-label="Spillinformasjon / Game information">\n'
    + ['no', 'en'].map(lang => {
      const g = guides[slug][lang]
      return `<div lang="${lang === 'no' ? 'nb' : 'en'}" data-game-info-language="${lang}"><details><summary>${esc(g.title)}</summary><p>${esc(g.intro)}</p><h2>${esc(g.sections[0].h)}</h2>${g.sections[0].p.map(paragraph => `<p>${esc(paragraph)}</p>`).join('')}<p><a href="https://spillarena.no/games/${slug}/">${lang === 'no' ? 'Les hele guiden med eksempel, tips og vanlige spørsmål' : 'Read the full guide with an example, tips and FAQ'}</a> · <a href="https://spillarena.no/">${lang === 'no' ? 'Alle spill' : 'All games'}</a></p></details></div>`
    }).join('\n') + '\n</section>\n<!--/game-information-->'
  if (html.includes('<!--game-information-->')) html = html.replace(/<!--game-information-->[\s\S]*?<!--\/game-information-->/, block)
  else html = html.replace('</body>', `${block}\n</body>`)
  if (!html.includes('href="/game-information.css"')) html = html.replace('</head>', '  <link rel="stylesheet" href="/game-information.css" />\n</head>')
  // Text is a fallback for slow/failed JS, replaced only by the real game.
  html = html.replace('<div id="root"></div>', `<div id="root"><main class="spillarena-game-information"><h1>${esc(guides[slug].no.title)}</h1><p>${esc(guides[slug].no.intro)}</p><p>JavaScript må være aktivert for å spille. Du kan lese spillereglene nedenfor. / Enable JavaScript to play; the rules remain available below.</p></main></div>`)
  let previousCss = ''
  try { previousCss = await readFile(resolve(root, 'public/game-information.css'), 'utf8') } catch (error) { if (error.code !== 'ENOENT') throw error }
  if (original !== html || previousCss !== css) {
    changed++
    console.log(`${directory}: index.html + public/game-information.css`)
    if (process.argv.includes('--write')) {
      await mkdir(resolve(root, 'public'), { recursive: true })
      await writeFile(path, html)
      await writeFile(resolve(root, 'public/game-information.css'), css)
    }
  }
}
console.log(`${changed} game document(s) ${process.argv.includes('--write') ? 'updated' : 'need updating'}.`)
if (changed && !process.argv.includes('--write')) process.exitCode = 1
