import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'rolldown'

/*
 * src/account/consent.ts: the player can say yes to some parts (session, progress, settings) and no to the rest.
 * A part that is off must never reach the disk, but must keep working in memory for the tab.
 */

const bundle = await build({ input: new URL('../src/account/consent.ts', import.meta.url).pathname, write: false, output: { format: 'esm' } })
const file = join(mkdtempSync(join(tmpdir(), 'consent-parts-')), 'consent.mjs')
writeFileSync(file, bundle.output[0].code)
let copy = 0

function browser(initial = {}) {
  const store = new Map(Object.entries(initial))
  globalThis.window = globalThis
  globalThis.localStorage = {
    getItem: key => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key),
  }
  globalThis.addEventListener = () => {}
  globalThis.removeEventListener = () => {}
  return store
}

const fresh = () => import(`${pathToFileURL(file).href}?copy=${copy++}`)

const PROGRESS = 'spillarena.progress.hangbot'
const THEME = 'theme'

test('keys are sorted into the three parts by name, or as the game says', async () => {
  browser()
  const consent = await fresh()
  assert.equal(consent.partOf('spillarena.session'), 'session')
  assert.equal(consent.partOf(PROGRESS), 'progress')
  assert.equal(consent.partOf('spillarena.progressOwner.hitline'), 'progress')
  assert.equal(consent.partOf('scribblebot_leaderboard'), 'progress')
  assert.equal(consent.partOf('pp:lastDailyPlayed'), 'progress')
  assert.equal(consent.partOf('theme'), 'settings')
  assert.equal(consent.partOf('hitline:volume'), 'settings')
  consent.declareStoredKeys(['odd-key'], 'progress')
  assert.equal(consent.partOf('odd-key'), 'progress')
})

test('a yes to settings only writes settings to the disk', async () => {
  const store = browser()
  const consent = await fresh()
  consent.declareStoredKeys([THEME, PROGRESS])
  consent.setConsentParts(['settings'])
  assert.equal(store.get('cookie-consent'), 'accepted')
  assert.equal(store.get('cookie-consent-parts'), JSON.stringify(['settings']))
  assert.deepEqual(consent.getConsentParts(), ['settings'])
  assert.equal(consent.hasConsent(), false, 'without a part, hasConsent means everything')
  assert.equal(consent.hasConsent('settings'), true)
  assert.equal(consent.hasConsent('progress'), false)
  consent.consentStorage.set(THEME, 'dark')
  consent.consentStorage.set(PROGRESS, '{"xp":5}')
  assert.equal(store.get(THEME), 'dark')
  assert.equal(store.has(PROGRESS), false, 'progress stays off the disk')
  assert.equal(consent.consentStorage.get(PROGRESS), '{"xp":5}', 'but it works for the rest of the tab')
})

test('turning a part on moves what was kept in memory to the disk', async () => {
  const store = browser()
  const consent = await fresh()
  consent.declareStoredKeys([THEME, PROGRESS])
  consent.setConsentParts(['settings'])
  consent.consentStorage.set(PROGRESS, '{"xp":9}')
  consent.setConsentParts(['settings', 'progress'])
  assert.equal(store.get(PROGRESS), '{"xp":9}')
  assert.equal(store.get('cookie-consent-parts'), JSON.stringify(['progress', 'settings']))
})

test('turning a part off wipes its keys from the disk and keeps them for the tab', async () => {
  const store = browser()
  const consent = await fresh()
  consent.declareStoredKeys([THEME, PROGRESS])
  consent.setConsent('accepted')
  consent.consentStorage.set(THEME, 'dark')
  consent.consentStorage.set(PROGRESS, '{"xp":1}')
  consent.setConsentParts(['settings'])
  assert.equal(store.has(PROGRESS), false)
  assert.equal(store.get(THEME), 'dark')
  assert.equal(consent.consentStorage.get(PROGRESS), '{"xp":1}')
})

test('all parts is a plain yes, and no parts is a plain no', async () => {
  const store = browser()
  const consent = await fresh()
  consent.declareStoredKeys([THEME, PROGRESS])
  consent.setConsentParts(['session', 'progress', 'settings'])
  assert.equal(store.get('cookie-consent'), 'accepted')
  assert.equal(store.has('cookie-consent-parts'), false)
  assert.equal(consent.hasConsent(), true)
  consent.consentStorage.set(THEME, 'light')
  consent.setConsentParts([])
  assert.equal(store.get('cookie-consent'), 'declined')
  assert.equal(store.has(THEME), false)
  assert.deepEqual(consent.getConsentParts(), [])
  assert.equal(consent.hasConsent('settings'), false)
})

test('an older yes, saved before parts existed, covers every part', async () => {
  browser({ 'cookie-consent': 'accepted' })
  const consent = await fresh()
  assert.deepEqual(consent.getConsentParts(), ['session', 'progress', 'settings'])
  assert.equal(consent.hasConsent(), true)
})

test('a part that is off when a game starts is cleaned from the disk', async () => {
  const store = browser({ 'cookie-consent': 'accepted', 'cookie-consent-parts': JSON.stringify(['settings']), [PROGRESS]: '{"xp":3}', [THEME]: 'dark' })
  const consent = await fresh()
  consent.declareStoredKeys([THEME, PROGRESS])
  assert.equal(store.has(PROGRESS), false)
  assert.equal(store.get(THEME), 'dark')
})

test('a session is not written to the disk unless the session part is on', async () => {
  const store = browser()
  const consent = await fresh()
  consent.setConsentParts(['settings', 'progress'])
  assert.equal(consent.hasConsent('session'), false)
  assert.equal(store.has('spillarena.session'), false)
})
