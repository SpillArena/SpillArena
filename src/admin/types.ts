import type { GameId } from '../account'

/*
 * Formene /api/admin/* svarer med. Denne mappa er IKKE vendret ut til spillene
 * slik src/account/ er — adminpanelet finnes bare på forsiden.
 */

export type AdminErrorCode =
    | 'forbidden'
    | 'unauthorized'
    | 'banned'
    | 'not_found'
    | 'bad_target'
    | 'bad_body'
    | 'bad_action'
    | 'bad_pin'
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

export type AdminResult<T> = { ok: true; data: T } | { ok: false; error: AdminErrorCode }

export interface LogEntry {
    id: number
    at: string
    admin: string
    action: AdminAction | 'delete'
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
    | 'reset-pin'
    | 'rename'
    | 'make-admin'
    | 'clear-scores'

export type ActionBody =
    | { action: 'ban'; reason?: string }
    | { action: 'unban' }
    | { action: 'unlock' }
    | { action: 'reset-pin'; pin: string }
    | { action: 'rename'; newUsername: string }
    | { action: 'make-admin' }
    | { action: 'clear-scores'; game: GameId | 'all' }

export interface ActionResponse {
    ok: true
    /** satt etter `rename`: navnet kontoen nå har */
    username?: string
    /** satt etter `clear-scores`: hvor mange tavlerader som ble fjernet */
    removed?: number
}
