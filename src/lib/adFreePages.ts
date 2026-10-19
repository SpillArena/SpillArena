/**
 * Sidene der PIN-en skrives — og derfor aldri reklame.
 *
 * Reklameskriptet kjører på spillarena.no, med samme tilgang til siden som vår
 * egen kode. Et skript som har tilgang til siden, kan også lese det som skrives
 * i den. Innlogging, registrering, glemt PIN og profilsiden (navnebytte,
 * gjenopprettingskode og adminpanelet) lastes derfor uten AdSense-taggen.
 *
 * Kommer spilleren dit fra en side der taggen alt er lastet, lastes siden på
 * nytt (App.tsx), siden et lastet skript ikke kan fjernes. Etterpå er resten
 * av besøket uten reklame, til neste innlasting.
 */
const PIN_PAGES = new Set(['login', 'register', 'recover', 'profile'])

export function isPinPage(href: string = window.location.href): boolean {
  const url = new URL(href)
  return url.searchParams.has('recover') || PIN_PAGES.has(url.hash.slice(1))
}
