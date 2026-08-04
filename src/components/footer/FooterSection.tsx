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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.35 }}
            aria-label={t('footer.siteFooterAria')}
        >
            <div className="mx-auto flex w-full max-w-screen-xl flex-col items-center gap-5 rounded-3xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_85%,transparent)] px-6 py-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-md">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                    {t('footer.tagline')}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                    <a
                        href="https://github.com/SpillArena/SpillArena"
                        rel="noopener noreferrer"
                        target="_blank"
                        aria-label={t('footer.githubAria')}
                        className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface-card)_60%,transparent)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                        <Github size={17} />
                        <span>{t('footer.github')}</span>
                    </a>
                    <a
                        href="https://emilb.no"
                        rel="noopener noreferrer"
                        target="_blank"
                        aria-label={t('footer.portfolioAria')}
                        className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface-card)_60%,transparent)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                        <img src={portfolioIcon} alt="" className="h-4 w-4" />
                        <span>{t('footer.portfolio')}</span>
                    </a>
                </div>

                <p className="m-0 flex flex-wrap items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
                    <span
                        aria-hidden="true"
                        className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_12%,transparent)]"
                    />
                    <span className="font-semibold text-[var(--text)]">v{packageJson.version}</span>
                    <span aria-hidden="true" className="text-[var(--text-subtle)]">·</span>
                    <a
                        href="https://github.com/EmilB04"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[var(--accent)] hover:underline"
                    >
                        {t('developedBy', { name: 'Emil Berglund' })}
                    </a>
                </p>

                <Changelog />
            </div>
        </motion.footer>
    )
}
