/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_ADMIN_URL?: string
  readonly VITE_DEMO_MODE?: string
  readonly VITE_PROD_API_URL?: string
  readonly VITE_PROD_ADMIN_URL?: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string
  readonly DEV: boolean
  readonly MODE: string
  readonly BASE_URL: string
  readonly PROD: boolean
  readonly SSR: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
