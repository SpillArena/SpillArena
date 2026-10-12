import { AVATAR_CUSTOMIZATION } from './avatar-options.js'

export const AVATAR_STYLES = Object.keys(AVATAR_CUSTOMIZATION)

function validOptions(style, options) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) return false
  const { variants, colors } = AVATAR_CUSTOMIZATION[style]
  return Object.entries(options).every(([key, value]) => typeof value === 'string' && (
    colors.includes(key) ? /^#[0-9a-fA-F]{6}$/.test(value)
      : Object.hasOwn(variants, key) && variants[key].includes(value)
  ))
}

export function validAvatar(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && AVATAR_STYLES.includes(value.style)
    && typeof value.seed === 'string' && /^[a-zA-Z0-9-]{1,64}$/.test(value.seed)
    && Object.keys(value).every(key => key === 'style' || key === 'seed' || key === 'options')
    && (!Object.hasOwn(value, 'options') || validOptions(value.style, value.options))
}

export function readAvatar(raw) {
  try {
    const value = JSON.parse(raw)
    return validAvatar(value) ? value : null
  } catch { return null }
}
