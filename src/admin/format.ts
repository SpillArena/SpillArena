import type { TFunction } from 'i18next'
import type { GameId } from '../account'
import { GAME_TITLES } from '../data/games'
import type { AdminErrorCode } from './types'

/** Feilkoden som en setning. Ukjente koder får den generelle feilmeldingen. */
export function errorText(t: TFunction, code: AdminErrorCode | string): string {
    return t(`admin.errors.${code}`, { defaultValue: t('admin.errors.service_failed') })
}

/** 12 345 på norsk, 12,345 på engelsk — tall i panelet følger språket på siden. */
export function formatNumber(value: number, language: string): string {
    return new Intl.NumberFormat(language === 'no' ? 'nb-NO' : 'en-GB').format(value)
}

export const gameTitle = (game: string): string => GAME_TITLES[game as GameId] ?? game

/** Spillene i samme rekkefølge overalt i panelet. */
export const GAME_IDS = Object.keys(GAME_TITLES) as GameId[]
