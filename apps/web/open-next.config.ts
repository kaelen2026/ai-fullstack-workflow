import { defineCloudflareConfig } from '@opennextjs/cloudflare'

// Web is a stateless SSR/static Next app — it talks to the API over HTTP
// (NEXT_PUBLIC_API_URL) and needs no Cloudflare bindings of its own.
export default defineCloudflareConfig()
