import type { AccountOverview } from '../../account'
import type { AvatarOptions } from '../../../shared/avatar-options.js'

export { AVATAR_CUSTOMIZATION } from '../../../shared/avatar-options.js'
export type { AvatarOption } from '../../../shared/avatar-options.js'
export type AvatarChoice = NonNullable<AccountOverview['avatar']> & { options?: AvatarOptions }
export const avatarStyles = ['bottts', 'fun-emoji', 'pixel-art'] as const
export const avatarColors = ['#e8dff5', '#a5d8ff', '#b2f2bb', '#ffec99', '#ffc9c9', '#fcc2d7', '#dee2e6', '#343a40'] as const
