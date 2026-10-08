import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { gameIcon, games, type Game } from '../../data/games'
import './spotlight.css'

/*
 * Søk i spillene, i stil med Spotlight: en knapp i navigasjonen, ⌘K / Ctrl K
 * eller / fra hvor som helst på siden, et felt øverst på skjermen og treff som
 * kan velges med piltastene.
 *
 * Søket leter i tittel, kategori og beskrivelser på BEGGE språk. Den som har
 * siden på norsk og skriver «hangman» eller «battleship», skal fortsatt finne
 * spillet.
 */

const LANGUAGES = ['no', 'en'] as const

/*
 * Ord folk søker med som ikke står i beskrivelsene: det klassiske navnet på
 * spillet og sjangeren. Samme ord som `keywords` i index.html. Nøklet på
 * spillets id.
 */
const KEYWORDS: Record<number, string> = {
  1: 'battleship senk slagskipet skip sjø strategi bot',
  2: 'hangman galgen ord gjett bokstaver ordspill bot',
  3: 'pictionary scribbl skribbl tegn tegning gjett bot',
  4: 'quiz geografi kart land hovedstad hovedsteder fylker byer elver fjell europa asia afrika usa norge geography',
  5: 'quiz størrelse estimering skala mål size estimate',
  6: 'quiz bilde bildequiz film filmer spill sted dyr flagg piksler picture',
  7: 'quiz historie tidslinje årstall hendelser history timeline',
  8: 'quiz musikk sang sanger låt låter lydklipp spilleliste tiår music song',
}

/** Små bokstaver uten aksenter, så «ERA» finner «Era» og «e» finner «é». */
const normalize = (text: string) => text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')

const isMac = () => typeof navigator !== 'undefined' && /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent)

/** En tast som skal skrives, ikke fanges: inne i et felt, eller i en annen dialog. */
function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

export default function SpotlightSearch({ onSelect }: { onSelect: (game: Game) => void }) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const id = useId()
  const shortcut = isMac() ? '⌘K' : 'Ctrl K'

  /** Det søkbare for hvert spill, regnet ut én gang per språkbytte. */
  const index = useMemo(() => games.filter(game => !game.disabled).map(game => {
    const fields = LANGUAGES.flatMap(lng => {
      const fixed = i18n.getFixedT(lng)
      return [fixed(`lobby.categories.${game.category}`), fixed(`lobby.descriptions.${game.id}`), fixed(game.descriptionKey)]
    })
    return { game, title: normalize(game.title), text: normalize([...fields, KEYWORDS[game.id] ?? ''].join(' ')) }
  }), [i18n])

  const results = useMemo(() => {
    const words = normalize(query).split(/\s+/).filter(Boolean)
    if (!words.length) return index.map(entry => entry.game)
    return index
      .filter(entry => words.every(word => entry.title.includes(word) || entry.text.includes(word)))
      // tittel først: «pix» skal gi Pixel Panic øverst, ikke et spill som nevner piksler
      .map(entry => ({ game: entry.game, score: entry.title.startsWith(words[0]) ? 0 : entry.title.includes(words[0]) ? 1 : 2 }))
      .sort((a, b) => a.score - b.score)
      .map(entry => entry.game)
  }, [index, query])

  const close = () => {
    setOpen(false)
    setQuery('')
    setActive(0)
  }

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      const combo = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
      const slash = event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !isTyping(event.target)
      if (!combo && !slash) return
      // en annen dialog er åpen: ikke legg søket oppå den
      if (!open && document.querySelector('dialog[open]')) return
      event.preventDefault()
      // ⌘K igjen lukker, som i Spotlight
      if (open) close()
      else setOpen(true)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      inputRef.current?.focus()
    } else if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const choose = (game: Game | undefined) => {
    if (!game) return
    close()
    onSelect(game)
  }

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!results.length) return
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive(current => (current + step + results.length) % results.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      choose(results[active])
    }
  }

  const optionId = (index: number) => `${id}-option-${index}`

  return <>
    <button type="button" className="spotlight-trigger" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-keyshortcuts={isMac() ? 'Meta+K' : 'Control+K'}>
      <Search size={17} aria-hidden="true" />
      <span className="spotlight-trigger-label">{t('lobby.search.trigger')}</span>
      <kbd aria-hidden="true">{shortcut}</kbd>
    </button>

    {createPortal(<dialog ref={dialogRef} className="spotlight" aria-label={t('lobby.search.label')}
      onCancel={event => { event.preventDefault(); close() }}
      onClick={event => { if (event.target === event.currentTarget) close() }}>
      <div className="spotlight-field">
        <Search size={20} aria-hidden="true" />
        <input ref={inputRef} type="search" value={query} placeholder={t('lobby.search.placeholder')}
          role="combobox" aria-expanded="true" aria-controls={`${id}-list`} aria-autocomplete="list"
          aria-activedescendant={results.length ? optionId(active) : undefined} aria-label={t('lobby.search.label')}
          autoComplete="off" spellCheck={false} enterKeyHint="go"
          onChange={event => { setQuery(event.target.value); setActive(0) }} onKeyDown={onInputKeyDown} />
        <kbd className="spotlight-esc" aria-hidden="true">Esc</kbd>
        {/* uten tastatur er det ingen Esc å trykke */}
        <button type="button" className="spotlight-cancel" onClick={close}>{t('lobby.close')}</button>
      </div>

      <p className="sr-only" role="status" aria-live="polite">{t('lobby.search.results', { count: results.length })}</p>

      {results.length ? <ul ref={listRef} className="spotlight-results" id={`${id}-list`} role="listbox" aria-label={t('lobby.search.label')}>
        {results.map((game, index) => <li key={game.id} id={optionId(index)} data-index={index} role="option" aria-selected={index === active}
          className="spotlight-result" onMouseMove={() => setActive(index)} onClick={() => choose(game)}>
          <img src={gameIcon(game)} alt="" width={44} height={44} />
          <span className="spotlight-copy">
            <span className="spotlight-title">{game.title}{game.beta && <span className="spotlight-badge">{t('betaLabel')}</span>}</span>
            <span className="spotlight-meta">{t(`lobby.categories.${game.category}`)} · {t(`lobby.descriptions.${game.id}`)}</span>
          </span>
          <ArrowUpRight className="spotlight-arrow" size={18} aria-hidden="true" />
        </li>)}
      </ul> : <div className="spotlight-empty">
        <p>{t('lobby.search.empty', { query: query.trim() })}</p>
        <a className="button text-button" href="#games" onClick={close}>{t('lobby.search.showAll')}</a>
      </div>}

      <div className="spotlight-hints" aria-hidden="true">
        <span><kbd>↑</kbd><kbd>↓</kbd> {t('lobby.search.hintNavigate')}</span>
        <span><kbd>↵</kbd> {t('lobby.search.hintOpen')}</span>
        <span><kbd>Esc</kbd> {t('lobby.search.hintClose')}</span>
      </div>
    </dialog>, document.body)}
  </>
}
