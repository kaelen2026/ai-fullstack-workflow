import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  clean: true,
  sourcemap: true,
  // Bundle all dependencies into a single file so the Docker runtime image
  // needs nothing but the compiled output (no node_modules).
  noExternal: [/.*/],
  // Bundled CJS deps (e.g. dotenv) use `require()`; recreate it for the ESM
  // output so `require('fs')` and friends resolve at runtime.
  banner: {
    js: "import{createRequire as __cr}from'node:module';import{fileURLToPath as __ftp}from'node:url';import{dirname as __dn}from'node:path';const require=__cr(import.meta.url);const __filename=__ftp(import.meta.url);const __dirname=__dn(__filename);",
  },
})
