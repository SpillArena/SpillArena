import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { getToken, hasConsent, onSessionChange, useAccount } from '../account'
import { CODE_ALPHABET, PARTY_CODE, PROTOCOL } from '../../shared/party.js'
import { PartyContext, type PartyApi, type PartyStatus, type PartyView } from './context'

/*
 * Party mode client: one WebSocket to the party's Durable Object (workers/parties) for as long as the player is in a party.
 *
 * Followers have to follow while a game is open, and a game is a different document. So the lobby stays the shell and the
 * game runs in an iframe on top of it (PartyGameFrame); this socket never closes on a game switch.
 *
 * The code is kept in sessionStorage, per tab, so a reload or the brand link rejoins the same seat. The server keeps
 * the seat for a dropped member until the party itself expires.
 */

const STORAGE_KEY = 'spillarena.party'
const FATAL_CLOSE = [4000, 4002, 4003]
const PING_MS = 25_000

/** Without a yes to the storage question the code lives in memory only: the party works, a reload forgets it (like sign-in). */
let memoryCode: string | null = null
const remembered = (): string | null => {
  if (!hasConsent()) return memoryCode
  try {
    const value = window.sessionStorage.getItem(STORAGE_KEY)
    return value && PARTY_CODE.test(value) ? value : null
  } catch { return null }
}
const remember = (code: string | null) => {
  memoryCode = code
  try {
    if (code && hasConsent()) window.sessionStorage.setItem(STORAGE_KEY, code)
    else window.sessionStorage.removeItem(STORAGE_KEY)
  } catch { /* storage blocked: the party still works until the tab reloads */ }
}
const randomCode = () => Array.from(crypto.getRandomValues(new Uint8Array(4)), byte => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('')

export function PartyProvider({ children }: { children: ReactNode }) {
  const { username } = useAccount()
  const [view, setView] = useState<PartyView | null>(null)
  const [status, setStatus] = useState<PartyStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const socket = useRef<WebSocket | null>(null)
  /** Bumped on every connect and teardown, so events from an abandoned socket are ignored. */
  const generation = useRef(0)
  const timers = useRef<{ retry?: number; ping?: number }>({})
  const attempts = useRef(0)
  /** connect calls itself for retries; going through a ref keeps the callback from referring to itself. */
  const again = useRef<(code: string, mode: 'create' | 'join', createTries?: number) => void>(() => undefined)

  const teardown = useCallback(() => {
    generation.current++
    window.clearTimeout(timers.current.retry)
    window.clearInterval(timers.current.ping)
    const old = socket.current
    socket.current = null
    if (old) { old.onopen = old.onmessage = old.onclose = old.onerror = null; try { old.close(1000) } catch { /* already closed */ } }
  }, [])

  const reset = useCallback((reason: string | null) => {
    teardown()
    remember(null)
    setView(null)
    setStatus('idle')
    setError(reason)
  }, [teardown])

  const connect = useCallback((code: string, mode: 'create' | 'join', createTries = 0) => {
    const token = getToken()
    if (!token) { reset('signed_out'); return }
    teardown()
    const mine = ++generation.current
    setStatus(current => (current === 'open' ? 'reconnecting' : 'connecting'))
    setError(null)
    const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${scheme}://${window.location.host}/api/party/${code}?mode=${mode}`, [PROTOCOL, token])
    socket.current = ws
    let lastError: string | null = null

    ws.onopen = () => {
      timers.current.ping = window.setInterval(() => { if (ws.readyState === WebSocket.OPEN) ws.send('ping') }, PING_MS)
    }
    ws.onmessage = event => {
      if (mine !== generation.current || typeof event.data !== 'string') return
      let message: { t?: string; view?: PartyView; code?: string }
      try { message = JSON.parse(event.data) } catch { return }
      if (message.t === 'state' && message.view) {
        attempts.current = 0
        remember(code)
        setView(message.view)
        setStatus('open')
      } else if (message.t === 'error') {
        lastError = message.code ?? 'error'
        // Errors that do not close the socket (a follower trying to pick a game) are only worth showing briefly.
        if (lastError !== 'not_leader') setError(lastError)
      } else if (message.t === 'kicked') {
        lastError = 'kicked'
      }
    }
    ws.onclose = event => {
      if (mine !== generation.current) return
      window.clearInterval(timers.current.ping)
      socket.current = null
      if (FATAL_CLOSE.includes(event.code)) {
        // Two parties can pick the same code. Try a few more before telling the player.
        if (event.code === 4000 && lastError === 'exists' && mode === 'create' && createTries < 3) { again.current(randomCode(), 'create', createTries + 1); return }
        // 4002: another tab took the seat. That tab owns the party now.
        if (event.code === 4002) { teardown(); setView(null); setStatus('idle'); return }
        reset(lastError ?? 'error')
        return
      }
      // Dropped without being told to stop: ask for the seat back with a growing delay.
      setStatus('reconnecting')
      const delay = Math.min(1000 * 2 ** attempts.current++, 15_000)
      timers.current.retry = window.setTimeout(() => again.current(code, 'join'), delay)
    }
  }, [reset, teardown])

  useEffect(() => { again.current = connect }, [connect])

  const send = useCallback((message: object) => {
    const ws = socket.current
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message))
  }, [])

  // Pick up the party after a reload or a trip through the brand link.
  useEffect(() => {
    const code = remembered()
    // Deferred so StrictMode's throwaway first mount never opens a socket.
    const start = code && getToken() ? window.setTimeout(() => connect(code, 'join'), 0) : undefined
    return () => { window.clearTimeout(start); teardown() }
  }, [connect, teardown])

  // Signing out, here or in another tab, ends the seat locally. The server keeps it until the party expires.
  useEffect(() => onSessionChange(session => { if (!session) reset(null) }), [reset])

  const api = useMemo<PartyApi>(() => ({
    view,
    status,
    error,
    isLeader: Boolean(view && username && view.leader.toLowerCase() === username.toLowerCase()),
    create: () => connect(randomCode(), 'create'),
    join: code => {
      const normalized = code.trim().toUpperCase()
      if (!PARTY_CODE.test(normalized)) { setError('bad_code'); return }
      connect(normalized, 'join')
    },
    leave: () => { send({ t: 'leave' }); reset(null) },
    selectGame: slug => send({ t: 'select_game', game: slug }),
    kick: name => send({ t: 'kick', name }),
    transfer: name => send({ t: 'transfer', name }),
    clearError: () => setError(null),
  }), [view, status, error, username, connect, send, reset])

  return <PartyContext.Provider value={api}>{children}</PartyContext.Provider>
}
