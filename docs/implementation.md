# Implementation notes

Why things are the way they are. The code says *what*; this says *why*, including
the options that were rejected and the mistakes that shaped the current design.
If you're picking this project up, read this before changing anything structural
— several of the decisions look arbitrary until you know what they're avoiding.

## The iframe and the boundary

**The iframe exists for isolation, and nothing else.** React, MUI and the Vite
build get their own document and runtime, with no chance of colliding with HA's
Lit-based frontend. No part of the data flow needs it. If the isolation ever
stops being worth it, the app could render directly in the custom element — the
only real loss would be the clean build setup.

**The app used to hold its own WebSocket, and that was a bug.** The original
design bridged an auth token down to the iframe via `postMessage`, and the app
opened its own authenticated connection to HA. It worked, but the connection was
ours to re-establish, and it didn't reliably come back after iOS suspended the
companion app — the panel would render blank until a manual refresh. Reading
`hass` off the panel element instead means HA owns the only connection, and HA
already handles its own reconnection. There is nothing on our side that can fail
to come back.

**Serialising `hass` across the boundary was considered and doesn't work.** The
object carries functions (`callService`, `callWS`), the live `connection`, and
`auth` — none of which survive structured clone. Sending it down would mean
cherry-picking `states` and building a request/response protocol for every
action, i.e. reinventing RPC. Direct property access avoids the entire category.

