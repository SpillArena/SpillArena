import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Monitor, Moon, SlidersHorizontal, Sun, Check } from 'lucide-react'
import { StorageSettings } from '../../ui/SiteShell'
import Dialog from '../../ui/Dialog'
import { SUPPORTED_LANGUAGES } from '../../i18n/i18n'
import { ACCENT_PRESETS, type AccentColor } from '../../context/accent-context'
import { useAccent } from '../../context/useAccent'
import { useTheme } from '../../context/ThemeContext'
import { writePreference } from '../../lib/cookieConsent'

export default function SettingsMenu() {
  const { i18n, t } = useTranslation()
  const { theme, currentTheme, setTheme } = useTheme()
  const { accent, setAccent } = useAccent()
  const [open, setOpen] = useState(false)
  return <>
    <button className="icon-button" type="button" aria-label={t('settingsMenu.settings')} aria-haspopup="dialog" onClick={() => setOpen(true)}><SlidersHorizontal size={20} /></button>
    <Dialog open={open} onClose={() => setOpen(false)} title={t('settingsMenu.settings')}>
      <fieldset><legend>{t('languageSwitcher.section')}</legend><div className="option-row">
        {SUPPORTED_LANGUAGES.map(language => <button className="option" type="button" key={language.code} aria-pressed={i18n.resolvedLanguage === language.code}
          onClick={() => { void i18n.changeLanguage(language.code); writePreference('lang', language.code) }}>{language.label}</button>)}
      </div></fieldset>
      <fieldset><legend>{t('settingsMenu.appearance')}</legend><div className="option-row">
        {([{ value: 'light', Icon: Sun }, { value: 'system', Icon: Monitor }, { value: 'dark', Icon: Moon }] as const).map(({ value, Icon }) =>
          <button type="button" className="option" key={value} aria-pressed={theme === value} onClick={() => setTheme(value)}><Icon size={15} aria-hidden="true" />{t(`theme.${value}`)}</button>)}
      </div><p className="theme-help">{t('lobby.systemHelp')}</p></fieldset>
      <fieldset><legend>{t('settingsMenu.accentColor')}</legend><div className="accent-options" role="group" aria-label={t('settingsMenu.chooseAccent')}>
        {(Object.keys(ACCENT_PRESETS) as AccentColor[]).map(color => <button type="button" className="accent-option" key={color} aria-label={ACCENT_PRESETS[color].label} aria-pressed={accent === color}
          onClick={() => setAccent(color)}><span style={{ background: ACCENT_PRESETS[color][currentTheme] }}>{accent === color && <Check size={15} aria-hidden="true" />}</span></button>)}
      </div></fieldset>
      <StorageSettings language={i18n.language} onManage={() => setOpen(false)} />
    </Dialog>
  </>
}
