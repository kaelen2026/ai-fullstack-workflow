import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/core/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // biome-ignore lint/style/noNonNullAssertion: drizzle-kit reads this at CLI time
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
})
