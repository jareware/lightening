# Lightening

A Home Assistant panel for viewing and controlling entities from an SVG floor
plan. Installed as a custom integration via HACS; adds a "Lightening" item to
the HA sidebar.

## Architecture

Lightening is a normal HA custom integration whose panel hosts a React app in an
iframe:

```
HA frontend
│
└── <lightening-panel>            the "glue": a custom element registered via
    │                             panel_custom. HA assigns it a `hass` object
    │                             on every state change.
    │
    └── <iframe src="/lightening-assets/app/">
            React + MUI app       same-origin, so it reads `hass` off the
                                  glue element directly
```

**Why an iframe.** Isolation, and only isolation. React, MUI and the Vite build
get their own document and their own runtime, with no chance of colliding with
HA's own frontend stack. Nothing about the data flow requires it.

**Why not a bridge.** The iframe is always same-origin with HA, so it can reach
`window.frameElement.parentElement.hass` and use HA's own connection. The app
holds no socket, no token, and no state of its own — which means there is
nothing to reconnect when a browser suspends the tab. An earlier version did
open its own WebSocket, and it would occasionally fail to come back after iOS
suspended the companion app, leaving the panel blank until a manual refresh.

**The doorbell.** HA replaces `hass` on each change rather than mutating it —
["whenever a state changes, a new version of the objects that changed are
created"][hass-data] — so a cached reference goes stale immediately. The glue
therefore calls a payload-free `onHassChanged()` and the app re-reads
`panelEl.hass`. Nothing is ever serialised across the iframe boundary. Since
only *changed* state objects get new identities, per-entity `===` remains a
valid memo key.

Two things cross the boundary in the other direction, both as direct calls
rather than messages. Service calls go straight through `hass.callService(...)`.
Anything HA exposes only as a DOM event — opening a more-info dialog, for
instance, has no equivalent on the `hass` object — goes through
`panelEl.fireEvent(type, detail)`, which mirrors [HA's own `fireEvent`
helper][fire-event]. The app *could* dispatch on the glue element itself, but
the event object would then belong to the iframe's realm rather than HA's;
building it in the glue avoids that. Event names live in `useHass`, so
components never spell one out.

[fire-event]: https://github.com/home-assistant/frontend/blob/dev/src/common/dom/fire_event.ts

[hass-data]: https://developers.home-assistant.io/docs/frontend/data/

## Layout

| Path | What it is |
|---|---|
| `custom_components/lightening/` | The HA integration (Python) |
| `custom_components/lightening/frontend/lightening-panel.js` | Panel glue: creates the iframe, rings the doorbell. Plain JS, loaded by HA as a classic script |
| `custom_components/lightening/frontend/app/` | Built React app. Gitignored — CI builds it into each release tag |
| `custom_components/lightening/uploads/` | Runtime state (uploaded floor plans). Gitignored; survives HACS updates via `persistent_directory` in `hacs.json` |
| `frontend/` | React app source (Vite + TypeScript + MUI) |

## Development

The dev server proxies HA so that the app and HA share one origin — the same
arrangement as production, so there is no separate dev code path:

```bash
cd frontend
npm install
echo 'HA_TARGET=http://my-ha-host:8123' > .env.local   # once
npm run dev
```

`HA_TARGET` is the instance to develop against; it can also be passed in the
environment, and defaults to `http://homeassistant.local:8123`. Then open:

```
http://localhost:5173/lightening?dev=/lightening-app/
```

`localhost:5173` is a new origin, so HA will ask you to log in once.

What the dev server does:

- serves the app under `/lightening-app/`, with HMR
- proxies everything else to `HA_TARGET`, including the `/api/websocket`
  upgrade that HA's own frontend needs
- serves `lightening-panel.js` from the working copy rather than from HA, so
  glue edits are a page refresh instead of a release

Building (`npm run build`) writes into `custom_components/lightening/frontend/app/`,
which is what a release ships.

## Releases

Every push to `master` triggers CI, which patches the version (`0.0.<run_number>`)
into `manifest.json` and `const.py`, builds the frontend, and commits the result
to a **tag only** — never back to `master`. So master never carries build
artifacts or version bumps, and you never have to pull before pushing.

Install and update through HACS as a custom repository.

## Known gaps

- **Uploaded SVGs are not sanitised.** The floor plan is inlined into the panel
  DOM (unavoidable if entities are to be bound to individual SVG nodes), so an
  SVG containing `<script>` would execute in HA's origin. The upload endpoint is
  `requires_admin` to keep a non-admin from planting one, but stripping
  `<script>`, `on*` attributes and `<foreignObject>` is still outstanding.
- Binding entities to SVG elements is not implemented yet — uploading and
  displaying a floor plan is as far as it goes.
