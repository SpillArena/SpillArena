// Static JSON requires work in both the Pages Wrangler 3 bundler and Node's
// API tests, without import attributes or duplicated artwork definitions.
module.exports = {
  bottts: require('@dicebear/styles/bottts.json'),
  'fun-emoji': require('@dicebear/styles/fun-emoji.json'),
  'pixel-art': require('@dicebear/styles/pixel-art.json'),
}
