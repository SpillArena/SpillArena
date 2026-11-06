import { defineConfig, loadEnv, type Plugin } from "vite";
import { contentPages } from "./scripts/content-pages.ts";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/*
 * AdSense sin bekreftelse av nettstedet, fra samme ID som main.tsx laster
 * taggen med (VITE_ADSENSE_CLIENT, se .env.production):
 *
 * - /ads.txt sier hvem som får selge annonseplass på spillarena.no. Den må
 *   ligge i roten av domenet, og forsiden ER roten: spillene under /<spill>
 *   dekkes av den samme fila.
 * - <meta name="google-adsense-account"> lar AdSense bekrefte eierskapet uten
 *   at noe skript må lastes, så søknaden kan sendes før CSP-en åpnes for Google.
 *
 * Uten ID lages ingen av dem. En ID med feil form stopper bygget: en ads.txt med
 * skrivefeil gir ingen feilmelding, bare annonser som aldri blir solgt.
 */
function adsense(client: string): Plugin {
  const id = client.trim();
  if (id && !/^ca-pub-\d{16}$/.test(id)) {
    throw new Error(`VITE_ADSENSE_CLIENT "${id}" er ikke en AdSense-utgiver-ID (ca-pub- og 16 sifre).`);
  }
  return {
    name: "spillarena-adsense",
    transformIndexHtml() {
      if (!id) return;
      return [{ tag: "meta", attrs: { name: "google-adsense-account", content: id }, injectTo: "head" }];
    },
    generateBundle() {
      if (!id) return;
      // f08c47fec0942fa0 er Googles faste ID i IABs register over selgere
      this.emitFile({
        type: "asset",
        fileName: "ads.txt",
        source: `google.com, ${id.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`,
      });
    },
  };
}

/*
 * Vite puts the module script before the stylesheet in <head>. Put the
 * stylesheet first and preload the Latin fonts, so the browser asks for the
 * styles and the text fonts before it has parsed anything else, and the first
 * paint is styled with the right font.
 */
function earlyStyles(): Plugin {
  return {
    name: "spillarena-early-styles",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        const css = html.match(/[ \t]*<link rel="stylesheet"[^>]*>\n?/);
        if (!css) return html;
        const fonts = Object.keys(ctx.bundle ?? {})
          .filter(name => /^assets\/(fraunces|space-grotesk)-normal-latin-(?!ext-)[\w-]+\.woff2$/.test(name))
          .map(name => `  <link rel="preload" as="font" type="font/woff2" crossorigin href="/${name}">\n`)
          .join("");
        return html.replace(css[0], "").replace(/(\s*)(<script type="module")/, `$1${css[0].trimEnd()}\n${fonts}  $2`);
      },
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), contentPages(), earlyStyles(), adsense(loadEnv(mode, process.cwd(), "VITE_").VITE_ADSENSE_CLIENT ?? "")],
}));
