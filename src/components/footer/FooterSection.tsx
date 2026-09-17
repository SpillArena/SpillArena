import packageJson from '../../../package.json'
import { useTranslation } from 'react-i18next'
import { Github } from '../../lib/icons'
import portfolioWhiteIcon from '../../assets/icons/eb_whte.png'
import portfolioBlackIcon from '../../assets/icons/eb_black.png'
import Changelog from './Changelog'
import { motion } from 'framer-motion'

interface FooterSectionProps {
    isDark: boolean
}

export default function FooterSection({ isDark }: FooterSectionProps) {
    const { t } = useTranslation()
    const portfolioIcon = isDark ? portfolioWhiteIcon : portfolioBlackIcon

    return (
        <motion.footer
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.35 }}
            aria-label={t('footer.siteFooterAria')}
            className="border-t pt-8"
            style={{ borderColor: 'var(--border)' }}
        >
            <div className="mx-auto flex w-full max-w-screen-xl flex-col items-start gap-6">
                <p className="max-w-md text-sm" style={{ color: 'var(--text-subtle)' }}>
                    {t('footer.tagline')}
                </p>

                <div className="flex flex-wrap items-center gap-3">
                    <a
                        href="https://github.com/SpillArena/SpillArena"
                        rel="noopener noreferrer"
                        target="_blank"
                        aria-label={t('footer.githubAria')}
                        className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                    >
                        <Github size={17} />
                        <span>{t('footer.github')}</span>
                    </a>
                    <a
                        href="https://emilb.no"
                        rel="noopener noreferrer"
                        target="_blank"
                        aria-label={t('footer.portfolioAria')}
                        className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                    >
                        <img src={portfolioIcon} alt="" className="h-4 w-4" />
                        <span>{t('footer.portfolio')}</span>
                    </a>
                </div>

                <p className="m-0 text-sm" style={{ color: 'var(--text-subtle)' }}>
                    <a
                        href="https://github.com/EmilB04"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold hover:text-[var(--accent)] hover:underline"
                        style={{ color: 'var(--text)' }}
                    >
                        {t('developedBy', { name: 'Emil Berglund' })}
                    </a>
                    <span> — v{packageJson.version}</span>
                </p>

                <Changelog />
            </div>
        </motion.footer>
    )
}
