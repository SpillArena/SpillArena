/**
 * Datoer i europeisk format: 18.09.2026.
 *
 * `toLocaleDateString()` uten videre gir formatet til NETTLESEREN, ikke til
 * siden. Samme konto åpnet på en maskin satt til en annen region viste
 * 9/18/2026 — samme dag, men lest feil av alle som forventer dag først, og
 * 03.04. mot 04.03. er ikke til å se forskjell på uten å vite hvilken maskin
 * det stod på.
 *
 * Språkvalget på siden styrer heller ikke: dette er ikke oversettelse, det er
 * ett format for hele nettstedet, og det er dag.måned.år.
 */
const PAD = (n: number) => String(n).padStart(2, '0')

/** `18.09.2026`, eller null når datoen ikke er en dato. */
export function formatDate(value: string | number | Date | null | undefined): string | null {
    if (value === null || value === undefined) return null
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return `${PAD(date.getDate())}.${PAD(date.getMonth() + 1)}.${date.getFullYear()}`
}

/** `18.09.2026, 14:05` — brukes der klokkeslettet betyr noe. */
export function formatDateTime(value: string | number | Date | null | undefined): string | null {
    if (value === null || value === undefined) return null
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return `${formatDate(date)}, ${PAD(date.getHours())}:${PAD(date.getMinutes())}`
}
