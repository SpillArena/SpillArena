import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react'
import { ArrowLeft, CheckCircle2, ChevronDown, Lightbulb, Send } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { CONTACT_LIMITS, TOPICS, checkContact, sendContact, type Topic } from '../../lib/contact'
import { matchFaq, type FaqItem } from '../../lib/faqMatch'

type Phase = 'writing' | 'sending' | 'sent' | 'helped'

/** Shown after this many characters, so the first few words do not flash random answers. */
const SUGGEST_AFTER = 12

export default function ContactForm() {
  const { t, i18n } = useTranslation()
  const ids = { topic: useId(), name: useId(), email: useId(), message: useId() }
  const shownAt = useRef(0)

  const [topic, setTopic] = useState<Topic>('question')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('')
  const [phase, setPhase] = useState<Phase>('writing')
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<number | null>(null)

  const faq = useMemo(() => t('legal.faq.items', { returnObjects: true }) as FaqItem[], [t])
  // matching reads the message as it is typed; deferring keeps typing instant
  const typed = useDeferredValue(message)
  const suggestions = useMemo(
    () => (typed.trim().length >= SUGGEST_AFTER ? matchFaq(typed, faq) : []),
    [typed, faq],
  )

  useEffect(() => { shownAt.current = Date.now() }, [])

  const reset = () => {
    setMessage('')
    setError(null)
    setPhase('writing')
    shownAt.current = Date.now()
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (phase === 'sending') return
    const problem = checkContact({ name, email, message })
    if (problem) { setError(problem); return }
    setError(null)
    setPhase('sending')
    const result = await sendContact({
      topic, name: name.trim(), email: email.trim(), message: message.trim(),
      lang: i18n.resolvedLanguage === 'en' ? 'en' : 'no', website, t: Date.now() - shownAt.current,
    })
    if (result.ok) setPhase('sent')
    else { setError(result.error); setPhase('writing') }
  }

  if (phase === 'sent') return <article className="legal-page contact-page" aria-live="polite">
    <CheckCircle2 size={36} aria-hidden="true" className="contact-ok" />
    <h1>{t('contact.sentTitle')}</h1>
    <p className="legal-lead">{t('contact.sentBody', { email: email.trim() })}</p>
    <div className="contact-actions">
      <a className="button secondary" href="#"><ArrowLeft size={16} aria-hidden="true" />{t('legal.back')}</a>
      <button className="button secondary" type="button" onClick={reset}>{t('contact.sendAnother')}</button>
    </div>
  </article>

  if (phase === 'helped') return <article className="legal-page contact-page" aria-live="polite">
    <Lightbulb size={36} aria-hidden="true" className="contact-ok" />
    <h1>{t('contact.helpedTitle')}</h1>
    <p className="legal-lead">{t('contact.helpedBody')}</p>
    <div className="contact-actions">
      <a className="button secondary" href="#"><ArrowLeft size={16} aria-hidden="true" />{t('legal.back')}</a>
      <button className="button secondary" type="button" onClick={() => setPhase('writing')}>{t('contact.backToForm')}</button>
    </div>
  </article>

  const busy = phase === 'sending'
  const length = message.trim().length
  const errorField = error === 'bad_email' ? ids.email : error === 'bad_name' ? ids.name
    : error === 'message_short' || error === 'message_long' ? ids.message : undefined

  return <article className="legal-page contact-page">
    <a className="button secondary" href="#"><ArrowLeft size={16} aria-hidden="true" />{t('legal.back')}</a>
    <h1>{t('contact.title')}</h1>
    <p className="legal-lead">{t('contact.intro')}</p>

    <form className="sa-form contact-form" onSubmit={submit} noValidate>
      <label htmlFor={ids.topic}>{t('contact.topic')}
        <select id={ids.topic} value={topic} onChange={event => setTopic(event.target.value as Topic)} disabled={busy}>
          {TOPICS.map(value => <option key={value} value={value}>{t(`contact.topics.${value}`)}</option>)}
        </select>
      </label>

      <label htmlFor={ids.message}>{t('contact.message')}
        <textarea id={ids.message} value={message} onChange={event => setMessage(event.target.value)} rows={7}
          maxLength={CONTACT_LIMITS.message + 200} required disabled={busy}
          aria-invalid={errorField === ids.message} aria-describedby={`${ids.message}-hint`} />
        <span id={`${ids.message}-hint`} className="field-hint" aria-live="off">
          {t('contact.messageHint', { count: length, max: CONTACT_LIMITS.message })}
        </span>
      </label>

      {suggestions.length > 0 && <section className="faq-suggest" aria-labelledby={`${ids.topic}-suggest`}>
        <h2 id={`${ids.topic}-suggest`}><Lightbulb size={16} aria-hidden="true" />{t('contact.suggestTitle')}</h2>
        <p className="field-hint">{t('contact.suggestIntro')}</p>
        <ul aria-live="polite">
          {suggestions.map(({ item, index }) => <li key={index}>
            <button type="button" className="faq-suggest-q" aria-expanded={open === index}
              onClick={() => setOpen(open === index ? null : index)}>
              <span>{item.q}</span><ChevronDown size={16} aria-hidden="true" />
            </button>
            {open === index && <div className="faq-suggest-a">
              <p>{item.a}</p>
              <button type="button" className="button secondary" onClick={() => setPhase('helped')}>
                <CheckCircle2 size={16} aria-hidden="true" />{t('contact.helped')}
              </button>
            </div>}
          </li>)}
        </ul>
        <a className="inline-link" href="#faq">{t('contact.allFaq')}</a>
      </section>}

      <label htmlFor={ids.email}>{t('contact.email')}
        <input id={ids.email} type="email" value={email} onChange={event => setEmail(event.target.value)}
          maxLength={CONTACT_LIMITS.email} autoComplete="email" required disabled={busy}
          aria-invalid={errorField === ids.email} aria-describedby={`${ids.email}-hint`} />
        <span id={`${ids.email}-hint`} className="field-hint">{t('contact.emailHint')}</span>
      </label>

      <label htmlFor={ids.name}>{t('contact.name')}
        <input id={ids.name} value={name} onChange={event => setName(event.target.value)}
          maxLength={CONTACT_LIMITS.name + 20} autoComplete="name" disabled={busy}
          aria-invalid={errorField === ids.name} />
      </label>

      {/* honeypot: hidden from people and from assistive tech, irresistible to form-filling bots */}
      <div className="contact-trap" aria-hidden="true">
        <label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={event => setWebsite(event.target.value)} /></label>
      </div>

      {error && <p role="alert" className="form-error">
        {t(`contact.errors.${error}`, { defaultValue: t('contact.errors.service_failed'), min: CONTACT_LIMITS.minMessage, max: CONTACT_LIMITS.message })}
      </p>}

      <p className="field-hint">
        <Trans i18nKey="contact.privacy" components={{ link: <a className="inline-link" href="#privacy" /> }} />
      </p>

      <div className="contact-actions">
        <button className="button primary" type="submit" disabled={busy}>
          <Send size={16} aria-hidden="true" />{busy ? t('contact.sending') : t('contact.send')}
        </button>
        <span className="field-hint">{t('contact.orEmail')} <a className="inline-link" href="mailto:support@spillarena.no">support@spillarena.no</a></span>
      </div>
    </form>
  </article>
}
