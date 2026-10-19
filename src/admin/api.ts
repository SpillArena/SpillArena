import { getToken, signOut } from '../account'
import type {
    ActionBody,
    ActionResponse,
    AdminErrorCode,
    AdminOverview,
    AdminResult,
    ContactMessage,
    PlayerDetail,
    PlayerFilter,
    PlayerPage,
    PlayerSort,
    TrafficDays,
    TrafficResponse,
} from './types'

/**
 * Kallene adminpanelet gjør mot /api/admin/*.
 *
 * MED PANELETS EGET TEGN, IKKE ØKTENS. Økten ligger i localStorage i tretti
 * dager, der alt som kjører på siden kan lese den. /api/admin/* tar derfor bare
 * imot et tegn som fås med PIN-en (unlockAdmin) og varer et kvarter. Det ligger
 * i variabelen under og ingen andre steder — ikke i localStorage, ikke i
 * sessionStorage — og glemmes når panelet lukkes (lockAdmin). Hvorfor:
 * issueAdminToken i shared/account-server.js.
 *
 * Et avvist admintegn — utløpt, tilbakekalt, eller `pin_required` — låser
 * panelet (onAdminLock), og panelet spør om PIN-en igjen. Det logger IKKE ut:
 * økten kan godt være gyldig selv om kvarteret er over. Er kontoen utestengt,
 * kastes økten, som i src/account/api.ts. 403 `forbidden` — tegnet er godt,
 * men kontoen er ikke (lenger) admin — sendes bare oppover.
 */
const API_BASE = (import.meta.env.VITE_ACCOUNT_API as string | undefined) ?? '/api'
const TIMEOUT_MS = 10000
/** Brukes ikke de siste sekundene: et tegn som går ut underveis, er et bortkastet kall. */
const EXPIRY_MARGIN_MS = 5000

let adminToken: { token: string; expiresAt: number } | null = null
// låser når kvarteret er over, også om ingen trykker på noe: et panel ingen
// lenger kan bruke, skal ikke stå åpent med spillerdata på skjermen
let lockTimer: ReturnType<typeof setTimeout> | undefined
const lockListeners = new Set<() => void>()

/** Om panelet har et admintegn som fortsatt virker. */
export function isAdminUnlocked(): boolean {
    return adminToken !== null && adminToken.expiresAt - EXPIRY_MARGIN_MS > Date.now()
}

/** Varsler når admintegnet er borte og PIN-en må gis på nytt. */
export function onAdminLock(listener: () => void): () => void {
    lockListeners.add(listener)
    return () => {
        lockListeners.delete(listener)
    }
}

function lock(): void {
    clearTimeout(lockTimer)
    adminToken = null
    for (const listener of lockListeners) listener()
}

export type UnlockError =
    | 'bad_pin'
    | 'bad_credentials'
    | 'locked'
    | 'forbidden'
    | 'unauthorized'
    | 'banned'
    | 'service_failed'
    | 'unreachable'

export type UnlockResult = { ok: true } | { ok: false; error: UnlockError; retryAfter?: number }

/** PIN-en på nytt, for et admintegn som varer et kvarter. */
export async function unlockAdmin(pin: string): Promise<UnlockResult> {
    const token = getToken()
    if (!token) return { ok: false, error: 'unauthorized' }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
        const response = await fetch(`${API_BASE}/admin/session`, {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ pin }),
        })
        const body = (await response.json().catch(() => null)) as
            | { token?: unknown; expiresAt?: unknown; error?: unknown; retryAfter?: unknown }
            | null

        if (response.ok && typeof body?.token === 'string' && typeof body.expiresAt === 'number') {
            adminToken = { token: body.token, expiresAt: body.expiresAt }
            clearTimeout(lockTimer)
            lockTimer = setTimeout(lock, Math.max(0, body.expiresAt - EXPIRY_MARGIN_MS - Date.now()))
            return { ok: true }
        }
        const error = typeof body?.error === 'string' ? body.error : 'service_failed'
        // feil PIN er også 401, men da er økten god — bare den skal ikke kastes
        if (response.status === 401 && error !== 'bad_credentials') {
            signOut()
            return { ok: false, error: error === 'banned' ? 'banned' : 'unauthorized' }
        }
        if (error === 'locked') {
            return { ok: false, error, retryAfter: typeof body?.retryAfter === 'number' ? body.retryAfter : undefined }
        }
        const known: UnlockError[] = ['bad_pin', 'bad_credentials', 'forbidden']
        return { ok: false, error: known.includes(error as UnlockError) ? (error as UnlockError) : 'service_failed' }
    } catch {
        return { ok: false, error: 'unreachable' }
    } finally {
        clearTimeout(timer)
    }
}

