import { createContext, useContext } from 'react'

export interface PartyMember { name: string; online: boolean }
export interface PartyView { code: string; leader: string; game: string | null; members: PartyMember[] }
export type PartyStatus = 'idle' | 'connecting' | 'open' | 'reconnecting'

export interface PartyApi {
  view: PartyView | null
  status: PartyStatus
  /** A server error code (`not_found`, `party_full`, ...) or `signed_out` / `kicked`; null when there is nothing to show. */
  error: string | null
  isLeader: boolean
  create: () => void
  join: (code: string) => void
  leave: () => void
  /** `null` sends everyone back to the party screen. */
  selectGame: (slug: string | null) => void
  kick: (name: string) => void
  transfer: (name: string) => void
  clearError: () => void
}

export const PartyContext = createContext<PartyApi | null>(null)

export function useParty(): PartyApi {
  const context = useContext(PartyContext)
  if (!context) throw new Error('useParty needs <PartyProvider>')
  return context
}
