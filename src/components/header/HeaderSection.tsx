import logo from '../../assets/logo.png'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'
import { ThemeSwitcher } from './ThemeSwitcher'
import { motion } from 'framer-motion'

export default function HeaderSection() {
    const { t } = useTranslation()

    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative z-50 flex items-center justify-between rounded-3xl border border-fuchsia-200/70 bg-white/70 px-6 py-5 shadow-[0_8px_40px_-20px_rgba(0,0,0,0.35)] backdrop-blur-md dark:border-fuchsia-900/60 dark:bg-slate-900/70 sm:px-8 sm:py-6"
        >
            <div className="flex items-center gap-4">
                <img src={logo} alt="SpillArena logo" className="h-16 w-16 rounded-md" />
                <div>
                    <h1 className="text-2xl font-semibold sm:text-3xl md:text-4xl">{t('appName')}</h1>
                    <p className="text-base text-slate-600 dark:text-slate-300 sm:text-lg">{t('headerTitle')}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <ThemeSwitcher />
            </div>
        </motion.header>
    )
}
