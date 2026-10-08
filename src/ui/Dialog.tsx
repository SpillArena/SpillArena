import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function Dialog({ open, onClose, title, eyebrow = 'SpillArena', children, className = '', dismissible = true }: {
  open: boolean; onClose: () => void; title: string; eyebrow?: string; children: ReactNode; className?: string; dismissible?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const { t } = useTranslation()
  useEffect(() => {
    const dialog = ref.current
    dialog?.setAttribute('closedby', dismissible ? 'closerequest' : 'none')
    if (open && !dialog?.open) dialog?.showModal()
    else if (!open && dialog?.open) dialog.close()
  }, [open, dismissible])
  return createPortal(<dialog ref={ref} className={`sa-dialog ${className}`} aria-labelledby={titleId}
    onKeyDown={event => { if (event.key === 'Escape' && !dismissible) { event.preventDefault(); event.stopPropagation() } }}
    onCancel={event => { event.preventDefault(); if (dismissible) onClose() }}
    onClick={event => {
      if (!dismissible || event.target !== event.currentTarget) return
      const rect = event.currentTarget.getBoundingClientRect()
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose()
    }}>
    {dismissible && <button type="button" className="dialog-close icon-button" onClick={onClose} aria-label={t('close')}><X size={18} /></button>}
    <p className="eyebrow">{eyebrow}</p><h2 id={titleId}>{title}</h2>
    {open && children}
  </dialog>, document.body)
}
