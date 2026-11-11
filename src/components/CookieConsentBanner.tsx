import { useTranslation } from 'react-i18next'
import { ConsentDialog, type ConsentItem } from '../account'
const ITEMS: ConsentItem[] = [{
  no: { title: 'Innstillingene dine', body: 'Språk, tema og farge, og om du har skjult tipset om å legge siden på hjem-skjermen, så det huskes neste gang du besøker lobbyen.' },
  en: { title: 'Your settings', body: 'Language, theme and color, and whether you hid the tip about adding the site to your home screen, so they are remembered next time you visit the lobby.' },
}, {
  part: 'session',
  no: { title: 'Selskapet ditt', body: 'Koden til selskapet du er med i, bare i denne fanen, så du kommer tilbake til det hvis du laster siden på nytt.' },
  en: { title: 'Your party', body: 'The code of the party you are in, in this tab only, so you rejoin it if you reload the page.' },
}]
export default function CookieConsentBanner() {
  const { i18n } = useTranslation()
  return <ConsentDialog game="SpillArena" language={i18n.language} items={ITEMS} />
}
