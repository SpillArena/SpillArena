import { User } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function AccountMenu({ username }: { username: string | null }) {
  const { t } = useTranslation()
  return <a className="account-button" href={username ? '#profile' : '#login'} aria-label={username ? `${t('account.yourProfile')}: ${username}` : t('account.signIn')}>
    <User size={18} aria-hidden="true" /><span>{username ?? t('account.signIn')}</span>
  </a>
}