**Why the doorbell has no payload.** HA replaces `hass` on every change rather
than mutating it — ["whenever a state changes, a new version of the objects that
changed are created"][hass-data] — so any reference the app caches is stale
immediately. The glue therefore just signals *that* something changed and the
app re-reads. Nothing is serialised across the boundary, ever. A useful
consequence of that same doc sentence: only the objects that *changed* get new
identities, so per-entity `===` is a valid memo key when rendering many entities.

**Why the glue builds DOM events instead of the app.** HA has no method on
`hass` for opening a more-info dialog — it exists only as a bubbling DOM event,
confirmed by reading HA's `HomeAssistant` interface, which has no dialog API of
any kind. The app *could* dispatch on the panel element itself, since it already
reaches into the parent for `hass`. It doesn't, because an event constructed in
the iframe's realm is a foreign object to HA's listeners; `instanceof` checks
would fail. Ours read `.detail` and would probably be fine, but "probably fine"
isn't worth the one line saved.

`fireEvent` is deliberately generic and mirrors [HA's own helper][fire-event],
including its `bubbles`/`composed` defaults. Event *names* live in `useHass`, not
the glue and not components: the glue knows how to fire events into HA's realm,
`useHass` knows which events exist, components know neither.

[hass-data]: https://developers.home-assistant.io/docs/frontend/data/
[fire-event]: https://github.com/home-assistant/frontend/blob/dev/src/common/dom/fire_event.ts

## Why development runs through a proxy

The iframe is same-origin in production because HA serves it. In development it
would naturally be cross-origin — a Vite dev server on another port — and that
single difference was about to force two implementations of everything: a
same-origin path for production and a token-bridged WebSocket path for dev, with
a shared interface over the top.

Running HA *through* the dev server collapses that. The app is served under a
path the proxy excludes; everything else is forwarded to HA. Both end up on one
origin, so development exercises exactly the production code path. That deleted
the WebSocket client, the token bridge, and the whole `postMessage` protocol
rather than keeping them alive as a dev-only branch.

Four details that are load-bearing and non-obvious:

- **Only HA's WebSocket endpoint is proxied with upgrade handling.** A blanket
  upgrade proxy would swallow Vite's own HMR socket and forward it to HA.
- **`X-Forwarded-*` headers are suppressed.** HA rejects them from proxies it
  hasn't been told to trust, so not sending them avoids needing `trusted_proxies`
  in HA's config.
- **The glue is served from the working copy**, by middleware registered ahead
  of the proxy (Vite runs `configureServer` middleware before internal ones).
  Otherwise glue edits would need a full release to test, since the glue
  otherwise comes from HA.
- **The dev origin is a separate HA session.** You log in once. This was the main
  unknown when the approach was proposed — HA's auth is indieauth-style with
  `client_id` set to the browser origin — and it turned out to work without any
  special handling.

## Config

Everything persisted apart from the floor plan image is one JSON document,
called the *config*.

**The backend never inspects it.** It stores what it's given and hands it back.
This is the whole point: config schema changes are frontend-only, with no
integration release and no HACS update. The cost, accepted deliberately, is that
migrations are also the frontend's job — a backend that can't read the document
can't migrate it. Hence the `schemaVersion` inside the document and a migrate
step on read, established before there was any data in the wild rather than
after.

**What's excluded matters as much as what's in it.** The SVG is a file, because
it's large and binary and changes rarely. Entity state is never persisted; it
comes from `hass`. Per-user, per-device preferences — zoom, last-viewed floor —
belong in browser storage, so that one person panning on a phone doesn't write
to a document everyone shares. What's left is a few KB, which is why reading and
writing it whole is fine.

**Why HA's `Store` rather than a file next to the SVG.** It writes to `.storage`
in the HA config directory: outside `custom_components/`, so HACS updates can't
touch it and it needs no `persistent_directory` entry; and included in HA's own
backups. Structured config and a big opaque binary want different homes.

**Why a revision counter.** Whole-document writes make conflicts maximally
coarse: binding a light on a laptop collides with binding a different light on a
phone, purely because both rewrote the same document. Without a check, one edit
silently vanishes. With it, the loser gets a `409` carrying the current
document, so it can reapply without a second request. This was added up front
because retrofitting optimistic concurrency onto live data is unpleasant.

There's also an `asyncio.Lock` around read-modify-write. HA's event loop is
single-threaded, but two requests can still interleave at an `await` point and
both pass the revision check.

**Why push is a doorbell, not a payload.** After a write, the integration fires
an event carrying only the new revision, and clients refetch. Ordering between
events therefore can't corrupt anything, there's no second serialisation path
for config, and the originating client refetching too costs nothing. Clients
subscribe through `hass.connection` — HA's existing socket — so the "no
connection of our own" property survives.

Push and the revision check solve adjacent problems and reinforce each other:
push keeps other clients current, which makes 409s rare; the revision check
remains the correctness backstop for the genuine race. Both funnel into the same
refetch path.

**Storage options that were rejected:**

- *`frontend/set_user_data`* — real, but per-user, so two people would see
  different bindings. Its `set_system_data` sibling is installation-wide but
  keys look restricted to HA's own allowlist.
- *Config entry options* — persisted and UI-visible, but meant for integration
  setup, and updating them triggers reload listeners. Wrong semantics for
  something that changes whenever you drag an element.
- *Entity registry / labels* — puts Lightening's concerns into HA's own config,
  with a limited write surface.

## Home Assistant API traps

Three separate HA accessors were used wrongly here, all of which looked correct:

- **`hass.components.<x>`** — removed in HA 2024.9. Import from the component
  module directly.
- **`request.app["hass"]`** — superseded by the `KEY_HASS` app key.
- **`requires_admin` as a view class attribute** — *does not exist*.
  `HomeAssistantView` defines `url`, `extra_urls`, `requires_auth` and
  `cors_allowed`, and nothing else. Admin enforcement is a decorator on the
  handler method.

The third is the instructive one. Setting a class attribute that nothing reads
is valid Python: it compiles, it lints, and the happy path behaves identically,
because an admin performing an admin-only action works either way. Only a
non-admin would have revealed it. **Silently-ignored configuration is invisible
to every check in this project's pipeline** — if you assert a capability, verify
the mechanism in HA's source rather than assuming the attribute name is real.

It was found only because a second endpoint needed per-method granularity that
the class attribute couldn't express. Copying the existing (broken) line would
have propagated it silently.

Two more, less dramatic:

- **Blocking I/O in `async_setup_entry`** — even `os.makedirs` should go through
  the executor; HA flags blocking calls during setup.
- **Static paths can shadow panel routes.** Registering the integration's static
  files at the same path as the panel made HA's static handler intercept the
  panel route and return 403 for the SPA. The static path is deliberately
  *different* from the panel URL. Don't "tidy" them back together.

## Versioning and releases

**CI never pushes to `master`.** It patches the version, builds the frontend,
and commits that to a tag only. An earlier version committed the bump back to
master, which meant every push had to be preceded by a pull — friction with no
benefit, since master never needs to carry a real version.

**The version has exactly one home: `manifest.json`.** It used to be duplicated
into a Python constant, and the copy on master drifted to a value that looked
like a forgotten bump. The integration reads the manifest back at runtime
instead. On master the manifest says `0.0.0` — mandatory field, so it can't be
omitted, and `0.0.0` reads as an unreleased sentinel rather than a stale
release.

The version is used only to bust browser caching of the glue. That's close to
redundant, since the static path is registered without cache headers — but with
no explicit `Cache-Control`, browsers fall back to heuristic freshness derived
from `Last-Modified`, so it stays as cheap insurance.

**The built app exists only inside release tags.** Master carries no build
artifacts; CI force-adds the build output when creating the tag. HACS installs
from tags, so users get a built app without the repo accumulating bundles.

## Security posture

The floor plan is inlined into the panel DOM. That's unavoidable if entities are
to be bound to individual SVG nodes — an `<img>` or `<object>` gives you no
handle on the elements inside. It also means **an uploaded SVG containing
`<script>` executes in HA's origin, with the auth token in reach.**

Uploads are admin-only, which stops a non-admin planting one for an admin to
open. That is *containment, not a fix*: an admin can still self-inflict, and the
gate is currently load-bearing security rather than a policy preference.

**Sanitising uploaded SVG is what retires this.** Strip `<script>`, `on*`
attributes and `<foreignObject>` before inserting. Once that's done, admin-only
upload becomes an ordinary "who may change shared config" decision rather than a
control holding back an XSS. Until then, don't remove the gate.

## Working on this

**The two halves have very different iteration speeds.** Frontend changes are
instant: HMR, the proxy, and locally-served glue mean no release cycle at all.
Backend changes still require push → CI → HACS → restart. If backend work ever
becomes frequent, rsyncing `custom_components/lightening/` onto the host and
restarting HA skips the whole loop; it hasn't been worth setting up yet.

**Keep real instance hostnames out of the repo.** The dev target is configured
through a gitignored env file with a generic default. A hostname did reach one
commit and, since rewriting published history doesn't actually remove objects
from GitHub, it stays reachable by SHA — a reason to get this right the first
time rather than fix it later.

**HACS specifics.** Installed as a custom repository, from releases. Runtime
state under `uploads/` survives updates only because of `persistent_directory`
in `hacs.json`. The "Icon not available" label in HACS's list is cosmetic — a
real icon requires submitting to the `home-assistant/brands` repo, which is only
worthwhile for a publicly listed integration.

## What has and hasn't been exercised

Verified against a real HA instance: panel registration and loading, same-origin
`hass` access with live updates, service calls, more-info dialogs, the dev proxy
(including HA login at the dev origin and WebSocket upgrade), and floor plan
upload, display and delete.

Not yet run against real HA: **the whole config surface** — read, write, the
`409` path, and the push event. Also unverified is whether HA restricts custom
event subscriptions for non-admin users; the panel isn't admin-only, so if it
turns out to be gated, non-admins would need a fallback such as refetch on
focus.
