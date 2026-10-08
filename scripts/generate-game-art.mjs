/**
 * Lager spillbannerne (1200×675, norsk og engelsk) og spillikonene (512×512).
 *
 *   npm run art
 *
 * Skriver til src/assets/games/ og lager src/data/game-art.ts, som kobler
 * filene til spillene. Endre tekst eller tegning HER og kjør på nytt; ikke rediger
 * SVG-ene for hånd.
 *
 * TEKSTEN ER STREKER, IKKE <text>. En SVG vist i <img> får ikke laste webfonter,
 * så <text> ville blitt tegnet med det nettleseren tilfeldigvis har. Her gjøres
 * hver bokstav om til en path med Fraunces og Space Grotesk — de samme fontene
 * som lobbyen — og bildet ser likt ut overalt.
 *
 * FORMSPRÅKET er brikkene fra logoen: avrundede kvadrater med en mørkere sokkel
 * under og en lys glans øverst. Hvert spill har sin egen farge; illustrasjonen
 * til høyre bygges av de samme brikkene.
 */

import opentype from 'opentype.js'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { geoGraticule10, geoOrthographic, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'src/assets/games')
const LANGS = ['no', 'en']

// ---------------------------------------------------------------- fonter

function loadFont(pkg, file) {
  const buffer = readFileSync(join(ROOT, 'node_modules/@fontsource', pkg, 'files', file))
  return opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength))
}

const FONTS = {
  serif: loadFont('fraunces', 'fraunces-latin-600-normal.woff'),
  serifItalic: loadFont('fraunces', 'fraunces-latin-600-italic.woff'),
  serifRegular: loadFont('fraunces', 'fraunces-latin-500-normal.woff'),
  sans: loadFont('space-grotesk', 'space-grotesk-latin-500-normal.woff'),
  sansSemi: loadFont('space-grotesk', 'space-grotesk-latin-600-normal.woff'),
  sansBold: loadFont('space-grotesk', 'space-grotesk-latin-700-normal.woff'),
}

/**
 * Kerning mellom to glyfer, i fontenheter. opentype.js gir NaN for noen par
 * (GPOS-oppslag den ikke støtter), og én NaN gjør resten av streken ugyldig —
 * teksten stopper midt i et ord.
 */
function kern(font, a, b) {
  const value = font.getKerningValue(a, b)
  return Number.isFinite(value) ? value : 0
}

/**
 * Path-data for én glyf, formatert her og ikke med `toPathData`: den gir NaN
 * for enkelte koordinater (avrundingsfeil i opentype.js 2), og nettleseren
 * slutter å tegne resten av streken ved første NaN.
 */
function pathData(path, decimals) {
  const f = 10 ** decimals
  const n = (v) => String(Math.round(v * f) / f)
  return path.commands.map((c) => {
    switch (c.type) {
      case 'M': case 'L': return `${c.type}${n(c.x)} ${n(c.y)}`
      case 'Q': return `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`
      case 'C': return `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`
      default: return 'Z'
    }
  }).join('')
}

/** Bredden på en tekst i piksler, med kerning og ekstra sperring. */
function measure(str, font, size, tracking = 0) {
  const glyphs = font.stringToGlyphs(str)
  const scale = size / font.unitsPerEm
  let width = 0
  glyphs.forEach((glyph, i) => {
    width += glyph.advanceWidth * scale
    if (i < glyphs.length - 1) width += kern(font, glyph, glyphs[i + 1]) * scale + tracking
  })
  return width
}

/**
 * Tekst som én path. `anchor` er start, middle eller end. `middle: true`
 * plasserer y på midten av versalhøyden i stedet for på grunnlinja — det som
 * trengs for en bokstav midt i en brikke.
 */
function text(str, font, size, x, y, { fill = '#fff', tracking = 0, anchor = 'start', middle = false, opacity, decimals } = {}) {
  const width = measure(str, font, size, tracking)
  let cursor = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x
  const capHeight = (font.tables.os2?.sCapHeight || font.unitsPerEm * 0.7) / font.unitsPerEm * size
  const baseline = middle ? y + capHeight / 2 : y
  const scale = size / font.unitsPerEm
  const glyphs = font.stringToGlyphs(str)
  const places = decimals ?? (size >= 22 ? 0 : 1)
  let d = ''
  glyphs.forEach((glyph, i) => {
    d += pathData(glyph.getPath(cursor, baseline, size), places)
    cursor += glyph.advanceWidth * scale
    if (i < glyphs.length - 1) cursor += kern(font, glyph, glyphs[i + 1]) * scale + tracking
  })
  return `<path d="${d}" fill="${fill}"${opacity != null ? ` fill-opacity="${opacity}"` : ''}/>`
}

/** Største størrelse (opp til `max`) der teksten får plass i `width`. */
const fit = (str, font, width, max, tracking = 0) => Math.min(max, max * width / measure(str, font, max, tracking))

/** Bryter tekst i linjer som får plass i `width`. */
function wrap(str, font, size, width) {
  const lines = []
  let line = ''
  for (const word of str.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (line && measure(next, font, size) > width) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  if (lines.length !== 2) return lines
  // to linjer: velg bruddet som gjør dem mest like lange, så ingen linje blir
  // et enslig ord
  const words = str.split(' ')
  let best = lines
  let bestWidth = Math.max(...lines.map((l) => measure(l, font, size)))
  for (let i = 1; i < words.length; i++) {
    const pair = [words.slice(0, i).join(' '), words.slice(i).join(' ')]
    const widest = Math.max(...pair.map((l) => measure(l, font, size)))
    if (widest <= width && widest < bestWidth) [best, bestWidth] = [pair, widest]
  }
  return best
}

// ---------------------------------------------------------------- farger

const hex = (c) => c.replace('#', '').match(/../g).map((h) => parseInt(h, 16))
const toHex = (rgb) => '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')
/** `a` blandet med `b`, der t = 0 er bare a. */
const mix = (a, b, t) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t))
const shade = (c, t) => mix(c, '#000000', t)
const tint = (c, t) => mix(c, '#ffffff', t)

// ---------------------------------------------------------------- brikker

const r1 = (n) => Math.round(n * 10) / 10

/**
 * Én brikke slik logoen tegner dem: sokkel, flate og glans.
 * `depth` er hvor mye av sokkelen som stikker ut under.
 */
