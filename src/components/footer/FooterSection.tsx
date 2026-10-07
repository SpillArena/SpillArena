import { useTranslation } from 'react-i18next'
import { SiteFooter } from '../../ui/SiteShell'
import Changelog from './Changelog'
export default function FooterSection() {
  const { i18n } = useTranslation()
  return <SiteFooter game="SpillArena" language={i18n.language} note={<Changelog />} />
}
