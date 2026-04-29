import packageJson from '../../package.json'
import { useTranslation } from 'react-i18next'
import GitHubIcon from '../assets/icons/GitHubIcon'
import portfolioWhiteIcon from '../assets/eb_whte.png'
import portfolioBlackIcon from '../assets/eb_black.png'
import Changelog from './Changelog'

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
                    <span>SpillArena - GitHub</span>
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
            <div className='flex flex-row items-center justify-center gap-4'>
                <span className="inline-flex items-center gap-3 rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-fuchsia-700 shadow-sm backdrop-blur dark:border-fuchsia-500/40 dark:bg-slate-800/70 dark:text-fuchsia-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-500 shadow-[0_0_0_4px_rgba(217,70,239,0.12)] dark:bg-fuchsia-300 dark:shadow-[0_0_0_4px_rgba(232,121,249,0.14)]" />
                    <span className="flex items-baseline gap-2">
                        <span className="text-[12px] font-semibold">v{packageJson.version}</span>
                        <a
                            href="https://github.com/EmilB04"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[12px] text-slate-500/70 font-medium hover:underline"
                        >
                            {t('developedBy', { name: 'Emil Berglund' })}
                        </a>
                    </span>
                </span>
            </div>
            <div className="flex items-center justify-center">
                <Changelog />
            </div>
        </footer>
    )
}