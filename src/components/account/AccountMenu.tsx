import { User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { fetchAccount } from '../../account'
import Avatar from './Avatar'
import type { AvatarChoice } from './avatar-options'

function AccountPicture({ username }: { username: string }) {
  const [avatar, setAvatar] = useState<AvatarChoice | null>(null)
  useEffect(() => {
    let cancelled = false
    let changed = false
    void fetchAccount().then(result => { if (!cancelled && !changed && result.ok) setAvatar(result.data.avatar ?? null) })
    const update = (event: Event) => {
      const detail = (event as CustomEvent<{ username: string; avatar: AvatarChoice | null }>).detail
      if (detail.username === username) { changed = true; setAvatar(detail.avatar) }
    }
    window.addEventListener('spillarena:avatar-changed', update)
    return () => { cancelled = true; window.removeEventListener('spillarena:avatar-changed', update) }
  }, [username])
  return <Avatar username={username} avatar={avatar} className="header-avatar" />
}

export default function AccountMenu({ username }: { username: string | null }) {
  const { t } = useTranslation()
  return <a className="account-button" href={username ? '#profile' : '#login'} aria-label={username ? `${t('account.yourProfile')}: ${username}` : t('account.signIn')}>
    {username ? <AccountPicture key={username} username={username} /> : <User size={18} aria-hidden="true" />}<span>{username ?? t('account.signIn')}</span>
  </a>
}
