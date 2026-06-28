import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { Game } from '../../data/games'
import { AnimatePresence, motion } from 'framer-motion'

interface BetaWarningModalProps {
    game: Game | null
    onConfirm: () => void
    onClose: () => void
}

export default function BetaWarningModal({ game, onConfirm, onClose }: BetaWarningModalProps) {
    const { t } = useTranslation()

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onClose])

    return (
        <AnimatePresence>
            {game && (
                <motion.div
                    key="overlay"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="w-full max-w-sm rounded-2xl border border-fuchsia-200/70 bg-white/95 shadow-2xl dark:border-fuchsia-900/60 dark:bg-slate-900/95"
                        initial={{ opacity: 0, scale: 0.92, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 16 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-fuchsia-200/40 p-6 dark:border-fuchsia-900/40">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                {t('betaWarningTitle')}
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                                aria-label={t('close')}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
                                {t('betaWarningMessage', { title: game.title })}
                            </p>
                        </div>
                        <div className="flex gap-3 border-t border-fuchsia-200/40 p-6 dark:border-fuchsia-900/40">
                            <button
                                onClick={onClose}
                                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:shadow-lg dark:from-amber-600 dark:to-orange-600 cursor-pointer"
                            >
                                {t('continue')}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
