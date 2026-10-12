/**
 * Profilbildet som bilde — så hvert spill kan vise det uten å bære DiceBear.
 *
 * GET /api/avatar?style=bottts&seed=abc&o={"eyesVariant":"happy"} → image/svg+xml
 *
 * Tilstandsløs og offentlig: hele bildet er bestemt av parameterne, de valideres
 * mot samme tillatelsesliste som lagringen (shared/avatar.js), og svaret kan
 * caches for alltid.
 *
 * GET /api/avatar?u=<brukernavn> → samme bilde, slått opp på navnet. Det er det
 * rommene bruker for å vise medspillere: navnet står allerede på tavla og i
 * rommet, og bildet er det spilleren selv har valgt å vise fram. Har kontoen
 * ikke valgt noe, er svaret 404, og klienten tegner initialen i stedet. Svaret
 * caches kort, så et nytt bilde når rommene i løpet av minutter.
 */

import { Avatar, Style } from '@dicebear/core'
import definitions from '../../shared/avatar-styles.cjs'
import { readAvatar, validAvatar } from '../../shared/avatar.js'
import { validateUsername } from '../../shared/account-server.js'

const styles = Object.fromEntries(Object.entries(definitions).map(([name, definition]) => [name, new Style(definition)]))

async function byUsername({ env }, username) {
  if (validateUsername(username) !== null || !env.DB) return new Response('no avatar', { status: 404 })
  try {
    const row = await env.DB.prepare('SELECT avatar FROM players WHERE username = ?').bind(username).first()
    const avatar = readAvatar(row?.avatar)
    if (!avatar) return new Response('no avatar', { status: 404, headers: { 'Cache-Control': 'public, max-age=60' } })
    return render(avatar, 300)
  } catch { return new Response('unavailable', { status: 503 }) }
}

function render(avatar, maxAge) {
  const svg = new Avatar(styles[avatar.style], { ...avatar.options, seed: avatar.seed, size: 128 }).toString()
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': `public, max-age=${maxAge}${maxAge > 3600 ? ', immutable' : ''}`,
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

export async function onRequestGet(context) {
  const { request } = context
  const params = new URL(request.url).searchParams
  if (params.has('u')) return byUsername(context, params.get('u'))
  let options
  const raw = params.get('o')
  if (raw !== null) {
    if (raw.length > 512) return new Response('bad avatar', { status: 400 })
    try { options = JSON.parse(raw) } catch { return new Response('bad avatar', { status: 400 }) }
  }
  const avatar = { style: params.get('style'), seed: params.get('seed'), ...(options === undefined ? {} : { options }) }
  if (!validAvatar(avatar)) return new Response('bad avatar', { status: 400 })

  return render(avatar, 31536000)
}
