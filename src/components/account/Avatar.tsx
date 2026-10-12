import { lazy, Suspense } from 'react'
import { avatarStyles, type AvatarChoice } from './avatar-options'
const DiceBearPicture = lazy(() => import('./DiceBearPicture'))

export default function Avatar({ username, avatar, className = '' }: { username: string; avatar?: AvatarChoice | null; className?: string }) {
  const initial = [...username.trim()][0]?.toUpperCase()
  return <span className={`profile-avatar ${className}`} aria-hidden="true">{avatar && avatarStyles.includes(avatar.style) ? <Suspense fallback={initial}><DiceBearPicture avatar={avatar} /></Suspense> : initial}</span>
}
