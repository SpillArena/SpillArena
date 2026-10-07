import { changelog } from '../../data/changelog'
export default function Changelog() {
  return <details><summary>Changelog · v{changelog[0]?.release}</summary>
    <ol className="mt-3 max-h-72 overflow-y-auto">{changelog.map((entry) => <li key={entry.release} className="mb-4">
      <strong>{entry.title} · v{entry.release}</strong><span> · {entry.date}</span>
      <ul>{entry.changes.map((change) => <li key={change}>{change}</li>)}</ul>
    </li>)}</ol>
  </details>
}
