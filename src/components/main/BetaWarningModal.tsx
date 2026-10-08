import { useTranslation } from 'react-i18next'
import type { Game } from '../../data/games'
import Dialog from '../../ui/Dialog'

export default function BetaWarningModal({ game, onConfirm, onClose }: { game: Game | null; onConfirm: () => void; onClose: () => void }) {
  const { t } = useTranslation()
  return <Dialog open={game !== null} onClose={onClose} title={t('betaWarningTitle')}>
    <p>{t('betaWarningMessage', { title: game?.title })}</p>
    <div className="dialog-actions"><button type="button" className="button secondary" onClick={onClose}>{t('cancel')}</button><button type="button" className="button primary" onClick={onConfirm}>{t('continue')}</button></div>
  </Dialog>
}