function tile(x, y, w, h, color, { r, depth, gloss = true, opacity, stroke } = {}) {
  const radius = r ?? Math.min(w, h) * 0.27
  const d = depth ?? Math.max(2, Math.min(w, h) * 0.1)
  const op = opacity != null ? ` opacity="${opacity}"` : ''
  let out = `<g${op}>`
  if (d > 0) out += `<rect x="${r1(x)}" y="${r1(y + d)}" width="${r1(w)}" height="${r1(h)}" rx="${r1(radius)}" fill="${shade(color, 0.42)}"/>`
  out += `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r1(radius)}" fill="${color}"${stroke ? ` stroke="${stroke}"` : ''}/>`
  if (gloss) {
    out += `<rect x="${r1(x + w * 0.1)}" y="${r1(y + h * 0.07)}" width="${r1(w * 0.8)}" height="${r1(h * 0.3)}" rx="${r1(Math.min(radius, h * 0.15))}" fill="#fff" fill-opacity="0.22"/>`
  }
  return out + '</g>'
}

/** En flat, gjennomsiktig plass på et brett — der en brikke kan ligge. */
const slot = (x, y, s, fill = '#fff', opacity = 0.1) =>
  `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(s)}" height="${r1(s)}" rx="${r1(s * 0.27)}" fill="${fill}" fill-opacity="${opacity}"/>`

const g = (attrs, ...children) => `<g ${attrs}>${children.join('')}</g>`

/** Skygge under et kort: en mørk, myk kopi litt lenger ned. */
const cardShadow = (x, y, w, h, r, offset = 12, opacity = 0.22) =>
  `<rect x="${r1(x)}" y="${r1(y + offset)}" width="${r1(w)}" height="${r1(h)}" rx="${r1(r)}" fill="#000" fill-opacity="${opacity}"/>`

// SpillArena-logoen i miniatyr: de 13 brikkene i S-en, i logoens farger
const LOGO_TILES = [
  [4, 0, '#f472b6'], [3, 0, '#e879f9'], [2, 0, '#c084fc'], [1, 0, '#a78bfa'], [0, 1, '#818cf8'],
  [1, 2, '#60a5fa'], [2, 2, '#38bdf8'], [3, 2, '#22d3ee'], [4, 3, '#2dd4bf'], [3, 4, '#4ade80'],
  [2, 4, '#bef264'], [1, 4, '#fbbf24'], [0, 4, '#f97316'],
]

function logoMark(x, y, size) {
  const pad = size * 0.14
  const cell = (size - pad * 2) / 5
  let out = `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r1(size * 0.24)}" fill="#1a1328"/>`
  for (const [cx, cy, color] of LOGO_TILES) {
    out += `<rect x="${r1(x + pad + cx * cell + cell * 0.08)}" y="${r1(y + pad + cy * cell + cell * 0.08)}" width="${r1(cell * 0.84)}" height="${r1(cell * 0.84)}" rx="${r1(cell * 0.24)}" fill="${color}"/>`
  }
  return out
}

// ---------------------------------------------------------------- spillene

/*
 * Hvert spill: farger, tekst på begge språk, og to tegninger — `art` til
 * banneret (et felt på 500×520) og `glyph` til ikonet (512×512).
 */
const GAMES = [
  {
    id: 1, file: 'FleetBot', title: ['Fleet', 'Bot'],
    bg: '#2563eb', deep: '#172554', accent: '#fde047',
    genre: { no: 'Strategi · mot bot', en: 'Strategy · vs bot' },
    tagline: { no: 'Plasser flåten. Les boten. Senk alt.', en: 'Place your fleet. Read the bot. Sink it all.' },
    art: () => fleetBoard(6, 62, 12, true),
    glyph: () => g('transform="translate(76 76)"', fleetBoard(3, 104, 18, false)),
  },
  {
    id: 2, file: 'HangBot', title: ['Hang', 'Bot'],
    bg: '#dc2626', deep: '#450a0a', accent: '#fde68a',
    genre: { no: 'Ordspill', en: 'Word game' },
    tagline: { no: 'Knekk ordet før gjetningene tar slutt.', en: 'Crack the word before your guesses run out.' },
    word: { no: ['S', 'P', '?', 'L', 'L'], en: ['G', 'A', '?', 'E', 'S'] },
    art: (lang, game) => hangArt(game.word[lang], game),
    glyph: (game) => hangGlyph(game),
  },
  {
    id: 3, file: 'ScribbleBot', title: ['Scribble', 'Bot'],
    bg: '#16a34a', deep: '#052e16', accent: '#d9f99d',
    genre: { no: 'Tegn og gjett', en: 'Draw and guess' },
    tagline: { no: 'Boten tegner. Du gjetter hva det er.', en: 'The bot draws. You guess what it is.' },
    guess: { no: 'Et hus?', en: 'A house?' },
    art: (lang, game) => scribbleArt(game.guess[lang], game),
    glyph: (game) => scribbleGlyph(game),
  },
  {
    id: 4, file: 'AtlasMaster', title: ['Atlas', 'Master'],
    bg: '#7c3aed', deep: '#2e1065', accent: '#a5f3fc',
    genre: { no: 'Geografi', en: 'Geography' },
    tagline: { no: 'Land, hovedsteder og byer – på tid.', en: 'Countries, capitals and cities – against the clock.' },
    question: { no: 'Hvor er Norge?', en: 'Where is Norway?' },
    art: (lang, game) => atlasArt(game.question[lang], game),
    glyph: (game) => atlasGlyph(game),
  },
  {
    id: 5, file: 'ProportionPanic', title: ['Proportion', 'Panic'],
    bg: '#ea580c', deep: '#431407', accent: '#fef08a',
    genre: { no: 'Estimering', en: 'Estimation' },
    tagline: { no: 'Hvor stort er det egentlig? Stol på øyemålet.', en: 'How big is it really? Trust your eye.' },
    known: { no: '5,5 m', en: '5.5 m' },
    art: (lang, game) => proportionArt(lang, game),
    glyph: (game) => proportionGlyph(game),
  },
  {
    id: 6, file: 'PixelPanic', title: ['Pixel', 'Panic'],
    bg: '#c026d3', deep: '#4a044e', accent: '#fbcfe8',
    genre: { no: 'Bildequiz', en: 'Picture quiz' },
    tagline: { no: 'Gjett bildet før pikslene avslører det.', en: 'Name the picture before the pixels give it away.' },
    guess: { no: 'Fjellet Fuji?', en: 'Mount Fuji?' },
    button: { no: 'Gjett', en: 'Guess' },
    art: (lang, game) => pixelArt(game.guess[lang], game.button[lang], game),
    glyph: () => pixelFrame(76, 76, 360, 5, 8),
  },
  {
    id: 7, file: 'EraShuffle', title: ['Era', 'Shuffle'],
    bg: '#0d9488', deep: '#042f2e', accent: '#fde68a',
    genre: { no: 'Historie', en: 'History' },
    tagline: { no: 'Fem øyeblikk. Én tidslinje. Ny hver dag.', en: 'Five moments. One timeline. New every day.' },
    events: {
      no: ['Columbus seiler vest', 'Månelandingen', 'Berlinmuren faller', 'OL på Lillehammer'],
      en: ['Columbus sails west', 'The Moon landing', 'The Berlin Wall falls', 'Lillehammer Olympics'],
    },
    art: (lang, game) => eraArt(game.events[lang], game),
    glyph: (game) => eraGlyph(game),
  },
  {
    id: 8, file: 'MelodyRush', title: ['Melody', 'Rush'],
    bg: '#fbbf24', deep: '#b45309', accent: '#7c2d12', ink: '#2b1705', dots: '#2b1705',
    genre: { no: 'Musikkquiz', en: 'Music quiz' },
    tagline: { no: 'Kjenn igjen låten på et sekund.', en: 'Name the song in a single second.' },
    art: () => melodyArt(),
    glyph: () => melodyGlyph(),
  },
]

