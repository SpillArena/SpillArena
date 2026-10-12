import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export type LegalKind = 'privacy' | 'terms' | 'faq'

interface Section { h: string; p: string[] }
interface FaqItem { q: string; a: string }

/** Privacy policy, terms and FAQ. Text lives in the locale files under `legal`. */
export default function LegalPage({ kind }: { kind: LegalKind }) {
  const { t } = useTranslation()
  const sections = kind === 'faq' ? [] : t(`legal.${kind}.sections`, { returnObjects: true }) as Section[]
  const items = kind === 'faq' ? t('legal.faq.items', { returnObjects: true }) as FaqItem[] : []
  return <article className="legal-page">
    <a className="button secondary" href="#"><ArrowLeft size={16} aria-hidden="true" />{t('legal.back')}</a>
    <h1>{t(`legal.${kind}.title`)}</h1>
    <p className="legal-lead">{t(`legal.${kind}.intro`)}</p>
    {kind !== 'faq' && <p className="legal-updated">{t('legal.updated')}</p>}
    {sections.map(section => <section key={section.h}>
      <h2>{section.h}</h2>
      {section.p.map(text => <p key={text}>{text}</p>)}
    </section>)}
    {items.map(item => <section key={item.q}><h2>{item.q}</h2><p>{item.a}</p></section>)}
    <p className="legal-contact"><strong>{t('legal.contactLabel')}.</strong> {t('legal.contact')} <a href="#contact">{t('contact.openForm')}</a> · <a href="mailto:support@spillarena.no">support@spillarena.no</a></p>
  </article>
}
