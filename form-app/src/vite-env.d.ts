/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUBMIT_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