// ---- FleetBot: et brett med to skip, to treff, bom og et sikte

function fleetBoard(n, cell, gap, full) {
  const step = cell + gap
  const at = (c) => c * step
  let out = ''
  for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) out += slot(at(col), at(row), cell)
  const ship = '#bfdbfe'
  const hit = '#fb923c'
  const cross = (col, row) => {
    const cx = at(col) + cell / 2, cy = at(row) + cell / 2, k = cell * 0.2
    return `<path d="M${r1(cx - k)} ${r1(cy - k)}L${r1(cx + k)} ${r1(cy + k)}M${r1(cx + k)} ${r1(cy - k)}L${r1(cx - k)} ${r1(cy + k)}" stroke="#fff" stroke-width="${r1(cell * 0.11)}" stroke-linecap="round"/>`
  }
  const miss = (col, row) => `<circle cx="${r1(at(col) + cell / 2)}" cy="${r1(at(row) + cell / 2)}" r="${r1(cell * 0.18)}" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="${r1(cell * 0.07)}"/>`
  const sight = (col, row) => {
    const cx = at(col) + cell / 2, cy = at(row) + cell / 2, rr = cell * 0.72, w = r1(cell * 0.08)
    return `<g stroke="#fde047" stroke-width="${w}" stroke-linecap="round" fill="none"><circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(rr)}"/><path d="M${r1(cx)} ${r1(cy - rr - cell * 0.25)}V${r1(cy - rr + cell * 0.2)}M${r1(cx)} ${r1(cy + rr - cell * 0.2)}V${r1(cy + rr + cell * 0.25)}M${r1(cx - rr - cell * 0.25)} ${r1(cy)}H${r1(cx - rr + cell * 0.2)}M${r1(cx + rr - cell * 0.2)} ${r1(cy)}H${r1(cx + rr + cell * 0.25)}"/></g>`
  }
  if (full) {
    // langt skip på rad 1, kort skip loddrett i kolonne 4
    for (const col of [1, 2, 3, 4]) out += tile(at(col), at(1), cell, cell, col === 2 ? hit : ship)
    out += cross(2, 1)
    for (const row of [3, 4, 5]) out += tile(at(4), at(row), cell, cell, row === 4 ? hit : ship)
    out += cross(4, 4)
    out += miss(0, 4) + miss(2, 3) + miss(5, 0) + miss(1, 5)
    out += sight(2, 4)
    return g(`transform="translate(34 44) rotate(-5 ${r1(at(n) / 2)} ${r1(at(n) / 2)})"`, out)
  }
  out += tile(at(0), at(1), cell, cell, ship) + tile(at(1), at(1), cell, cell, hit) + cross(1, 1)
  out += miss(2, 0) + sight(2, 2)
  return out
}

// ---- HangBot: boten, livene, ordet og brukte bokstaver

function botFace(x, y, w, h, face, eye) {
  return tile(x, y, w, h, face, { r: w * 0.22 })
    + `<path d="M${r1(x + w / 2)} ${r1(y)}V${r1(y - h * 0.18)}" stroke="${face}" stroke-width="${r1(w * 0.04)}" stroke-linecap="round"/>`
    + `<circle cx="${r1(x + w / 2)}" cy="${r1(y - h * 0.22)}" r="${r1(w * 0.06)}" fill="#fde68a"/>`
    + tile(x + w * 0.2, y + h * 0.3, w * 0.18, w * 0.18, eye, { depth: 0, gloss: false })
    + tile(x + w * 0.62, y + h * 0.3, w * 0.18, w * 0.18, eye, { depth: 0, gloss: false })
    + `<rect x="${r1(x + w * 0.3)}" y="${r1(y + h * 0.7)}" width="${r1(w * 0.4)}" height="${r1(h * 0.08)}" rx="${r1(h * 0.04)}" fill="${eye}"/>`
}

function hangArt(word, game) {
  const ink = shade(game.bg, 0.55)
  let out = botFace(165, 40, 170, 140, '#fff1f2', ink)
  // seks liv, to brukt
  for (let i = 0; i < 6; i++) out += tile(130 + i * 42, 212, 30, 30, i < 4 ? game.accent : '#ffffff', { opacity: i < 4 ? 1 : 0.22, depth: 3 })
  // ordet
  const w = 84, gap = 14, start = (500 - (5 * w + 4 * gap)) / 2
  word.forEach((letter, i) => {
    const x = start + i * (w + gap)
    const blank = letter === '?'
    out += tile(x, 282, w, 98, blank ? tint(game.bg, 0.25) : '#fff7ed')
    out += text(letter, FONTS.serif, 56, x + w / 2, 282 + 49, { fill: blank ? game.accent : ink, anchor: 'middle', middle: true })
  })
  // brukte bokstaver
  const rack = ['A', 'E', 'I', 'O', 'R', 'T', 'N']
  rack.forEach((letter, i) => {
    const x = 37 + i * 62, used = i % 3 === 1
    out += tile(x, 430, 50, 50, '#ffffff', { opacity: used ? 0.12 : 0.24, depth: 0, gloss: false })
    out += text(letter, FONTS.sansBold, 22, x + 25, 455, { fill: '#fff', anchor: 'middle', middle: true, opacity: used ? 0.35 : 0.9 })
  })
  return out
}

function hangGlyph(game) {
  const ink = shade(game.bg, 0.55)
  let out = botFace(161, 96, 190, 156, '#fff1f2', ink)
  ;['A', '?', 'E'].forEach((letter, i) => {
    const x = 96 + i * 112, blank = letter === '?'
    out += tile(x, 300, 96, 112, blank ? tint(game.bg, 0.25) : '#fff7ed')
    out += text(letter, FONTS.serif, 66, x + 48, 356, { fill: blank ? game.accent : ink, anchor: 'middle', middle: true })
  })
  return out
}

