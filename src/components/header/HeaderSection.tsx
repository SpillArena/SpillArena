import logo from '../../assets/logo.svg'
import { useTranslation } from 'react-i18next'
import { SiteHeader } from '../../ui/SiteShell'
import SettingsMenu from './SettingsMenu'
import AccountMenu from '../account/AccountMenu'
export default function HeaderSection() {
  const { i18n } = useTranslation()
  return <SiteHeader name="SpillArena" logo={logo} language={i18n.language}><AccountMenu /><SettingsMenu /></SiteHeader>
}
