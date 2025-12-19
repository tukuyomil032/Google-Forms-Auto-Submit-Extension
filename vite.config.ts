import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx, defineManifest } from '@crxjs/vite-plugin'

const manifest = defineManifest({
  manifest_version: 3,
  name: "N/S/R高 通学コース 出席フォーム自動提出拡張機能",
  version: "1.0.0",
  permissions: ["storage", "tabs", "scripting"],
  host_permissions: ["https://docs.google.com/forms/*"],
  action: {
    default_popup: "index.html"
  },
  background: {
    service_worker: "src/background.ts",
    type: "module"
  },
  content_scripts: [
    {
      matches: ["https://docs.google.com/forms/*"],
      js: ["src/content.ts"],
      run_at: "document_end"
    }
  ]
})

export default defineConfig({
  plugins: [react(), crx({ manifest })],
})