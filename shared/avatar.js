export const AVATAR_STYLES = ['bottts', 'fun-emoji', 'pixel-art']

export function validAvatar(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && AVATAR_STYLES.includes(value.style)
    && typeof value.seed === 'string' && /^[a-zA-Z0-9-]{1,64}$/.test(value.seed)
    && Object.keys(value).every(key => key === 'style' || key === 'seed')
}

export function readAvatar(raw) {
  try {
    const value = JSON.parse(raw)
    return validAvatar(value) ? value : null
  } catch { return null }
}
