/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  // altre variabili d'ambiente qui
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
