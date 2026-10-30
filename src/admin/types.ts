import type { GameId } from '../account'

/*
 * Formene /api/admin/* svarer med. Denne mappa er IKKE vendret ut til spillene
 * slik src/account/ er — adminpanelet finnes bare på forsiden.
 */

export type AdminErrorCode =
    | 'forbidden'
    | 'pin_required'
    | 'unauthorized'
    | 'banned'
    | 'not_found'
    | 'bad_target'
    | 'bad_body'
    | 'bad_action'
    | 'bad_username'
    | 'name_taken'
    | 'name_reserved'
    | 'name_not_allowed'
    | 'self_action'
    | 'target_is_admin'
    | 'target_banned'
    | 'unknown_game'
    | 'service_failed'
    | 'unreachable'
    | 'bad_period'
    | 'analytics_denied'
    | 'analytics_rate_limited'
    | 'analytics_failed'

export type AdminResult<T> = { ok: true; data: T } | { ok: false; error: AdminErrorCode }

export type TrafficDays = 1 | 7 | 30
export type TrafficResponse = { configured: false } | TrafficData
export interface TrafficData {
    configured: true
    source: 'cloudflare-zone'
    days: TrafficDays
    from: string
    to: string
    fetchedAt: string
    totals: {
        visitors: number
        requests: number
        pageViews: number
        bytes: number
        cachedRequests: number
        threats: number
        clientErrors: number
        serverErrors: number
    }
    daily: { date: string; requests: number; visitors: number }[]
    countries: { country: string; requests: number }[]
    statuses: { status: number; requests: number }[]
    games: { game: GameId; requests: number }[]
}

export interface LogEntry {
    id: number
    at: string
    admin: string
    /**
     * `recover` skrives av spilleren selv, når en kode er brukt til ny PIN.
     * `reset-pin` finnes bare i gamle rader, fra før admin laget engangskoder.
     * `open-panel` skrives når en admin åpner panelet med PIN-en.
     */
    action: AdminAction | 'delete' | 'recover' | 'reset-pin' | 'open-panel' | 'game-settings'
    target: string | null
    details: Record<string, unknown> | null
}

export interface AdminOverview {
    stats: {
        players: number
        activeDay: number
        activeWeek: number
        newWeek: number
        banned: number
        admins: number
        locked: number
    }
    games: { game: GameId; players: number; lastAt: string | null }[]
    log: LogEntry[]
}

export type PlayerFilter = 'all' | 'banned' | 'admins' | 'locked'
export type PlayerSort = 'seen' | 'created' | 'name' | 'xp'

export interface PlayerRow {
    username: string
    admin: boolean
    createdAt: string
    lastSeen: string
    bannedAt: string | null
    locked: boolean
    games: number
    xp: number
}

export interface PlayerPage {
    players: PlayerRow[]
    total: number
    offset: number
    limit: number
}

export interface PlayerAccount {
    username: string
    admin: boolean
    createdAt: string
    lastSeen: string
    failed: number
    lockedUntil: string | null
    /** regnet ut på tjeneren, så klienten slipper å lese klokka under render */
    locked: boolean
    bannedAt: string | null
    banReason: string | null
    bannedBy: string | null
    /** spilleren har en egen gjenopprettingskode */
    hasRecoveryCode: boolean
    /** når en ubrukt engangskode fra admin går ut, eller null */
    resetCodeExpires: string | null
}

export interface BoardSummary {
    game: GameId
    entries: number
    best: number | null
    lastAt: string | null
}

export interface PlayerDetail {
    account: PlayerAccount
    games: Partial<Record<GameId, { progress: unknown; updatedAt: string }>>
    boards: BoardSummary[]
    log: LogEntry[]
}

export type AdminAction =
    | 'ban'
    | 'unban'
    | 'unlock'
    | 'issue-reset-code'
    | 'rename'
    | 'make-admin'
    | 'clear-scores'

export type ActionBody =
    | { action: 'ban'; reason?: string }
    | { action: 'unban' }
    | { action: 'unlock' }
    | { action: 'issue-reset-code' }
    | { action: 'rename'; newUsername: string }
    | { action: 'make-admin' }
    | { action: 'clear-scores'; game: GameId | 'all' }

export interface ActionResponse {
    ok: true
    /** satt etter `rename`: navnet kontoen nå har */
    username?: string
    /** satt etter `clear-scores`: hvor mange tavlerader som ble fjernet */
    removed?: number
    /** satt etter `issue-reset-code`: vises admin én gang, og aldri igjen */
    code?: string
    expiresAt?: string
}

export interface ContactMessage {
    id: number
    createdAt: string
    topic: string
    name: string | null
    email: string
    message: string
    lang: string | null
    username: string | null
    status: 'new' | 'done'
    account?: { username: string; createdAt: string; lastSeen: string } | null
    notificationStatus?: 'unknown' | 'pending' | 'sent' | 'failed' | 'not_configured'
}
