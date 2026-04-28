import packageJson from '../../package.json'
import { useTranslation } from 'react-i18next'
import GitHubIcon from '../assets/icons/GitHubIcon'
import portfolioWhiteIcon from '../assets/eb_whte.png'
import portfolioBlackIcon from '../assets/eb_black.png'

interface FooterSectionProps {
    isDark: boolean
}

export default function FooterSection({ isDark }: FooterSectionProps) {
    const { t } = useTranslation()
    const portfolioIcon = isDark ? portfolioWhiteIcon : portfolioBlackIcon
    return (
        <footer className="flex flex-col items-center justify-center gap-4 border-t border-fuchsia-200/40 pt-8 dark:border-fuchsia-900/40">
            <div className="flex items-center gap-3">
                <a
                    href="https://github.com/SpillArena/SpillArena"
                    rel="noopener noreferrer"
                    target="_blank"
                    className="group flex items-center gap-2 rounded-full border border-slate-300/50 bg-white/40 px-3 py-1.5 text-[12px] font-medium text-slate-600 transition-all hover:border-fuchsia-400/60 hover:bg-fuchsia-50/60 dark:border-slate-700/50 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:border-fuchsia-500/60 dark:hover:bg-slate-800/60"
                >
                    <GitHubIcon />
                    <span>GitHub</span>
                </a>
                <a
                    href="https://emilb.no"
                    rel="noopener noreferrer"
                    target="_blank"
                    className="group flex items-center gap-2 rounded-full border border-slate-300/50 bg-white/40 px-3 py-1.5 text-[12px] font-medium text-slate-600 transition-all hover:border-fuchsia-400/60 hover:bg-fuchsia-50/60 dark:border-slate-700/50 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:border-fuchsia-500/60 dark:hover:bg-slate-800/60"
                >
                    <img src={portfolioIcon} alt="Emil Berglund portfolio" className="h-4 w-4" />
                    <span>Portfolio</span>
                </a>
            </div>
            <span className="text-[11px] text-slate-500/60 dark:text-slate-400/60">v{packageJson.version}</span>
            <p className="text-[12px] text-slate-500/50 dark:text-slate-400/50">
                {t('developedBy', { name: 'Emil Berglund' })}
            </p>
        </footer>
    )
}