// ---- ScribbleBot: et ark med en krusedull, en blyant og en gjetning

/** En hånd-tegnet strek: punktene får litt slingring, deterministisk. */
function scribble(points, wobble = 3) {
  let seed = 7
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280 - 0.5) * 2 * wobble
  return points.map(([x, y], i) => `${i ? 'L' : 'M'}${r1(x + rnd())} ${r1(y + rnd())}`).join('')
}

function drawing(scale, stroke) {
  const s = (pts) => pts.map(([x, y]) => [x * scale, y * scale])
  const lines = [
    s([[30, 252], [100, 248], [180, 254], [260, 249], [330, 253]]),
    s([[90, 250], [92, 172], [150, 112], [208, 170], [210, 251]]),
    s([[80, 182], [150, 106], [222, 180]]),
    s([[135, 251], [136, 205], [165, 204], [166, 250]]),
  ]
  let out = lines.map((pts) => `<path d="${scribble(pts, 2.4 * scale)}" fill="none" stroke="${stroke}" stroke-width="${r1(7 * scale)}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')
  // sola, med stråler
  const cx = 280 * scale, cy = 80 * scale, rr = 26 * scale
  out += `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(rr)}" fill="none" stroke="${stroke}" stroke-width="${r1(7 * scale)}"/>`
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2
    out += `<path d="M${r1(cx + Math.cos(a) * rr * 1.45)} ${r1(cy + Math.sin(a) * rr * 1.45)}L${r1(cx + Math.cos(a) * rr * 1.9)} ${r1(cy + Math.sin(a) * rr * 1.9)}" stroke="${stroke}" stroke-width="${r1(6 * scale)}" stroke-linecap="round"/>`
  }
  return out
}

function pencil(x, y, length, width, angle) {
  return g(`transform="translate(${x} ${y}) rotate(${angle})"`,
    `<rect x="0" y="${r1(-width / 2 + width * 0.18)}" width="${length}" height="${width}" rx="${r1(width * 0.3)}" fill="#a16207"/>`,
    `<rect x="0" y="${r1(-width / 2)}" width="${length}" height="${width}" rx="${r1(width * 0.3)}" fill="#fde047"/>`,
    `<rect x="${r1(length * 0.05)}" y="${r1(-width / 2 + width * 0.12)}" width="${r1(length * 0.85)}" height="${r1(width * 0.22)}" rx="${r1(width * 0.1)}" fill="#fff" fill-opacity="0.35"/>`,
    `<rect x="${r1(length - width * 0.2)}" y="${r1(-width / 2)}" width="${r1(width * 0.9)}" height="${width}" rx="${r1(width * 0.3)}" fill="#f9a8d4"/>`,
    `<path d="M0 ${r1(-width / 2)}L${r1(-width * 1.1)} 0L0 ${r1(width / 2)}Z" fill="#fde7c3"/>`,
    `<path d="M${r1(-width * 0.66)} ${r1(-width * 0.2)}L${r1(-width * 1.1)} 0L${r1(-width * 0.66)} ${r1(width * 0.2)}Z" fill="#1f2937"/>`)
}

function scribbleArt(guess, game) {
  const ink = shade(game.bg, 0.6)
  const paper = '#fffbeb'
  let out = g('transform="rotate(-4 220 290)"',
    cardShadow(40, 150, 360, 290, 22, 14),
    `<rect x="40" y="150" width="360" height="290" rx="22" fill="${paper}"/>`,
    g('transform="translate(40 150)"', drawing(1, ink)))
  out += pencil(372, 418, 150, 34, -38)
  // gjetningen i en snakkeboble
  const size = 32, w = measure(guess, FONTS.serifItalic, size) + 96
  const bx = 470 - w, by = 46
  out += cardShadow(bx, by, w, 70, 22, 8, 0.18)
  out += `<rect x="${r1(bx)}" y="${by}" width="${r1(w)}" height="70" rx="22" fill="#fff"/>`
  out += `<path d="M${r1(bx + 40)} ${by + 66}L${r1(bx + 28)} ${by + 96}L${r1(bx + 70)} ${by + 66}Z" fill="#fff"/>`
  out += text(guess, FONTS.serifItalic, size, bx + 26, by + 35, { fill: ink, middle: true })
  out += tile(bx + w - 58, by + 15, 40, 40, '#4ade80', { depth: 3 })
  out += `<path d="M${r1(bx + w - 48)} ${by + 36}l8 8l14 -16" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`
  return out
}

function scribbleGlyph(game) {
  const ink = shade(game.bg, 0.6)
  return g('transform="rotate(-5 256 256)"',
    cardShadow(86, 106, 340, 290, 30, 16),
    `<rect x="86" y="106" width="340" height="290" rx="30" fill="#fffbeb"/>`,
    g('transform="translate(96 116) scale(0.9)"', drawing(1, ink)))
    + pencil(372, 400, 120, 34, -38)
}

// ---- AtlasMaster: en ekte jordklode med Norge uthevet, en nål og et spørsmål

/*
 * Landene er Natural Earth i 1:50 mill. (world-atlas), projisert ortografisk
 * med d3-geo — samme projeksjon som et fotografi av jorda. Kloden er dreid så
 * Europa vender mot oss og Norge ligger øverst, der nåla står.
 */
const WORLD = (() => {
  const topology = JSON.parse(readFileSync(join(ROOT, 'node_modules/world-atlas/countries-50m.json'), 'utf8'))
  return feature(topology, topology.objects.countries).features
})()
const GLOBE_CENTER = [-14, -48]
const NORWAY_PIN = [18.9, 69.6]
const LAND = ['#6ee7b7', '#86efac', '#5eead4', '#a7f3d0', '#7dd3c0']

/** Samme land får alltid samme grønnfarge, uten at naboer nødvendigvis gjør det. */
function landColor(name) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return LAND[h % LAND.length]
}

function pinMark(tipX, tipY, pr, fill, stroke) {
  const px = tipX, py = tipY - pr * 2.3
  return `<path d="M${r1(px)} ${r1(tipY)}C${r1(px - pr * 0.5)} ${r1(py + pr * 1.4)} ${r1(px - pr)} ${r1(py + pr * 0.8)} ${r1(px - pr)} ${r1(py)}A${r1(pr)} ${r1(pr)} 0 1 1 ${r1(px + pr)} ${r1(py)}C${r1(px + pr)} ${r1(py + pr * 0.8)} ${r1(px + pr * 0.5)} ${r1(py + pr * 1.4)} ${r1(px)} ${r1(tipY)}Z" fill="${fill}" stroke="${stroke}" stroke-width="${r1(pr * 0.12)}"/>`
    + `<circle cx="${r1(px)}" cy="${r1(py)}" r="${r1(pr * 0.38)}" fill="${stroke}"/>`
}