/**
 * Glemmer admintegnet, og ber tjeneren tilbakekalle det, så det ikke virker
 * resten av kvarteret. Svaret ventes ikke på: panelet er lukket uansett.
 */
export function lockAdmin(): void {
    const current = adminToken
    clearTimeout(lockTimer)
    adminToken = null
    if (!current) return
    void fetch(`${API_BASE}/admin/session`, {
        method: 'DELETE',
        keepalive: true,
        headers: { Authorization: `Bearer ${current.token}` },
    }).catch(() => {
        // utløper av seg selv innen et kvarter
    })
}

async function call<T>(path: string, init: RequestInit = {}): Promise<AdminResult<T>> {
    if (!getToken()) return { ok: false, error: 'unauthorized' }
    if (!adminToken || !isAdminUnlocked()) {
        lock()
        return { ok: false, error: 'pin_required' }
    }
    const token = adminToken.token

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
        const response = await fetch(`${API_BASE}${path}`, {
            ...init,
            signal: controller.signal,
            headers: {
                ...(init.body ? { 'Content-Type': 'application/json' } : {}),
                Authorization: `Bearer ${token}`,
            },
        })
        const body: unknown = await response.json().catch(() => null)
        const error = (body as { error?: unknown } | null)?.error

        if (response.status === 401) {
            if (error === 'banned') {
                signOut()
                return { ok: false, error: 'banned' }
            }
            // admintegnet er utløpt eller tilbakekalt; økten kan være god
            lock()
            return { ok: false, error: 'pin_required' }
        }
        if (response.status === 403 && error === 'pin_required') {
            lock()
            return { ok: false, error: 'pin_required' }
        }
        if (!response.ok) {
            return {
                ok: false,
                error: typeof error === 'string' ? (error as AdminErrorCode) : 'service_failed',
            }
        }
        return { ok: true, data: body as T }
    } catch {
        return { ok: false, error: 'unreachable' }
    } finally {
        clearTimeout(timer)
    }
}

/** `?u=` og ikke en sti — se targetOf i shared/admin-server.js. */
const playerPath = (username: string) => `/admin/player?u=${encodeURIComponent(username)}`

export function fetchOverview(): Promise<AdminResult<AdminOverview>> {
    return call<AdminOverview>('/admin')
}

export function fetchTraffic(days: TrafficDays): Promise<AdminResult<TrafficResponse>> {
    return call<TrafficResponse>(`/admin/traffic?days=${days}`)
}

export function fetchPlayers(options: {
    query: string
    filter: PlayerFilter
    sort: PlayerSort
    offset?: number
}): Promise<AdminResult<PlayerPage>> {
    const params = new URLSearchParams({
        q: options.query.trim(),
        filter: options.filter,
        sort: options.sort,
        offset: String(options.offset ?? 0),
    })
    return call<PlayerPage>(`/admin/players?${params}`)
}

export function fetchPlayer(username: string): Promise<AdminResult<PlayerDetail>> {
    return call<PlayerDetail>(playerPath(username))
}

export function runAction(username: string, body: ActionBody): Promise<AdminResult<ActionResponse>> {
    return call<ActionResponse>(playerPath(username), { method: 'POST', body: JSON.stringify(body) })
}

export function deletePlayer(
    username: string,
    scores: boolean,
): Promise<AdminResult<{ deleted: true }>> {
    return call(playerPath(username), { method: 'DELETE', body: JSON.stringify({ scores }) })
}

export function fetchMessages(): Promise<AdminResult<{ messages: ContactMessage[]; open: number }>> {
    return call('/admin/messages')
}

export function setMessageStatus(id: number, status: 'new' | 'done'): Promise<AdminResult<{ ok: true }>> {
    return call('/admin/messages', { method: 'POST', body: JSON.stringify({ id, status }) })
}

export function deleteMessage(id: number): Promise<AdminResult<{ ok: true }>> {
    return call(`/admin/messages?id=${id}`, { method: 'DELETE' })
}
