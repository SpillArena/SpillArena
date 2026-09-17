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
                        className="w-full max-w-sm rounded-[28px] shadow-2xl"
                        style={{ background: 'var(--surface-card)' }}
                        initial={{ opacity: 0, scale: 0.92, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 16 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b p-6" style={{ borderColor: 'var(--border)' }}>
                            <h2 className="font-[family-name:var(--font-serif)] text-lg font-medium" style={{ color: 'var(--text)' }}>
                                {t('betaWarningTitle')}
                            </h2>
                            <button
                                onClick={onClose}
                                className="transition cursor-pointer"
                                style={{ color: 'var(--text-subtle)' }}
                                aria-label={t('close')}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="mb-4 text-sm" style={{ color: 'var(--text-subtle)' }}>
                                {t('betaWarningMessage', { title: game.title })}
                            </p>
                        </div>
                        <div className="flex gap-3 border-t p-6" style={{ borderColor: 'var(--border)' }}>
                            <button
                                onClick={onClose}
                                className="flex-1 rounded-full border px-4 py-2.5 text-sm font-semibold transition cursor-pointer"
                                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 cursor-pointer"
                                style={{ background: 'var(--accent)' }}
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