/**
 * Slipper punkter som ligger nærmere det forrige enn `tolerance` piksler, etter
 * projeksjonen. 1:50 mill. har detaljer ingen ser i et banner på 1200 piksler,
 * og uten dette ble kloden alene over en halv megabyte.
 */
function thin(stream, tolerance) {
  let ring = null
  return {
    point(x, y) {
      const last = ring[ring.length - 1]
      if (last && Math.hypot(x - last[0], y - last[1]) < tolerance) { ring.pending = [x, y]; return }
      ring.push([x, y]); ring.pending = null
    },
    lineStart() { ring = [] },
    lineEnd() {
      if (ring.pending) ring.push(ring.pending)
      // øyer mindre enn et par piksler blir bare støy: dropp hele ringen
      const xs = ring.map((p) => p[0]), ys = ring.map((p) => p[1])
      const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys))
      if (ring.length >= 2 && size >= tolerance * 1.5) {
        stream.lineStart()
        for (const [x, y] of ring) stream.point(x, y)
        stream.lineEnd()
      }
      ring = null
    },
    polygonStart() { stream.polygonStart() },
    polygonEnd() { stream.polygonEnd() },
    sphere() { stream.sphere?.() },
  }
}

function globe(cx, cy, radius, game, { pin = true } = {}) {
  const projection = geoOrthographic().scale(radius).translate([cx, cy]).rotate(GLOBE_CENTER).clipAngle(90).precision(0.5)
  const path = geoPath({ stream: (output) => projection.stream(thin(output, radius / 80)) }).digits(1)
  const ink = '#1e0a3c'

  // ett path-element per farge, ikke per land: samme bilde, en brøkdel av markupen
  const byColor = new Map()
  let norway = ''
  for (const country of WORLD) {
    const d = path(country)
    if (!d) continue
    if (country.properties.name === 'Norway') { norway = d; continue }
    const color = landColor(country.properties.name)
    byColor.set(color, (byColor.get(color) ?? '') + d)
  }

  let out = `<defs>
<radialGradient id="ocean" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="${mix(game.bg, '#1e3a8a', 0.55)}"/><stop offset="1" stop-color="${shade(game.deep, 0.35)}"/></radialGradient>
<radialGradient id="globe-light" cx="0.32" cy="0.26" r="0.7"><stop offset="0" stop-color="#fff" stop-opacity="0.28"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/></radialGradient>
<radialGradient id="globe-shade" cx="0.5" cy="0.5" r="0.5"><stop offset="0.72" stop-color="${ink}" stop-opacity="0"/><stop offset="1" stop-color="${ink}" stop-opacity="0.55"/></radialGradient>
</defs>`
  // skygge, atmosfære og hav
  out += `<circle cx="${cx}" cy="${r1(cy + radius * 0.06)}" r="${radius}" fill="#000" fill-opacity="0.25"/>`
  out += `<circle cx="${cx}" cy="${cy}" r="${r1(radius + 10)}" fill="none" stroke="${game.accent}" stroke-opacity="0.12" stroke-width="10"/>`
  out += `<circle cx="${cx}" cy="${cy}" r="${r1(radius + 3)}" fill="none" stroke="${game.accent}" stroke-opacity="0.35" stroke-width="4"/>`
  out += `<path d="${path({ type: 'Sphere' })}" fill="url(#ocean)"/>`
  out += `<path d="${path(geoGraticule10())}" fill="none" stroke="#fff" stroke-opacity="0.13" stroke-width="1"/>`
  // landene, med grensene som en tynn mørk strek
  for (const [color, d] of byColor) out += `<path d="${d}" fill="${color}" stroke="${ink}" stroke-opacity="0.45" stroke-width="0.7" stroke-linejoin="round"/>`
  out += `<path d="${norway}" fill="#fde047" stroke="${ink}" stroke-opacity="0.6" stroke-width="0.9" stroke-linejoin="round"/>`
  // lys og mørk kant, så den ser rund ut
  out += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="url(#globe-light)"/>`
  out += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="url(#globe-shade)"/>`
  out += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#fff" stroke-opacity="0.25" stroke-width="2"/>`
  if (pin) {
    const [x, y] = projection(NORWAY_PIN)
    out += pinMark(x, y, radius * 0.075, game.accent, ink)
  }
  return out
}

function atlasArt(question, game) {
  let out = globe(260, 230, 205, game)
  const size = 26, w = measure(question, FONTS.sansSemi, size) + 64
  const x = 260 - w / 2, y = 456
  out += cardShadow(x, y, w, 58, 29, 8, 0.2)
  out += `<rect x="${r1(x)}" y="${y}" width="${r1(w)}" height="58" rx="29" fill="#faf5ff"/>`
  out += text(question, FONTS.sansSemi, size, 260, y + 29, { fill: shade(game.deep, 0.1), anchor: 'middle', middle: true })
  return out
}

const atlasGlyph = (game) => globe(256, 256, 186, game)

// ---- ProportionPanic: en giraff og en seilbåt, en linjal mellom dem, og
// spørsmålet om hvor høy båten er

const GIRAFFE = { coat: '#fcd34d', spot: '#b45309', dark: '#431407' }

/**
 * En giraff som ser mot høyre, med bakken på y = 360 og hodet rundt y = 0.
 * Flekkene er avrundede brikker — samme form som i logoen — klippet til
 * kroppen og halsen.
 */
