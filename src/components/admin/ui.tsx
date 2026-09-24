import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Ban, Lock, ShieldCheck } from 'lucide-react'

/*
 * Småbitene adminpanelet er bygget av. Samme uttrykk som resten av forsiden —
 * CSS-variablene for flater og tekst, rødt og gult bare for tilstand, og aldri
 * farge alene: hvert merke har et ikon og et ord.
 */

type BadgeKind = 'admin' | 'banned' | 'locked'

const BADGE_CLASS: Record<BadgeKind, string> = {
    admin: '',
    banned: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-100',
    locked: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100',
}

const BADGE_ICON: Record<BadgeKind, typeof Ban> = { admin: ShieldCheck, banned: Ban, locked: Lock }

export function Badge({ kind }: { kind: BadgeKind }) {
    const { t } = useTranslation()
    const Icon = BADGE_ICON[kind]
    return (
        <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${BADGE_CLASS[kind]}`}
            style={
                kind === 'admin'
                    ? { background: 'color-mix(in srgb, var(--accent) 16%, transparent)', color: 'var(--text)' }
                    : undefined
            }
        >
            <Icon className="h-3 w-3" aria-hidden="true" />
            {t(`admin.badges.${kind}`)}
        </span>
    )
}

type Variant = 'neutral' | 'danger' | 'primary'

const VARIANT_CLASS: Record<Variant, string> = {
    neutral: 'border hover:shadow-sm',
    danger:
        'border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40',
    primary: 'bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white hover:shadow-md',
}

export function Button({
    variant = 'neutral',
    className = '',
    style,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
    return (
        <button
            type="button"
            {...props}
            className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASS[variant]} ${className}`}
            style={variant === 'neutral' ? { borderColor: 'var(--border)', ...style } : style}
        />
    )
}

/**
 * En knapp som må trykkes to ganger.
 *
 * For handlinger som er for små til et eget skjema, men for store til ett
 * bomklikk: å fjerne en tavle, å gjøre noen til admin. Første trykk bytter
 * teksten til en bekreftelse; står den urørt i fire sekunder, går den tilbake.
 */
export function ConfirmButton({
    children,
    onConfirm,
    variant = 'neutral',
    disabled,
}: {
    children: ReactNode
    onConfirm: () => void
    variant?: Variant
    disabled?: boolean
}) {
    const { t } = useTranslation()
    const [armed, setArmed] = useState(false)
    const timer = useRef<number | undefined>(undefined)

    useEffect(() => () => window.clearTimeout(timer.current), [])

    return (
        <Button
            variant={armed ? 'danger' : variant}
            disabled={disabled}
            onClick={() => {
                window.clearTimeout(timer.current)
                if (armed) {
                    setArmed(false)
                    onConfirm()
                    return
                }
                setArmed(true)
                timer.current = window.setTimeout(() => setArmed(false), 4000)
            }}
        >
            {armed ? t('admin.actions.confirm') : children}
        </Button>
    )
}

export function SectionHeading({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
    return (
        <div className="mb-3 flex items-baseline justify-between gap-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--text-subtle)' }}>
                {children}
            </h3>
            {aside}
        </div>
    )
}

export function ErrorNotice({ children, onRetry }: { children: ReactNode; onRetry?: () => void }) {
    const { t } = useTranslation()
    return (
        <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800 dark:bg-red-900/40 dark:text-red-100"
        >
            <span>{children}</span>
            {onRetry && (
                <button type="button" onClick={onRetry} className="shrink-0 cursor-pointer text-xs font-semibold underline">
                    {t('admin.retry')}
                </button>
            )}
        </div>
    )
}

export function Muted({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <p className={`text-sm ${className}`} style={{ color: 'var(--text-subtle)' }}>
            {children}
        </p>
    )
}

/** Kort med samme flate som resten av panelet. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <div
            className={`rounded-2xl border p-4 ${className}`}
            style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface) 55%, transparent)' }}
        >
            {children}
        </div>
    )
}
