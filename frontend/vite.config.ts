import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// The Home Assistant instance to develop against. Set HA_TARGET in the
// environment, or put it in a (gitignored) frontend/.env.local:
//
//   HA_TARGET=http://my-ha-host:8123
const DEFAULT_HA_TARGET = 'http://homeassistant.local:8123'

// In dev, the dev server owns this prefix and proxies everything else to HA.
// That makes the iframe same-origin with the HA frontend hosting it, so the app
// can read `hass` off the panel element exactly like it does in production --
// one code path, no token bridging, no CORS.
const DEV_BASE = '/lightening-app/'

// HA serves the panel glue from here in production.
const GLUE_URL = '/lightening-assets/lightening-panel.js'
const GLUE_FILE = path.resolve(
  __dirname,
  '../custom_components/lightening/frontend/lightening-panel.js',
)

// Serve the working-copy glue instead of whatever HA has deployed, so editing
// it is a page refresh rather than a release. Must be registered before the
// proxy -- configureServer middleware runs ahead of internal middlewares.
function serveLocalGlue(): Plugin {
  return {
    name: 'lightening:serve-local-glue',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || req.url.split('?')[0] !== GLUE_URL) return next()
        res.setHeader('Content-Type', 'text/javascript')
        res.setHeader('Cache-Control', 'no-store')
        res.end(fs.readFileSync(GLUE_FILE, 'utf8'))
      })
    },
  }
}

export default defineConfig(({ command, mode }) => {
  // '' prefix: read every var, not just VITE_-prefixed ones. Covers both
  // .env files and the actual environment.
  const haTarget = loadEnv(mode, __dirname, '').HA_TARGET || DEFAULT_HA_TARGET

  return {
    plugins: [react(), serveLocalGlue()],

    // Dev: served under DEV_BASE alongside the proxied HA.
    // Build: relative, because HA serves it from /lightening-assets/app/.
    base: command === 'serve' ? DEV_BASE : './',

    build: {
      outDir: '../custom_components/lightening/frontend/app',
      emptyOutDir: true,
    },

    server: {
      proxy: {
        // Matched first: HA's WebSocket needs a real upgrade.
        '/api/websocket': {
          target: haTarget,
          ws: true,
          // Don't add X-Forwarded-* -- HA rejects those from untrusted proxies.
          xfwd: false,
        },
        // Everything outside DEV_BASE belongs to HA. ws:false so Vite keeps its
        // own HMR socket instead of forwarding it upstream.
        [`^(?!${DEV_BASE})`]: {
          target: haTarget,
          ws: false,
          xfwd: false,
        },
      },
    },
  }
})