function giraffe(id) {
  const { coat, spot, dark } = GIRAFFE
  const body = `<rect x="20" y="168" width="150" height="78" rx="39"/>`
  const neck = `<path d="M118 206L174 178L204 32L178 22Z"/>`
  let spots = ''
  const places = [
    [34, 182, 22, 8], [64, 176, 26, -6], [98, 182, 24, 10], [132, 178, 22, -4], [46, 214, 24, -8],
    [80, 212, 22, 6], [114, 214, 26, -10], [148, 206, 20, 4], [150, 150, 20, 8], [158, 112, 18, -6],
    [168, 76, 16, 10], [176, 44, 14, -4], [134, 180, 18, 12],
  ]
  for (const [x, y, size, angle] of places) {
    spots += `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r1(size * 0.3)}" fill="${spot}" transform="rotate(${angle} ${x + size / 2} ${y + size / 2})"/>`
  }
  let out = `<defs><clipPath id="${id}">${body}${neck}</clipPath></defs>`
  // halen, bak alt annet
  out += `<path d="M24 190Q4 214 10 250" fill="none" stroke="${coat}" stroke-width="5" stroke-linecap="round"/><ellipse cx="10" cy="256" rx="6" ry="10" fill="${dark}"/>`
  // beina: de bakerste litt mørkere, for dybde
  for (const [x, far] of [[44, true], [128, true], [30, false], [114, false]]) {
    const color = far ? shade(coat, 0.18) : coat
    out += `<rect x="${x}" y="222" width="16" height="132" rx="8" fill="${color}"/><rect x="${x - 1}" y="346" width="18" height="14" rx="5" fill="${dark}"/>`
    out += `<rect x="${x + 1}" y="282" width="14" height="10" rx="4" fill="${spot}" fill-opacity="0.55"/>`
  }
  out += `<g fill="${coat}">${body}${neck}</g>`
  out += `<g clip-path="url(#${id})">${spots}</g>`
  // manen langs baksiden av halsen
  out += `<path d="M174 30L124 196" stroke="${spot}" stroke-width="9" stroke-linecap="round" stroke-dasharray="1 13"/>`
  // hodet
  out += g('transform="rotate(-14 194 20)"',
    `<path d="M182 4L178 -18M196 2L196 -20" stroke="${coat}" stroke-width="6" stroke-linecap="round"/>`,
    `<circle cx="178" cy="-20" r="5.5" fill="${dark}"/><circle cx="196" cy="-22" r="5.5" fill="${dark}"/>`,
    `<ellipse cx="170" cy="12" rx="13" ry="6" fill="${shade(coat, 0.12)}" transform="rotate(-25 170 12)"/>`,
    `<rect x="166" y="2" width="70" height="34" rx="17" fill="${coat}"/>`,
    `<rect x="214" y="12" width="24" height="22" rx="11" fill="${tint(spot, 0.45)}"/>`,
    `<circle cx="196" cy="14" r="4" fill="${dark}"/><circle cx="197.5" cy="12.5" r="1.3" fill="#fff"/>`,
    `<circle cx="228" cy="20" r="2" fill="${dark}"/>`)
  return out
}

/** En seilbåt med vannlinja på y = 360 og mastetoppen på y = 40. */
function sailboat() {
  return `<path d="M100 40L128 48L100 56Z" fill="#fef08a"/>`
    + `<rect x="96" y="38" width="7" height="282" rx="3" fill="#f8fafc"/>`
    + `<path d="M92 56L92 300L10 300Z" fill="#fffaf0"/>`
    + `<path d="M92 112L46 300M92 190L28 300" stroke="#f1dfc4" stroke-width="2"/>`
    + `<path d="M108 74L108 300L188 300Z" fill="#fff" fill-opacity="0.82"/>`
    + `<path d="M6 304H100" stroke="#e2e8f0" stroke-width="6" stroke-linecap="round"/>`
    + `<path d="M0 316L204 316L178 358L26 358Z" fill="#1e3a8a"/>`
    + `<path d="M7 327L197 327" stroke="#fff" stroke-opacity="0.85" stroke-width="5"/>`
    + `<circle cx="60" cy="342" r="5" fill="#93c5fd"/><circle cx="84" cy="342" r="5" fill="#93c5fd"/>`
}

/**
 * Vann: en avrundet stripe som gresset under giraffen, med bølgetopper.
 * Overflaten er på y.
 */
function water(x, y, width) {
  const waves = Math.floor((width - 16) / 40)
  let crest = `M${x + 8} ${y + 6}`
  for (let k = 0; k < waves; k++) crest += 'q10 -10 20 0t20 0'
  const end = x + 8 + waves * 40
  return `<path d="${crest}V${y + 20}H${x + 8}Z" fill="#38bdf8"/>`
    + `<rect x="${x}" y="${y + 4}" width="${end - x + 8}" height="22" rx="11" fill="#38bdf8"/>`
    + `<path d="${crest}" fill="none" stroke="#e0f2fe" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
}

function ruler(x, top, bottom, width, color, ink) {
  let out = `<rect x="${x}" y="${top}" width="${width}" height="${bottom - top}" rx="8" fill="${color}"/>`
  for (let y = bottom - 20, i = 1; y > top + 6; y -= 20, i++) {
    const long = i % 5 === 0
    out += `<path d="M${x} ${y}H${r1(x + (long ? width * 0.62 : width * 0.36))}" stroke="${ink}" stroke-width="${long ? 3 : 2}" stroke-linecap="round"/>`
  }
  return out
}

function measureChip(label, cx, cy, ink, fill = '#fff') {
  const w = measure(label, FONTS.serifItalic, 30) + 40
  return cardShadow(cx - w / 2, cy - 27, w, 54, 18, 7, 0.2)
    + `<rect x="${r1(cx - w / 2)}" y="${cy - 27}" width="${r1(w)}" height="54" rx="18" fill="${fill}"/>`
    + text(label, FONTS.serifItalic, 30, cx, cy, { fill: ink, anchor: 'middle', middle: true })
}

function proportionArt(lang, game) {
  const ink = shade(game.deep, 0.1)
  const ground = 455
  let out = ''
  // linjalen i midten, og stiplede linjer fra toppen av hver ting bort til den
  out += ruler(250, 60, ground, 30, '#fff7ed', shade(game.bg, 0.3))
  out += `<path d="M58 84H250M280 136H384" stroke="#fff" stroke-width="3" stroke-dasharray="6 7" stroke-opacity="0.9"/>`
  // giraffen ser mot venstre, bort fra linjalen
  out += `<rect x="0" y="${ground - 2}" width="246" height="14" rx="7" fill="#65a30d"/>`
  out += g(`transform="translate(246 ${ground - 360}) scale(-1 1)"`, giraffe('giraffe'))
  // båten på vannet
  out += water(284, ground - 10, 216)
  out += g(`transform="translate(290 ${ground - 356})"`, sailboat())
  out += measureChip(game.known[lang], 162, 46, ink)
  out += measureChip('? m', 430, 100, ink, game.accent)
  return out
}

function proportionGlyph(game) {
  const ground = 432
  return `<rect x="40" y="${ground - 2}" width="300" height="16" rx="8" fill="#65a30d"/>`
    + g(`transform="translate(312 ${ground - 360 * 0.96}) scale(-0.96 0.96)"`, giraffe('giraffe'))
    + ruler(372, 92, ground + 12, 44, '#fff7ed', shade(game.bg, 0.3))
}

// ---- PixelPanic: samme bilde i tre oppløsninger, et gjettefelt og tiden

/** Fargen i punktet (u, v) av et lite landskap med fjell, sol og eng. */
function scene(u, v) {
  const sun = Math.hypot(u - 0.74, v - 0.27) < 0.13
  const ridge = 0.32 + Math.abs(u - 0.42) * 1.15
  if (v > 0.8) return mix('#4ade80', '#15803d', (v - 0.8) / 0.2)
  if (v > ridge && u > -0.1 && u < 0.98) return v < 0.47 ? '#ffffff' : mix('#818cf8', '#4338ca', (v - 0.47) / 0.33)
  if (sun) return '#fde047'
  return mix('#7dd3fc', '#fbcfe8', v / 0.8)
}

function pixelFrame(x, y, size, n, gap) {
  const cell = (size - gap * (n + 1)) / n
  let out = cardShadow(x, y, size, size, size * 0.09, size * 0.04, 0.25)
  out += `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r1(size * 0.09)}" fill="#1a1328"/>`
  for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) {
    const color = scene((col + 0.5) / n, (row + 0.5) / n)
    const px = x + gap + col * (cell + gap), py = y + gap + row * (cell + gap)
    out += n <= 8 ? tile(px, py, cell, cell, color, { depth: n <= 5 ? cell * 0.08 : 0, gloss: n <= 5 }) : `<rect x="${r1(px)}" y="${r1(py)}" width="${r1(cell + 0.6)}" height="${r1(cell + 0.6)}" fill="${color}"/>`
  }
  return out
}

