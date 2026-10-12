import type { AccountOverview } from '../../account'

export type AvatarChoice = NonNullable<AccountOverview['avatar']>
export const avatarStyles = ['bottts', 'fun-emoji', 'pixel-art'] as const
