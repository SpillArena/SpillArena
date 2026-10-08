import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { changelog } from '../../data/changelog'
import { version } from '../../../package.json'
import Dialog from '../../ui/Dialog'

export default function Changelog() {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()
  return <>
    <button type="button" onClick={() => setOpen(true)}>Changelog</button><span className="version-label" aria-label={`${t('lobby.versionLabel')} ${version}`}>v{version}</span>
    <Dialog open={open} onClose={() => setOpen(false)} title="Changelog" eyebrow={`SpillArena · v${version}`} className="changelog-dialog">
      <p>{t('lobby.changelogIntro')}</p><ol className="release-list">{changelog.map(entry => <li key={entry.release}>
        <div className="release-meta"><strong>v{entry.release}</strong><time dateTime={entry.date.split('-').reverse().join('-')}>{entry.date.replaceAll('-', '.')}</time></div>
        <h3>{entry.title}</h3><ul>{entry.changes.map(change => <li key={change}>{change}</li>)}</ul>
      </li>)}</ol>
    </Dialog>
  </>
}