function pixelArt(guess, button, game) {
  const ink = shade(game.deep, 0.1)
  let out = pixelFrame(0, 30, 150, 4, 6) + pixelFrame(175, 30, 150, 8, 3) + pixelFrame(350, 30, 150, 24, 0)
  ;['4×4', '8×8', '24×24'].forEach((label, i) => {
    out += text(label, FONTS.sansSemi, 17, 75 + i * 175, 215, { fill: '#fff', anchor: 'middle', opacity: 0.78 })
  })
  // gjettefeltet
  out += cardShadow(10, 268, 480, 78, 24, 8, 0.2)
  out += `<rect x="10" y="268" width="480" height="78" rx="24" fill="#fff"/>`
  out += text(guess, FONTS.serifItalic, 32, 40, 307, { fill: ink, middle: true })
  const bw = measure(button.toUpperCase(), FONTS.sansBold, 18, 2) + 44
  out += tile(474 - bw, 284, bw, 46, game.bg, { depth: 4 })
  out += text(button.toUpperCase(), FONTS.sansBold, 18, 474 - bw / 2, 307, { fill: '#fff', anchor: 'middle', middle: true, tracking: 2 })
  // tiden som er igjen
  for (let i = 0; i < 6; i++) out += tile(10 + i * 82, 400, 66, 22, i < 4 ? game.accent : '#ffffff', { opacity: i < 4 ? 1 : 0.22, depth: 4, gloss: false })
  return out
}

// ---- EraShuffle: en tidslinje med kort, og ett som flyttes på plass

