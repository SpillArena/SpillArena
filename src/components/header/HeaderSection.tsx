import logo from '../../assets/logo.png'
import { useTranslation } from 'react-i18next'
import SettingsMenu from './SettingsMenu'
import { motion } from 'framer-motion'

export default function HeaderSection() {
    const { t } = useTranslation()

    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative z-50 flex items-center justify-between rounded-3xl border px-6 py-5 shadow-[0_8px_40px_-20px_rgba(0,0,0,0.35)] backdrop-blur-md sm:px-8 sm:py-6"
            style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface) 80%, transparent)' }}
        >
            <a href="/" className="flex items-center gap-4">
                <img src={logo} alt={t('common.logoAlt')} className="h-16 w-16 rounded-md" />
                <div>
                    <h1 className="text-2xl font-semibold sm:text-3xl md:text-4xl">{t('appName')}</h1>
                    <p className="text-base sm:text-lg" style={{ color: 'var(--text-subtle)' }}>{t('headerTitle')}</p>
                </div>
            </a>
            <div className="flex items-center gap-2">
                <SettingsMenu />
            </div>
        </motion.header>
    )
}
