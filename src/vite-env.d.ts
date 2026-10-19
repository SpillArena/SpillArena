/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** AdSense-utgiver-ID-en, `ca-pub-` og 16 sifre. Tom: ingen reklame. Se .env.production. */
  readonly VITE_ADSENSE_CLIENT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
