import { useTranslation } from 'react-i18next'
import { openConsentDialog } from '../../account'
import logo from '../../assets/logo.svg'
import Changelog from './Changelog'

export default function FooterSection() {
  const { t } = useTranslation()
  return <footer className="site-footer arena-container"><div className="footer-row">
    <a className="footer-brand" href="#"><img src={logo} alt="" width={24} height={24} /><span>SpillArena</span><span className="footer-tagline">{t('lobby.footerTagline')}</span></a>
    <div className="footer-links"><Changelog /><button type="button" onClick={openConsentDialog}>{t('lobby.storage')}</button><a href="https://github.com/SpillArena/SpillArena" target="_blank" rel="noreferrer">GitHub ↗</a></div>
  </div></footer>
}
