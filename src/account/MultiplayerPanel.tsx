import { useId, useState, type ReactNode } from 'react'
import { openAccountPanel } from './panel'
import { useIdentity } from './identity'

/**
 * One multiplayer chooser for every game.
 *
 * The same two steps everywhere: "Create room" or "Join room". A game with
 * several multiplayer modes lists them under Create — the mode is part of making
 * the room, not a separate entry on the landing page. Both steps need an
 * account (a room's scores belong to someone), so signed out, the buttons open
 * the sign-in panel instead.
 *
 * The game supplies only what differs: its modes, any extra settings
 * (`createExtra`), and what happens next. Colors come from the surrounding
 * text and `--sa-mp-accent`, so it takes on each game's own look.
 */

export interface MultiplayerMode {
    id: string
    title: string
    text?: string
    /** Short fact shown beside the title, e.g. "1 v 1" or "2–8 players". */
    meta?: string
}

export interface MultiplayerPanelProps {
    language: 'no' | 'en'
    /** More than one → shown as a choice under "Create room". */
    modes?: MultiplayerMode[]
    /** A room code from an invite link: opens "Join room" with it filled in. */
    invite?: string
    busy?: boolean
    /** An error from the last attempt, already in the player's language. */
    error?: string | null
    /** Game-specific settings, shown under the modes when creating. */
    createExtra?: ReactNode
    onCreate: (mode: string | undefined) => void
    onJoin: (code: string) => void
}

const ROOM_CODE = /^\d{3}[A-Z]$/

const copy = {
    no: {
        label: 'Flerspiller',
        create: 'Lag rom',
        join: 'Bli med',
        mode: 'Spillmodus',
        createAction: 'Lag rom',
        joinAction: 'Bli med',
        codeLabel: 'Romkode',
        codeHint: 'Tre tall og én bokstav, som 739K.',
        badCode: 'Koden er tre tall og én bokstav, som 739K.',
        signIn: 'Logg inn',
        signInText: 'Flerspiller krever en gratis SpillArena-konto.',
        invited: 'Du er invitert til et rom. Logg inn for å bli med.',
        busy: 'Kobler til …',
    },
    en: {
        label: 'Multiplayer',
        create: 'Create room',
        join: 'Join room',
        mode: 'Game mode',
        createAction: 'Create room',
        joinAction: 'Join room',
        codeLabel: 'Room code',
        codeHint: 'Three digits and one letter, like 739K.',
        badCode: 'A code is three digits and one letter, like 739K.',
        signIn: 'Sign in',
        signInText: 'Multiplayer needs a free SpillArena account.',
        invited: 'You are invited to a room. Sign in to join.',
        busy: 'Connecting …',
    },
} as const

const STYLE = `
.sa-mp { display: flex; flex-direction: column; gap: 14px; font: inherit; color: inherit; }
.sa-mp * { box-sizing: border-box; }
.sa-mp__tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; border-radius: 12px; background: color-mix(in srgb, currentColor 8%, transparent); }
.sa-mp__tab { appearance: none; border: 0; border-radius: 9px; padding: 10px 12px; min-height: 44px; font: inherit; font-weight: 600; color: inherit; background: transparent; cursor: pointer; opacity: .7; }
.sa-mp__tab[aria-selected="true"] { opacity: 1; background: color-mix(in srgb, currentColor 14%, transparent); box-shadow: 0 0 0 1.5px var(--sa-mp-accent, #7c5cd6) inset; }
.sa-mp__label { font-size: .8em; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; opacity: .7; }
.sa-mp__modes { display: grid; gap: 8px; border: 0; margin: 0; padding: 0; min-width: 0; }
.sa-mp__mode { appearance: none; display: grid; gap: 2px; text-align: left; width: 100%; padding: 12px 14px; border-radius: 12px; border: 1px solid color-mix(in srgb, currentColor 22%, transparent); background: transparent; color: inherit; font: inherit; cursor: pointer; }
.sa-mp__mode[aria-checked="true"] { border-color: var(--sa-mp-accent, #7c5cd6); box-shadow: 0 0 0 1px var(--sa-mp-accent, #7c5cd6) inset; background: color-mix(in srgb, var(--sa-mp-accent, #7c5cd6) 10%, transparent); }
.sa-mp__mode-head { display: flex; justify-content: space-between; gap: 12px; font-weight: 600; }
.sa-mp__mode-head small { font-weight: 500; opacity: .65; white-space: nowrap; }
.sa-mp__mode-text { font-size: .88em; opacity: .75; }
.sa-mp__action { appearance: none; border: 0; border-radius: 12px; min-height: 48px; padding: 12px 18px; font: inherit; font-weight: 700; color: var(--sa-mp-on-accent, #fff); background: var(--sa-mp-accent, #7c5cd6); cursor: pointer; width: 100%; }
.sa-mp__action:disabled { opacity: .55; cursor: not-allowed; }
.sa-mp__code { width: 100%; min-height: 48px; padding: 10px 14px; border-radius: 12px; border: 1px solid color-mix(in srgb, currentColor 30%, transparent); background: transparent; color: inherit; font: inherit; font-size: 1.4em; letter-spacing: .3em; text-transform: uppercase; text-align: center; }
.sa-mp__code[aria-invalid="true"] { border-color: #e5484d; }
.sa-mp__hint { margin: 0; font-size: .85em; opacity: .7; }
.sa-mp__hint[data-bad="true"] { color: #e5484d; opacity: 1; }
.sa-mp__notice { margin: 0; padding: 12px 14px; border-radius: 12px; font-size: .92em; background: color-mix(in srgb, var(--sa-mp-accent, #7c5cd6) 12%, transparent); }
.sa-mp__notice button { appearance: none; border: 0; padding: 0; background: none; color: inherit; font: inherit; font-weight: 700; text-decoration: underline; cursor: pointer; }
.sa-mp__error { margin: 0; color: #e5484d; font-size: .9em; }
`