function eraCard(x, y, w, h, year, event, game, { tilt = 0, lift = false } = {}) {
  const ink = shade(game.deep, 0.05)
  const yearW = h * 1.15
  const size = fit(event, FONTS.serifRegular, w - yearW - 40, 24)
  return g(`transform="rotate(${tilt} ${r1(x + w / 2)} ${r1(y + h / 2)})"`,
    cardShadow(x, y, w, h, 20, lift ? 18 : 8, lift ? 0.3 : 0.18),
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="#fefce8"/>`,
    tile(x + 12, y + 12, yearW, h - 24, year === '?' ? game.accent : game.deep, { depth: 0 }),
    text(year, FONTS.serif, 28, x + 12 + yearW / 2, y + h / 2, { fill: year === '?' ? ink : '#fefce8', anchor: 'middle', middle: true }),
    text(event, FONTS.serifRegular, size, x + yearW + 28, y + h / 2, { fill: ink, middle: true }))
}

function eraArt(events, game) {
  let out = `<path d="M52 40V500" stroke="#fff" stroke-opacity="0.35" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 12"/>`
  const rows = [['1492', events[0], 40], ['1969', events[1], 160], ['1994', events[3], 400]]
  for (const [year, event, y] of rows) {
    out += `<circle cx="52" cy="${y + 46}" r="11" fill="${game.accent}" stroke="${game.deep}" stroke-width="4"/>`
    out += eraCard(86, y, 400, 92, year, event, game)
  }
  // den tomme plassen, og kortet som er på vei inn i den
  out += `<rect x="86" y="280" width="400" height="92" rx="20" fill="none" stroke="#fff" stroke-opacity="0.45" stroke-width="3" stroke-dasharray="10 10"/>`
  out += eraCard(118, 262, 400, 92, '?', events[2], game, { tilt: -3, lift: true })
  return out
}

function eraGlyph(game) {
  let out = `<path d="M90 96V420" stroke="#fff" stroke-opacity="0.35" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 16"/>`
  for (const [y, year] of [[96, '1492'], [314, '1994']]) {
    out += `<circle cx="90" cy="${y + 50}" r="14" fill="${game.accent}" stroke="${game.deep}" stroke-width="5"/>`
    out += g('', cardShadow(126, y, 300, 100, 24), `<rect x="126" y="${y}" width="300" height="100" rx="24" fill="#fefce8"/>`, tile(140, y + 14, 120, 72, game.deep, { depth: 0 }), text(year, FONTS.serif, 34, 200, y + 50, { fill: '#fefce8', anchor: 'middle', middle: true }), `<rect x="278" y="${y + 38}" width="120" height="24" rx="12" fill="${game.deep}" fill-opacity="0.18"/>`)
  }
  out += g('transform="rotate(-4 290 255)"', cardShadow(150, 205, 300, 100, 24, 18, 0.3), `<rect x="150" y="205" width="300" height="100" rx="24" fill="#fefce8"/>`, tile(164, 219, 120, 72, game.accent, { depth: 0 }), text('?', FONTS.serif, 44, 224, 255, { fill: game.deep, anchor: 'middle', middle: true }), `<rect x="302" y="243" width="120" height="24" rx="12" fill="${game.deep}" fill-opacity="0.18"/>`)
  return out
}

// ---- MelodyRush: en plate, en equalizer av brikker og klippet du har hørt

function vinyl(cx, cy, radius, label) {
  let out = `<circle cx="${cx}" cy="${r1(cy + radius * 0.05)}" r="${radius}" fill="#000" fill-opacity="0.2"/>`
  out += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="#1c1917"/>`
  for (const k of [0.92, 0.82, 0.72, 0.62, 0.52]) out += `<circle cx="${cx}" cy="${cy}" r="${r1(radius * k)}" fill="none" stroke="#fff" stroke-opacity="0.07" stroke-width="2"/>`
  out += `<path d="M${r1(cx - radius * 0.7)} ${r1(cy - radius * 0.45)}A${r1(radius * 0.84)} ${r1(radius * 0.84)} 0 0 1 ${r1(cx - radius * 0.1)} ${r1(cy - radius * 0.83)}" fill="none" stroke="#fff" stroke-opacity="0.22" stroke-width="${r1(radius * 0.05)}" stroke-linecap="round"/>`
  out += `<circle cx="${cx}" cy="${cy}" r="${r1(radius * 0.32)}" fill="${label}"/>`
  out += `<circle cx="${cx}" cy="${cy}" r="${r1(radius * 0.05)}" fill="#fbbf24"/>`
  return out
}

const EQ_COLORS = ['#f472b6', '#e879f9', '#c084fc', '#818cf8', '#38bdf8', '#2dd4bf', '#4ade80', '#a3e635']

function equalizer(x0, baseY, cell, gap, heights) {
  let out = ''
  heights.forEach((h, col) => {
    for (let k = 0; k < h; k++) out += tile(x0 + col * (cell + gap), baseY - (k + 1) * (cell + gap), cell, cell, EQ_COLORS[col % EQ_COLORS.length], { depth: cell * 0.12 })
  })
  return out
}

function melodyArt() {
  let out = vinyl(330, 215, 175, '#ea580c')
  out += equalizer(0, 448, 34, 6, [3, 5, 7, 4, 6, 8])
  // klippet: avspilling, og hvor mye du har hørt
  out += tile(0, 470, 52, 52, '#2b1705', { r: 26, depth: 0, gloss: false })
  out += `<path d="M20 483L37 496L20 509Z" fill="#fbbf24"/>`
  for (let i = 0; i < 6; i++) out += `<rect x="${70 + i * 72}" y="489" width="62" height="14" rx="7" fill="#2b1705" fill-opacity="${i < 2 ? 0.9 : 0.18}"/>`
  return out
}

function melodyGlyph() {
  return vinyl(300, 220, 150, '#ea580c') + equalizer(84, 430, 46, 8, [3, 5, 4])
}

// ---------------------------------------------------------------- bilder

function background(w, h, game, radius = 0) {
  const dots = game.dots ?? '#ffffff'
  return `<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${tint(game.bg, 0.06)}"/><stop offset="1" stop-color="${mix(game.bg, game.deep, 0.62)}"/></linearGradient>
<radialGradient id="glow" cx="0.72" cy="0.42" r="0.55"><stop offset="0" stop-color="#fff" stop-opacity="0.2"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<pattern id="dots" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="18" cy="18" r="2" fill="${dots}" fill-opacity="0.12"/></pattern>
</defs>
<rect width="${w}" height="${h}" rx="${radius}" fill="url(#bg)"/>
<rect width="${w}" height="${h}" rx="${radius}" fill="url(#glow)"/>
<rect width="${w}" height="${h}" rx="${radius}" fill="url(#dots)"/>`
}

function banner(game, lang) {
  const ink = game.ink ?? '#fffaf0'
  const W = 1200, H = 675, left = 72, maxW = 500
  const title = `${game.title.join('')}`
  const genre = game.genre[lang].toUpperCase()

  // to linjer, samme størrelse: den lengste linja bestemmer
  const size = Math.min(fit(game.title[0], FONTS.serif, maxW, 118), fit(game.title[1], FONTS.serifItalic, maxW, 118))
  const tagSize = 25
  const tagLines = wrap(game.tagline[lang], FONTS.sans, tagSize, 440)

  const chipW = measure(genre, FONTS.sansBold, 14, 2.4) + 40
  const blockH = 48 + 26 + size * 0.95 * 2 + 26 + tagLines.length * tagSize * 1.4
  let y = Math.max(150, (H - blockH) / 2 + 26)

  let body = ''
  body += `<rect x="${left}" y="${r1(y)}" width="${r1(chipW)}" height="40" rx="20" fill="none" stroke="${ink}" stroke-opacity="0.4" stroke-width="2"/>`
  body += text(genre, FONTS.sansBold, 14, left + 20, y + 20, { fill: ink, middle: true, tracking: 2.4 })
  y += 40 + 26 + size * 0.78
  body += text(game.title[0], FONTS.serif, size, left - size * 0.03, y, { fill: ink })
  y += size * 0.98
  body += text(game.title[1], FONTS.serifItalic, size, left - size * 0.02, y, { fill: game.accent })
  y += 30 + tagSize
  for (const line of tagLines) {
    body += text(line, FONTS.sans, tagSize, left, y, { fill: ink, opacity: 0.86 })
    y += tagSize * 1.4
  }

  const mark = logoMark(left, 56, 34) + text('SPILLARENA', FONTS.sansBold, 13, left + 48, 73, { fill: ink, middle: true, tracking: 3, opacity: 0.8 })
  const label = `${title} – ${game.tagline[lang]}`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${label}">
<title>${label}</title>
${background(W, H, game)}
${mark}
${body}
<g transform="translate(640 78)">${game.art(lang, game)}</g>
</svg>
`
}

function icon(game) {
  const S = 512
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" role="img" aria-label="${game.title.join('')}">
<title>${game.title.join('')}</title>
${background(S, S, game, 112)}
<rect x="3" y="3" width="${S - 6}" height="${S - 6}" rx="109" fill="none" stroke="#fff" stroke-opacity="0.1" stroke-width="6"/>
${game.glyph(game)}
</svg>
`
}

// ---------------------------------------------------------------- skriv

mkdirSync(join(OUT, 'icons'), { recursive: true })
const manifest = []
for (const game of GAMES) {
  for (const lang of LANGS) writeFileSync(join(OUT, `${game.file}.${lang}.svg`), banner(game, lang))
  writeFileSync(join(OUT, 'icons', `${game.file}.svg`), icon(game))
  manifest.push(game)
}

const imports = manifest.flatMap((game) => [
  ...LANGS.map((lang) => `import ${game.file}${lang === 'no' ? 'No' : 'En'} from '../assets/games/${game.file}.${lang}.svg'`),
  `import ${game.file}Icon from '../assets/games/icons/${game.file}.svg'`,
])
const entries = manifest.map((game) => `    ${game.id}: { banner: { no: ${game.file}No, en: ${game.file}En }, icon: ${game.file}Icon },`)

writeFileSync(join(ROOT, 'src/data/game-art.ts'), `// Laget av scripts/generate-game-art.mjs — kjør \`npm run art\` i stedet for å endre her.
${imports.join('\n')}

export type ArtLanguage = 'no' | 'en'

export type GameArt = {
    /** 1200×675, med tekst på hvert språk. */
    banner: Record<ArtLanguage, string>
    /** 512×512, uten tekst. */
    icon: string
}

/** Bildene til hvert spill, nøklet på spillets id i games.ts. */
export const gameArt: Record<number, GameArt> = {
${entries.join('\n')}
}
`)

console.log(`Skrev ${manifest.length * 3} bilder og src/data/game-art.ts`)
