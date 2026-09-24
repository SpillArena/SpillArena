import { getToken, signOut } from '../account'
import type {
    ActionBody,
    ActionResponse,
    AdminErrorCode,
    AdminOverview,
    AdminResult,
    PlayerDetail,
    PlayerFilter,
    PlayerPage,
    PlayerSort,
} from './types'

/**
 * Kallene adminpanelet gjør mot /api/admin/*.
 *
 * Samme grunnadresse og samme regel for 401 som src/account/api.ts: et avvist
 * tegn betyr at kontoen er borte eller utestengt, og da kastes økten. 403 er
 * noe annet — tegnet er godt, men kontoen er ikke (lenger) admin — og det
 * sendes bare oppover.
 */
const API_BASE = (import.meta.env.VITE_ACCOUNT_API as string | undefined) ?? '/api'
const TIMEOUT_MS = 10000

async function call<T>(path: string, init: RequestInit = {}): Promise<AdminResult<T>> {
    const token = getToken()
    if (!token) return { ok: false, error: 'unauthorized' }

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
            signOut()
            return { ok: false, error: error === 'banned' ? 'banned' : 'unauthorized' }
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