export function MultiplayerPanel({ language, modes = [], invite = '', busy = false, error, createExtra, onCreate, onJoin }: MultiplayerPanelProps) {
    const t = copy[language]
    const signedIn = useIdentity().locked
    const id = useId()
    const [tab, setTab] = useState<'create' | 'join'>(invite ? 'join' : 'create')
    const [mode, setMode] = useState<string | undefined>(modes[0]?.id)
    const [code, setCode] = useState(invite)
    const [invalid, setInvalid] = useState(false)
    const chosen = modes.some((m) => m.id === mode) ? mode : modes[0]?.id

    const create = () => (signedIn ? onCreate(chosen) : openAccountPanel())
    const join = () => {
        if (!signedIn) return openAccountPanel()
        const clean = code.trim().toUpperCase()
        if (!ROOM_CODE.test(clean)) return setInvalid(true)
        onJoin(clean)
    }

    return (
        <div className="sa-mp" aria-label={t.label}>
            <style>{STYLE}</style>
            {!signedIn && (
                <p className="sa-mp__notice" role="status">
                    {invite ? t.invited : t.signInText}{' '}
                    <button type="button" onClick={openAccountPanel}>
                        {t.signIn}
                    </button>
                </p>
            )}
            <div className="sa-mp__tabs" role="tablist" aria-label={t.label}>
                {(['create', 'join'] as const).map((key) => (
                    <button
                        key={key}
                        type="button"
                        role="tab"
                        id={`${id}-${key}`}
                        aria-selected={tab === key}
                        aria-controls={`${id}-panel`}
                        className="sa-mp__tab"
                        onClick={() => setTab(key)}
                    >
                        {t[key]}
                    </button>
                ))}
            </div>
            <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${tab}`} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {tab === 'create' ? (
                    <>
                        {modes.length > 1 && (
                            <fieldset className="sa-mp__modes">
                                <legend className="sa-mp__label" style={{ marginBottom: 8 }}>
                                    {t.mode}
                                </legend>
                                <div role="radiogroup" aria-label={t.mode} style={{ display: 'grid', gap: 8 }}>
                                    {modes.map((m) => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            role="radio"
                                            aria-checked={chosen === m.id}
                                            className="sa-mp__mode"
                                            onClick={() => setMode(m.id)}
                                        >
                                            <span className="sa-mp__mode-head">
                                                {m.title}
                                                {m.meta && <small>{m.meta}</small>}
                                            </span>
                                            {m.text && <span className="sa-mp__mode-text">{m.text}</span>}
                                        </button>
                                    ))}
                                </div>
                            </fieldset>
                        )}
                        {createExtra}
                        <button type="button" className="sa-mp__action" disabled={busy} onClick={create}>
                            {busy ? t.busy : `${t.createAction} →`}
                        </button>
                    </>
                ) : (
                    <form
                        onSubmit={(event) => {
                            event.preventDefault()
                            join()
                        }}
                        noValidate
                        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                    >
                        <label className="sa-mp__label" htmlFor={`${id}-code`}>
                            {t.codeLabel}
                        </label>
                        <input
                            id={`${id}-code`}
                            className="sa-mp__code"
                            autoComplete="off"
                            autoCapitalize="characters"
                            spellCheck={false}
                            maxLength={4}
                            placeholder="739K"
                            aria-invalid={invalid}
                            aria-describedby={`${id}-hint`}
                            value={code}
                            onChange={(event) => {
                                setCode(event.target.value.toUpperCase().replace(/\s/g, ''))
                                setInvalid(false)
                            }}
                        />
                        <p id={`${id}-hint`} className="sa-mp__hint" data-bad={invalid} role={invalid ? 'alert' : undefined}>
                            {invalid ? t.badCode : t.codeHint}
                        </p>
                        <button type="submit" className="sa-mp__action" disabled={busy}>
                            {busy ? t.busy : t.joinAction}
                        </button>
                    </form>
                )}
            </div>
            {error && (
                <p className="sa-mp__error" role="alert">
                    {error}
                </p>
            )}
        </div>
    )
}
