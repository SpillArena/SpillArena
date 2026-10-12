import { Avatar as DiceBearAvatar, Style } from '@dicebear/core'
import bottts from '@dicebear/styles/bottts.json'
import funEmoji from '@dicebear/styles/fun-emoji.json'
import pixelArt from '@dicebear/styles/pixel-art.json'
import type { AvatarChoice } from './avatar-options'

const styles = { bottts: new Style(bottts), 'fun-emoji': new Style(funEmoji), 'pixel-art': new Style(pixelArt) }

export default function DiceBearPicture({ avatar }: { avatar: AvatarChoice }) {
  const src = new DiceBearAvatar(styles[avatar.style], { seed: avatar.seed, size: 128 }).toDataUri()
  return <img src={src} alt="" width={88} height={88} />
}
