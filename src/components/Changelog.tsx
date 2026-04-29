import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { changelog } from '../data/changelog'

export default function Changelog() {
    const [open, setOpen] = useState(false)

    return (
        <div className="mt-3 w-lg max-w-lg">
            <div className="rounded-xl border-l-4 border-l-fuchsia-500 border border-slate-200/60 bg-white/60 p-2 shadow-sm backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/60 dark:border-l-fuchsia-400">
                <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpen((s) => !s)}
                    className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-fuchsia-50/40 dark:text-slate-200 cursor-pointer dark:hover:bg-slate-800/40"
                >
                    <div className="text-left">
                        <div className="text-[13px] font-semibold text-fuchsia-600 dark:text-fuchsia-400">Changelog</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Latest updates - English Only</div>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence initial={false}>
                    {open && (
                        <motion.div
                            key="changelog"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.28, ease: 'easeInOut' }}
                            className="mt-2 px-3 pb-3 overflow-hidden"
                        >
                            {changelog.map((entry) => (
                                <div key={entry.date} className="mb-3 rounded-lg bg-fuchsia-50/30 p-2.5 dark:bg-fuchsia-950/20">
                                    <header className='flex flex-row items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100'>
                                        <p>{entry.title}</p>
                                        <p>•</p>
                                        <p>{entry.date}</p>
                                        <p className="mt-1 inline-block rounded-full bg-fuchsia-100 px-2 py-1 text-[11px] font-semibold text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-200">v{entry.release}</p>
                                    </header>
                                    <ul className="mt-2 list-disc pl-5 text-[13px] text-slate-700 dark:text-slate-200">
                                        {entry.changes.map((c) => (
                                            <li key={c} className="mb-1">{c}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
