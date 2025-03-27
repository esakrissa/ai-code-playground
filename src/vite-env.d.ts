/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly OPENAI_API_KEY: string
  readonly OPENAI_MODEL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
