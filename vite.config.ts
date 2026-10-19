import { defineConfig, loadEnv, type Plugin } from "vite";
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

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), adsense(loadEnv(mode, process.cwd(), "VITE_").VITE_ADSENSE_CLIENT ?? "")],
}));
