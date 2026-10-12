// A small allowlist shared by the editor and API. Variant names come from
// the installed DiceBear style definitions; tests verify they still match.
export const AVATAR_CUSTOMIZATION = {
  'bottts': {
    variants: {
      eyesVariant: ["bulging","dizzy","eva","frame1","frame2","glow","happy","hearts","robocop","round","roundFrame01","roundFrame02","sensor","shade01"],
      mouthVariant: ["bite","diagram","grill01","grill02","grill03","smile01","smile02","square01","square02"],
      headVariant: ["round01","round02","square01","square02","square03","square04"],
      topVariant: ["antenna","antennaCrooked","bulb01","glowingBulb01","glowingBulb02","horns","lights","pyramid","radar"],
    },
    colors: ["backgroundColor","baseColor"],
  },
  'fun-emoji': {
    variants: {
      eyesVariant: ["closed","closed2","crying","cute","glasses","love","pissed","plain","sad","shades","sleepClose","stars","tearDrop","wink","wink2"],
      mouthVariant: ["cute","drip","faceMask","kissHeart","lilSmile","pissed","plain","sad","shout","shy","sick","smileLol","smileTeeth","tongueOut","wideSmile"],
    },
    colors: ["backgroundColor"],
  },
  'pixel-art': {
    variants: {
      eyesVariant: ["variant01","variant02","variant03","variant04","variant05","variant06","variant07","variant08","variant09","variant10","variant11","variant12"],
      mouthVariant: ["happy01","happy02","happy03","happy04","happy05","happy06","happy07","happy08","happy09","happy10","happy11","happy12","happy13","sad01","sad02","sad03","sad04","sad05","sad06","sad07","sad08","sad09","sad10"],
      hairVariant: ["long01","long02","long03","long04","long05","long06","long07","long08","long09","long10","long11","long12","long13","long14","long15","long16","long17","long18","long19","long20","long21","short01","short02","short03","short04","short05","short06","short07","short08","short09","short10","short11","short12","short13","short14","short15","short16","short17","short18","short19","short20","short21","short22","short23","short24"],
      clothesVariant: ["variant01","variant02","variant03","variant04","variant05","variant06","variant07","variant08","variant09","variant10","variant11","variant12","variant13","variant14","variant15","variant16","variant17","variant18","variant19","variant20","variant21","variant22","variant23"],
    },
    colors: ["backgroundColor","hairColor","skinColor","clothingColor"],
  },
}
