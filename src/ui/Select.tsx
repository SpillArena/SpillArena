import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export type SelectOption = { value: string; label: string }

type Placement = { left: number; width: number; maxHeight: number; top?: number; bottom?: number }

const GAP = 6
const EDGE = 12
const MAX_HEIGHT = 280

// Select-only combobox: focus stays on the trigger, options are tracked with aria-activedescendant.
// The menu is position: fixed so scroll containers and dialogs never clip it.
export default function Select({ id, value, options, onChange, disabled = false, className = '', ariaLabel }: {
  id?: string; value: string; options: SelectOption[]; onChange: (value: string) => void
  disabled?: boolean; className?: string; ariaLabel?: string
}) {
  const autoId = useId()
  const baseId = id ?? autoId
  const listId = `${baseId}-list`
  const rootRef = useRef<HTMLSpanElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const typeahead = useRef({ text: '', timer: 0 })
  const [openState, setOpen] = useState(false)
  const open = openState && !disabled
  const [active, setActive] = useState(0)
  const [placement, setPlacement] = useState<Placement | null>(null)
  const selected = Math.max(0, options.findIndex(option => option.value === value))

  const close = useCallback(() => setOpen(false), [])

  const openMenu = (index = selected) => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect || disabled || !options.length) return
    const below = window.innerHeight - rect.bottom - EDGE - GAP
    const above = rect.top - EDGE - GAP
    const wanted = Math.min(options.length * 40 + 8, MAX_HEIGHT)
    const flip = below < Math.min(wanted, 160) && above > below
    setPlacement({
      left: rect.left, width: rect.width, maxHeight: Math.min(MAX_HEIGHT, flip ? above : below),
      ...(flip ? { bottom: window.innerHeight - rect.top + GAP } : { top: rect.bottom + GAP }),
    })
    setActive(index)
    setOpen(true)
  }

  const commit = (index: number) => {
    const option = options[index]
    if (option) onChange(option.value)
    close()
    triggerRef.current?.focus({ preventScroll: true })
  }

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) close() }
    const onScroll = (event: Event) => { if (!listRef.current?.contains(event.target as Node)) close() }
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', close)
    }
  }, [open, close])

  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  useEffect(() => () => window.clearTimeout(typeahead.current.timer), [])

  const find = (character: string) => {
    const state = typeahead.current
    window.clearTimeout(state.timer)
    state.text += character.toLowerCase()
    state.timer = window.setTimeout(() => { state.text = '' }, 600)
    const repeated = state.text.split('').every(letter => letter === state.text[0])
    const query = repeated ? state.text[0] : state.text
    const from = open ? active + (repeated ? 1 : 0) : selected
    for (let step = 0; step < options.length; step++) {
      const index = (from + step) % options.length
      if (options[index].label.toLowerCase().startsWith(query)) return index
    }
    return -1
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || event.altKey || event.ctrlKey || event.metaKey) return
    const last = options.length - 1
    switch (event.key) {
      case 'ArrowDown': case 'ArrowUp': {
        event.preventDefault()
        if (!open) { openMenu(); return }
        setActive(index => Math.min(last, Math.max(0, index + (event.key === 'ArrowDown' ? 1 : -1))))
        return
      }
      case 'Home': case 'End':
        event.preventDefault()
        if (!open) openMenu(event.key === 'Home' ? 0 : last)
        else setActive(event.key === 'Home' ? 0 : last)
        return
      case 'Enter': case ' ':
        event.preventDefault()
        if (open) commit(active)
        else openMenu()
        return
      case 'Escape':
        if (!open) return
        event.preventDefault()
        event.stopPropagation()
        close()
        return
      case 'Tab':
        close()
        return
      default:
        if (event.key.length === 1) {
          const index = find(event.key)
          if (index < 0) return
          event.preventDefault()
          if (open) setActive(index)
          else openMenu(index)
        }
    }
  }

  return <span ref={rootRef} className={`sa-select ${className}`}>
    <button ref={triggerRef} id={baseId} type="button" role="combobox" className="sa-select-trigger"
      aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined} aria-label={ariaLabel}
      aria-activedescendant={open ? `${baseId}-option-${active}` : undefined} disabled={disabled}
      onClick={() => (open ? close() : openMenu())} onKeyDown={onKeyDown} onKeyUp={event => { if (event.key === ' ') event.preventDefault() }}>
      <span className="sa-select-value">{options[selected]?.label}</span>
      <ChevronDown className="sa-select-chevron" size={16} aria-hidden="true" />
    </button>
    {open && placement && <ul ref={listRef} id={listId} role="listbox" tabIndex={-1} className={`sa-select-menu${placement.bottom !== undefined ? ' is-above' : ''}`}
      style={placement}
      // Keep focus on the trigger, and stop clicks reaching a wrapping <label>, which would re-activate the trigger.
      onMouseDown={event => event.preventDefault()} onClick={event => event.preventDefault()}>
      {options.map((option, index) => <li key={option.value} id={`${baseId}-option-${index}`} role="option" aria-selected={index === selected}
        className={`sa-select-option${index === active ? ' is-active' : ''}`} onPointerMove={() => setActive(index)} onClick={() => commit(index)}>
        <span>{option.label}</span>{index === selected && <Check size={16} aria-hidden="true" />}
      </li>)}
    </ul>}
  </span>
}
