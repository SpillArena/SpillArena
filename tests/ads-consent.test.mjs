import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'rolldown'

/*
 * src/account/ads.ts against a stand-in for the browser and for Google's tag:
 * when our own consent dialog may ask, and what Google's answer does to
 * SpillArena's own one. The module keeps state, so every test imports a fresh
 * copy of the bundle.
 */

const CLIENT = 'ca-pub-1234567890123456'
const bundle = await build({ input: new URL('../src/account/ads.ts', import.meta.url).pathname, write: false, output: { format: 'esm' } })
const file = join(mkdtempSync(join(tmpdir(), 'ads-consent-')), 'ads.mjs')
writeFileSync(file, bundle.output[0].code)
let copy = 0

function browser() {
  const store = new Map()
  const scripts = []
  globalThis.window = globalThis
  globalThis.localStorage = {
    getItem: key => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key),
  }
  globalThis.addEventListener = () => {}
  globalThis.removeEventListener = () => {}
  globalThis.document = {
    createElement: () => {
      const handlers = {}
      return { addEventListener: (type, handler) => { handlers[type] = handler }, fire: type => handlers[type]?.() }
    },
    head: { appendChild: script => scripts.push(script) },
  }
  delete globalThis.googlefc
  delete globalThis.__tcfapi
  return { store, scripts }
}

async function fresh() {
  return import(`${pathToFileURL(file).href}?copy=${copy++}`)
}

/** What Google's tag does once loaded: define __tcfapi, then drain the queue. */
function googleArrives(events) {
  let listener
  globalThis.__tcfapi = (command, version, callback) => {
    assert.equal(command, 'addEventListener')
    assert.equal(version, 2.2)
    listener = callback
  }
  for (const entry of globalThis.googlefc.callbackQueue) entry.CONSENT_API_READY?.()
  for (const data of events) listener(data, true)
}

test('without a publisher id nothing loads and our dialog asks', async () => {
  const { scripts } = browser()
  const ads = await fresh()
  ads.loadAdSense(undefined)
  ads.loadAdSense('  ')
  assert.equal(ads.getAdConsentState(), 'off')
  assert.equal(ads.adsRequested(), false)
  assert.equal(scripts.length, 0)
})

test('a malformed id is refused rather than sent to Google', async (t) => {
  const { scripts } = browser()
  const warn = t.mock.method(console, 'warn', () => {})
  const ads = await fresh()
  ads.loadAdSense('pub-1234567890123456')
  assert.equal(ads.getAdConsentState(), 'off')
  assert.equal(scripts.length, 0)
  assert.equal(warn.mock.callCount(), 1)
})

test('a valid id loads the tag once and makes our dialog wait', async () => {
  const { scripts } = browser()
  const ads = await fresh()
  const seen = []
  ads.onAdConsentStateChange(state => seen.push(state))
  ads.loadAdSense(CLIENT)
  ads.loadAdSense(CLIENT)
  assert.equal(scripts.length, 1)
  assert.equal(scripts[0].src, `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`)
  assert.equal(scripts[0].async, true)
  assert.equal(scripts[0].crossOrigin, 'anonymous')
  assert.equal(ads.adsRequested(), true)
  assert.deepEqual(seen, ['waiting'])
})

test("Google's message takes over, and its yes to device storage answers ours", async () => {
  const { store } = browser()
  const ads = await fresh()
  ads.loadAdSense(CLIENT)
  googleArrives([{ gdprApplies: true, eventStatus: 'cmpuishown' }])
  assert.equal(ads.getAdConsentState(), 'google')
  assert.equal(store.get('cookie-consent'), undefined, 'nothing is decided while the message is open')
  googleArrives([{ gdprApplies: true, eventStatus: 'useractioncomplete', purpose: { consents: { 1: true } } }])
  assert.equal(store.get('cookie-consent'), 'accepted')
})

test('a no to device storage in Google\'s message is a no to ours', async () => {
  const { store } = browser()
  const ads = await fresh()
  ads.loadAdSense(CLIENT)
  googleArrives([{ gdprApplies: true, eventStatus: 'useractioncomplete', purpose: { consents: { 1: false, 2: true } } }])
  assert.equal(store.get('cookie-consent'), 'declined')
})

test('an answer already given to our question is never changed by Google', async () => {
  const { store } = browser()
  store.set('cookie-consent', 'declined')
  const ads = await fresh()
  ads.loadAdSense(CLIENT)
  googleArrives([{ gdprApplies: true, eventStatus: 'tcloaded', purpose: { consents: { 1: true } } }])
  assert.equal(ads.getAdConsentState(), 'google')
  assert.equal(store.get('cookie-consent'), 'declined')
})

test('outside the regions Google asks in, our dialog asks', async () => {
  const { store } = browser()
  const ads = await fresh()
  ads.loadAdSense(CLIENT)
  googleArrives([{ gdprApplies: false, eventStatus: 'tcloaded', purpose: { consents: {} } }])
  assert.equal(ads.getAdConsentState(), 'off')
  assert.equal(store.get('cookie-consent'), undefined)
})

test('a blocked tag hands the question straight back to our dialog', async () => {
  const { scripts } = browser()
  const ads = await fresh()
  ads.loadAdSense(CLIENT)
  scripts[0].fire('error')
  assert.equal(ads.getAdConsentState(), 'off')
})

test('a tag that never answers stops holding our dialog back', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  browser()
  const ads = await fresh()
  ads.loadAdSense(CLIENT)
  t.mock.timers.tick(3999)
  assert.equal(ads.getAdConsentState(), 'waiting')
  t.mock.timers.tick(1)
  assert.equal(ads.getAdConsentState(), 'off')
  // and a message that turns up late after all still takes over
  googleArrives([{ gdprApplies: true, eventStatus: 'cmpuishown' }])
  assert.equal(ads.getAdConsentState(), 'google')
})

test("ad settings reopen Google's message", async () => {
  browser()
  const ads = await fresh()
  ads.loadAdSense(CLIENT)
  let shown = 0
  globalThis.googlefc.showRevocationMessage = () => { shown++ }
  ads.openAdSettings()
  const queued = globalThis.googlefc.callbackQueue.at(-1)
  assert.equal(typeof queued, 'function')
  queued()
  assert.equal(shown, 1)
})
