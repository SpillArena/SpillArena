export const GAMES: string[]
export const isGame: (id: unknown) => boolean
export const AD_FREE_GAMES: string[]
export const isAdFreeGame: (id: unknown) => boolean
export interface PartyLimits { min: number; max: number }
export const PARTY_LIMITS: Record<string, PartyLimits>
export const partyLimits: (id: unknown) => PartyLimits | null
