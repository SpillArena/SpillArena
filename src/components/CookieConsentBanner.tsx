import { useTranslation } from 'react-i18next'
import { ConsentDialog, type ConsentItem } from '../account'
const ITEMS: ConsentItem[] = [{
  no: { title: 'Innstillingene dine', body: 'Språk, tema og farge, så de huskes neste gang du besøker lobbyen.' },
  en: { title: 'Your settings', body: 'Language, theme and color, so they are remembered next time you visit the lobby.' },
}]
export default function CookieConsentBanner() {
  const { i18n } = useTranslation()
  return <ConsentDialog game="SpillArena" language={i18n.language} items={ITEMS} />
}
