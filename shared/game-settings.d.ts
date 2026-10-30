export type Availability = 'available' | 'coming_soon' | 'unavailable'
export type GameSetting = { game: string; title: string; availability: Availability; beta: boolean }
export const GAME_DEFAULTS: GameSetting[]
export const AVAILABILITIES: Availability[]
export function isGameSetting(value: unknown): value is GameSetting
