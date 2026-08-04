import { useState } from 'react'
import { ChevronDown, History } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { changelog } from '../../data/changelog'

export default function Changelog() {
    const [open, setOpen] = useState(false)
    const latestVersion = changelog[0]?.release

    return (
        <div className="w-full max-w-2xl text-left">
            <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpen((s) => !s)}
                className="pp-dropdown-trigger group flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_92%,#000_8%)] px-4 py-3 text-left shadow-[0_8px_24px_rgba(0,0,0,0.14)] hover:border-[var(--border-hover)] cursor-pointer"
            >
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--accent)]">
                        <History size={16} />
                    </span>
                    <div>
                        <div className="text-sm font-semibold text-[var(--text)]">
                            Changelog <span className="font-normal text-[var(--text-subtle)]">· v{latestVersion}</span>
                        </div>
                        <div className="text-[11px] text-[var(--text-subtle)]">Latest updates - English only</div>
                    </div>
                </div>
                <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[var(--text-subtle)] transition-transform duration-300 group-hover:text-[var(--text)] ${open ? 'rotate-180' : ''
                        }`}
                />
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="changelog"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.28, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="pp-dropdown-panel pp-scroll mt-2 max-h-96 overflow-y-auto rounded-2xl p-4 sm:p-5">
                            <ol className="relative ml-2 border-l border-[var(--border)]">
                                {changelog.map((entry, index) => {
                                    const isLatest = index === 0
                                    return (
                                        <li key={entry.date} className="relative pb-6 pl-6 last:pb-0">
                                            <span
                                                className={`absolute -left-[7px] top-1 h-3.5 w-3.5 rounded-full border-2 ${isLatest
                                                        ? 'border-[var(--accent)] bg-[var(--accent)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_18%,transparent)]'
                                                        : 'border-[var(--border-hover)] bg-[var(--surface)]'
                                                    }`}
                                            />
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-sm font-semibold text-[var(--text)]">{entry.title}</h3>
                                                <span className="rounded-full bg-[color:color-mix(in_srgb,var(--accent)_16%,transparent)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent)]">
                                                    v{entry.release}
                                                </span>
                                                {isLatest && (
                                                    <span className="rounded-full border border-[var(--accent)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--accent)]">
                                                        Latest
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-0.5 text-[11px] text-[var(--text-subtle)]">{entry.date}</p>
                                            <ul className="mt-2 space-y-1.5">
                                                {entry.changes.map((change) => (
                                                    <li key={change} className="flex gap-2 text-[13px] leading-snug text-[var(--text-subtle)]">
                                                        <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[var(--text-subtle)]" />
                                                        <span>{change}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </li>
                                    )
                                })}
                            </ol>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
