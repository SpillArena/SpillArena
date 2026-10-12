export type AvatarOption = 'eyesVariant' | 'mouthVariant' | 'headVariant' | 'topVariant' | 'hairVariant' | 'clothesVariant' | 'backgroundColor' | 'baseColor' | 'hairColor' | 'skinColor' | 'clothingColor'
export type AvatarOptions = Partial<Record<AvatarOption, string>>
export const AVATAR_CUSTOMIZATION: Record<'bottts' | 'fun-emoji' | 'pixel-art', {
  variants: Partial<Record<AvatarOption, readonly string[]>>
  colors: readonly AvatarOption[]
}>
