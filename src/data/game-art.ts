// Laget av scripts/generate-game-art.mjs — kjør `npm run art` i stedet for å endre her.
import FleetBotNo from '../assets/games/FleetBot.no.svg'
import FleetBotEn from '../assets/games/FleetBot.en.svg'
import FleetBotIcon from '../assets/games/icons/FleetBot.svg'
import HangBotNo from '../assets/games/HangBot.no.svg'
import HangBotEn from '../assets/games/HangBot.en.svg'
import HangBotIcon from '../assets/games/icons/HangBot.svg'
import ScribbleBotNo from '../assets/games/ScribbleBot.no.svg'
import ScribbleBotEn from '../assets/games/ScribbleBot.en.svg'
import ScribbleBotIcon from '../assets/games/icons/ScribbleBot.svg'
import AtlasMasterNo from '../assets/games/AtlasMaster.no.svg'
import AtlasMasterEn from '../assets/games/AtlasMaster.en.svg'
import AtlasMasterIcon from '../assets/games/icons/AtlasMaster.svg'
import ProportionPanicNo from '../assets/games/ProportionPanic.no.svg'
import ProportionPanicEn from '../assets/games/ProportionPanic.en.svg'
import ProportionPanicIcon from '../assets/games/icons/ProportionPanic.svg'
import PixelPanicNo from '../assets/games/PixelPanic.no.svg'
import PixelPanicEn from '../assets/games/PixelPanic.en.svg'
import PixelPanicIcon from '../assets/games/icons/PixelPanic.svg'
import EraShuffleNo from '../assets/games/EraShuffle.no.svg'
import EraShuffleEn from '../assets/games/EraShuffle.en.svg'
import EraShuffleIcon from '../assets/games/icons/EraShuffle.svg'
import MelodyRushNo from '../assets/games/MelodyRush.no.svg'
import MelodyRushEn from '../assets/games/MelodyRush.en.svg'
import MelodyRushIcon from '../assets/games/icons/MelodyRush.svg'
import HitlineNo from '../assets/games/Hitline.no.svg'
import HitlineEn from '../assets/games/Hitline.en.svg'
import HitlineIcon from '../assets/games/icons/Hitline.svg'

export type ArtLanguage = 'no' | 'en'

export type GameArt = {
    /** 1200×675, med tekst på hvert språk. */
    banner: Record<ArtLanguage, string>
    /** 512×512, uten tekst. */
    icon: string
}

/** Bildene til hvert spill, nøklet på spillets id i games.ts. */
export const gameArt: Record<number, GameArt> = {
    1: { banner: { no: FleetBotNo, en: FleetBotEn }, icon: FleetBotIcon },
    2: { banner: { no: HangBotNo, en: HangBotEn }, icon: HangBotIcon },
    3: { banner: { no: ScribbleBotNo, en: ScribbleBotEn }, icon: ScribbleBotIcon },
    4: { banner: { no: AtlasMasterNo, en: AtlasMasterEn }, icon: AtlasMasterIcon },
    5: { banner: { no: ProportionPanicNo, en: ProportionPanicEn }, icon: ProportionPanicIcon },
    6: { banner: { no: PixelPanicNo, en: PixelPanicEn }, icon: PixelPanicIcon },
    7: { banner: { no: EraShuffleNo, en: EraShuffleEn }, icon: EraShuffleIcon },
    8: { banner: { no: MelodyRushNo, en: MelodyRushEn }, icon: MelodyRushIcon },
    9: { banner: { no: HitlineNo, en: HitlineEn }, icon: HitlineIcon },
}
