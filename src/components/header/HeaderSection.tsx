import logo from '../../assets/logo.png'
import { useTranslation } from 'react-i18next'
import SettingsMenu from './SettingsMenu'
import { motion } from 'framer-motion'

export default function HeaderSection() {
    const { t } = useTranslation()

    return (
        <motion.header
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative z-50 flex items-start justify-between gap-6"
        >
            <a href="/" className="group flex items-center gap-5">
                <div className="relative shrink-0">
                    <span
                        aria-hidden="true"
                        className="absolute -inset-2.5 -rotate-6 transition-transform duration-300 group-hover:rotate-0"
                        style={{
                            borderRadius: '42% 58% 55% 45% / 45% 42% 58% 55%',
                            background: 'color-mix(in srgb, var(--accent) 20%, transparent)',
                        }}
                    />
                    <img src={logo} alt={t('common.logoAlt')} className="relative h-14 w-14 rounded-2xl sm:h-16 sm:w-16" />
                </div>
                <div>
                    <h1 className="font-[family-name:var(--font-serif)] text-3xl font-semibold tracking-tight sm:text-4xl">
                        {t('appName')}
                    </h1>
                    <p className="mt-0.5 max-w-md text-sm sm:text-base" style={{ color: 'var(--text-subtle)' }}>
                        {t('headerTitle')}
                    </p>
                </div>
            </a>
            <SettingsMenu />
        </motion.header>
    )
}
