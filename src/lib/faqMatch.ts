/**
 * Finds the FAQ entries that most likely answer what someone is typing.
 *
 * No server and no model: the FAQ is a dozen short entries, so a small
 * weighted word match is enough, and it runs on every keystroke without a
 * network call (and without sending a half-written message anywhere).
 *
 * Three things make it better than plain word matching:
 *  - words are normalised (case, accents, æøå, a crude Norwegian/English
 *    suffix strip), so "kontoen" finds "konto" and "accounts" finds "account"
 *  - synonym groups map words from BOTH languages onto one concept, so
 *    "glemt passord" finds the PIN entry and "remove my account" finds delete
 *  - rarer words count for more (inverse document frequency), so "pin" decides
 *    a match while "my" never does
 */

export interface FaqItem {
    q: string
    a: string
}

export interface FaqMatch {
    item: FaqItem
    index: number
    /** 0–1, the share of the message's meaning the entry covers. */
    score: number
}

const STOP_WORDS = new Set(
    (
        'a an and are as at be but by can do does did for from had has have how i if in into is it its me my of on or our so that the their them then there ' +
        'these they this to was we were what when where which who why will with would you your ' +
        'og i jeg det at en et er som til pa av for med har ikke den de du var kan vil skal meg min mitt mine hva hvor hvordan hvorfor nar hvem om ' +
        'fra eller men ma bli blir ble kunne ville bare ogsa noe noen sa her der vi oss deres dere deg din ditt dine'
    ).split(' '),
)

/** Words that mean the same thing, in both languages. One row = one concept. */
const SYNONYMS: string[][] = [
    ['pin', 'pinkode', 'kode', 'code', 'passord', 'password', 'passkode', 'glemt', 'forgot', 'forgotten', 'gjenopprett', 'recover', 'recovery', 'reset', 'tilbakestill'],
    ['slett', 'delete', 'remove', 'fjern', 'deletion', 'erase', 'avslutt', 'close'],
    ['konto', 'account', 'bruker', 'profil', 'profile', 'login', 'logg', 'logge', 'innlogging', 'sign', 'signin', 'registrer', 'register', 'username', 'brukernavn', 'navn', 'name'],
    ['gratis', 'free', 'betal', 'pay', 'payment', 'pris', 'price', 'cost', 'koster', 'kostnad', 'penger', 'money', 'reklame', 'ads', 'advertising'],
    ['flerspiller', 'multiplayer', 'online', 'nett', 'venn', 'venner', 'friend', 'friends', 'rom', 'room', 'invite', 'inviter', 'lobby'],
    ['bot', 'roboter', 'robot', 'datamaskin', 'computer'],
    ['feil', 'bug', 'error', 'virker', 'funker', 'fungerer', 'works', 'working', 'crash', 'krasj', 'broken', 'odelagt', 'problem', 'issue', 'glitch'],
    ['lagring', 'lagre', 'storage', 'store', 'stored', 'cookie', 'cookies', 'informasjonskapsel', 'samtykke', 'consent', 'nettleser', 'browser', 'husk', 'remember', 'memory'],
    ['personvern', 'privacy', 'data', 'gdpr', 'opplysning', 'personal', 'persondata', 'innsyn', 'access', 'tredjepart'],
    ['xp', 'niva', 'level', 'fremgang', 'progress', 'rekord', 'record', 'poeng', 'score', 'points', 'ledertavle', 'leaderboard', 'tavle', 'ranking', 'topplista'],
    ['sprak', 'language', 'norsk', 'norwegian', 'engelsk', 'english', 'oversett', 'translate'],
    ['mobil', 'mobile', 'telefon', 'phone', 'nettbrett', 'tablet', 'app', 'ios', 'android', 'iphone'],
    ['nedlasting', 'download', 'install', 'installer', 'last'],
    ['kontakt', 'contact', 'support', 'epost', 'email', 'mail', 'hjelp', 'help'],
    ['utestengt', 'banned', 'ban', 'stengt', 'locked', 'sperret', 'blocked', 'lockout'],
]

const CONCEPT = new Map<string, number>()
SYNONYMS.forEach((group, index) => group.forEach((word) => CONCEPT.set(word, index)))

const SUFFIXES = ['ene', 'ane', 'ene', 'ing', 'er', 'en', 'et', 'ed', 'es', 'ly', 's', 'a', 'e']

function fold(text: string): string {
    return text
        .toLowerCase()
        .replace(/æ/g, 'ae')
        .replace(/ø/g, 'o')
        .replace(/å/g, 'a')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
}

function stem(word: string): string {
    if (word.length < 5) return word
    for (const suffix of SUFFIXES) {
        if (word.endsWith(suffix) && word.length - suffix.length >= 3) return word.slice(0, -suffix.length)
    }
    return word
}

/** A word's identity for matching: its concept if it has one, else its stem. */
function key(word: string): string {
    const concept = CONCEPT.get(word) ?? CONCEPT.get(stem(word))
    return concept !== undefined ? `#${concept}` : stem(word)
}

/** The meaningful words of a text, as match keys. */
export function keywords(text: string): string[] {
    return fold(text)
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length > 1 && !STOP_WORDS.has(word))
        .map(key)
}

/** Below this the entry covers too little of the message to be worth showing. */
export const MIN_SCORE = 0.34

/**
 * The entries that best answer `text`, best first. Empty when nothing is close
 * enough: showing a wrong answer is worse than showing none.
 */
export function matchFaq(text: string, items: FaqItem[], limit = 3): FaqMatch[] {
    const wanted = [...new Set(keywords(text))]
    if (wanted.length === 0 || items.length === 0) return []

    const inQuestion = items.map((item) => new Set(keywords(item.q)))
    const inAnswer = items.map((item) => new Set(keywords(item.a)))

    // rarer across the FAQ = more telling. A word the FAQ never uses says
    // nothing about which entry fits, so it counts for a little (a message
    // made of unknown words should not match on its one familiar one), not
    // for as much as a rare known word.
    const idf = (word: string) => {
        const df = items.reduce((n, _, i) => n + (inQuestion[i].has(word) || inAnswer[i].has(word) ? 1 : 0), 0)
        if (df === 0) return 0.25 * Math.log(1 + items.length)
        return Math.log(1 + items.length / (1 + df))
    }
    const weights = wanted.map(idf)
    const total = weights.reduce((sum, w) => sum + w, 0)

    return items
        .map((item, index) => {
            const covered = wanted.reduce((sum, word, i) => {
                if (inQuestion[index].has(word)) return sum + weights[i]
                if (inAnswer[index].has(word)) return sum + weights[i] * 0.5
                return sum
            }, 0)
            return { item, index, score: covered / total }
        })
        .filter((match) => match.score >= MIN_SCORE)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
}
