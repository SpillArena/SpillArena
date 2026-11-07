import fleetbot from './fleetbot.json' with { type: 'json' }
import hangbot from './hangbot.json' with { type: 'json' }
import scribblebot from './scribblebot.json' with { type: 'json' }
import atlasmaster from './atlasmaster.json' with { type: 'json' }
import proportionpanic from './proportionpanic.json' with { type: 'json' }
import pixelpanic from './pixelpanic.json' with { type: 'json' }
import erashuffle from './erashuffle.json' with { type: 'json' }
import melodyrush from './melodyrush.json' with { type: 'json' }
import hitline from './hitline.json' with { type: 'json' }
import sipzone from './sipzone.json' with { type: 'json' }
import cracked from './cracked.json' with { type: 'json' }

export type Guide = {
  title: string
  intro: string
  sections: { h: string; p: string[] }[]
  faq: { q: string; a: string }[]
}

/** One long-form guide per game, written per language. */
export const guides: Record<string, { no: Guide; en: Guide }> = {
  fleetbot, hangbot, scribblebot, atlasmaster, proportionpanic, pixelpanic, erashuffle, melodyrush, hitline, sipzone, cracked,
}
