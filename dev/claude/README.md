# Dev container

A container for doing Lightening development with [Claude Code](https://code.claude.com),
isolated so that an agent running without permission prompts can't reach
anything that matters. Everything happens inside: the repository is cloned in
there, the dev server runs in there, and nothing from the host filesystem is
mounted.

```
bin/claude                 launcher -- the supported way in
bin/push                   publish the container's work, from the host
dev/claude/
  docker-compose.yml       the containers and their networking
  images/claude/           Node 22, Python, the usual CLI tools, Claude Code
  images/firewall/         the egress firewall applied to the dev container
  .env.example             template for the untracked .env
```

## Running it

```bash
cp dev/claude/.env.example dev/claude/.env   # then fill it in -- see the file
bin/claude                                   # that's it
```

`bin/claude` builds the images if they've changed, starts the stack, verifies
the firewall is actually in effect, clones the repository on first run, and
drops you into a Claude Code session in the checkout.

The container is a sandbox rather than a permission model, so
`--dangerously-skip-permissions` is a reasonable thing to add if you want it —
there are no host credentials, no GitHub credential and no route to the LAN or
your host to lose. The launcher doesn't pass it; auto mode is the default.

The token in `.env` comes from `claude setup-token`, run on a machine that is
already signed in. Inside the container, `claude` picks it up from the
environment — there's no browser sign-in to complete.

Dependencies aren't installed automatically, since it's a slow step that isn't
always wanted: run `npm ci` in `frontend/` before using the dev server.

Any arguments are run as a command instead of starting a session:

```bash
bin/claude bash -l         # a shell
bin/claude npm run dev     # one command
```

> **Never** use `docker compose run claude` — that spawns a container outside
> the firewalled namespace entirely, so it is **unfirewalled**. The launcher
> uses `exec` for this reason.

### Which container owns the network namespace

`net` owns it; `claude` joins with `network_mode: service:net`. That direction
matters. Namespaces belong to the container that created them, so with the
ownership reversed, every recreate of the dev container — a rebuild, a changed
Dockerfile — would hand it a **fresh, empty, default-ACCEPT** namespace while
the firewall sidecar stayed bound to the old one. Silently unfirewalled, in the
most routine operation there is.

This way round, recreating the dev container rejoins a namespace that already
has the rules in it. Verified: force-recreating `claude` leaves a LAN probe
rejected in 0.1s, where the old arrangement left `-P OUTPUT ACCEPT`.

Two consequences of the inversion:

- **`ports` and `extra_hosts` live on `net`.** Docker refuses both on a
  container using `network_mode: container:…`. `/etc/hosts` is bind-mounted into
  the joiner, so `extra_hosts` still resolves in the dev container.
- **Recreating `net` strands the dev container** on a dead namespace, and
  compose won't recreate dependents. It fails *closed* — no network at all
  rather than unfiltered network — and `bin/claude` detects the mismatch by
  comparing `/proc/self/ns/net` and recreates the dev container itself.

## Publishing: `bin/push`

Commits happen in the container; **pushing happens on the host.**

```bash
bin/push              # fetch the container's master, push it to origin
bin/push --dry-run    # everything except the actual ref update
```

The container holds no GitHub credential, so the agent cannot push. Instead the
host reaches into it with git's `ext::` transport, running `git upload-pack`
over `docker exec`: the container only ever *serves* commits, and this host's
git does the pushing with this host's credential and config.

That arrangement is the point, and it's stronger than it may look. Two designs
that seem equivalent are not:

- **A push sidecar sharing the volume** would run `git push` inside a working
  copy the agent controls — so `.git/hooks/pre-push` and repo-local
  `credential.helper` would execute under the credential's identity. Defensible
  with `-c core.hooksPath=` and friends, but only by enumerating dangerous
  knobs.
- **`docker exec`-ing a push into the dev container** with the token in its
  environment is worse still: the agent runs as the same uid, so it can simply
  read `/proc/<pid>/environ`, or shadow `git` on `PATH`. No git hardening helps,
  because git isn't the attack path.

Fetching *out* avoids the category. No process holding a credential ever
consults anything the agent wrote.

`bin/push` uses a plain `git push`, deliberately: it refuses non-fast-forwards
and carries no tags, so history can't be rewritten and no release can be cut by
accident. It prints the commits first, and fast-forwards the host clone
afterwards when that's clean.

Residual risk: a hostile `upload-pack` is talking to your host's git. That is a
far narrower surface than a credential living in a namespace the agent shares.

## The two checkouts

The compose file lives in the repository, but the working checkout lives inside
the container. So there are two clones and they are not the same one:

- **on the host**, the clone that launches the container and publishes its work
- **in the container**, the one you actually work in

Changes the agent makes to `bin/*` or `dev/claude/*` land in the container's
clone and reach GitHub via `bin/push`. The host clone catches up either from
`bin/push`'s own fast-forward or with `git merge --ff-only container/master`.
Nothing keeps them in sync automatically, so a launcher change needs that step
before it takes effect on the host.

Uncommitted work lives in the `home` volume, so it survives the container being
stopped, rebuilt or recreated — but not the volume being deleted.

## What the container can reach

Set by `EGRESS` in `.env`. The default denies everything outbound except:

| | |
|---|---|
| `api.anthropic.com`, `statsig.anthropic.com`, `platform.claude.com`, `downloads.claude.ai` | inference, feature flags, token refresh, auto-update |
| `github.com`, `codeload.github.com`, `registry.npmjs.org` | without these the container can't clone itself or `npm ci` |
| `developers.home-assistant.io`, `www.home-assistant.io`, `raw.githubusercontent.com` | checking HA's docs and source is how several wrong API calls were caught here |
| One Home Assistant host, port 8123 | the Vite dev server proxies to it |

Everything else — the rest of the internet, the rest of the LAN, and the host
machine — is **rejected**, so blocked connections fail immediately rather than
hanging. Notably absent: Claude Code's telemetry intakes and any org-managed
OTEL collector. Managed settings sit at the top of Claude Code's precedence
chain and can be delivered server-side, so an env var is a request whereas a
firewall rule is a fact.

`EGRESS=any` removes the firewall entirely. That also makes the **host machine**
reachable, exposing anything you have bound to a localhost port — often things
that assume localhost means trusted. `bin/claude` prints a warning while it's
in effect. Switching modes recreates `net`; `bin/claude` handles the rest.

### How the allowlist is enforced

`dnsmasq` runs in `net` and is the namespace's only resolver — `/etc/resolv.conf`
is shared into the dev container, so pointing it at dnsmasq covers both. Its
`ipset` directive adds each resolved address of an allowlisted domain to an
ipset **as it answers the query**, and iptables permits that set on ports 80 and
443. So the address is allowed exactly when the client is about to dial it,
which tracks DNS rotation; resolving once at startup would go stale against CDN
addresses and fail silently. Entries age out after 24h — long on purpose, since
they're only re-added on a cache *miss*, and a shorter timeout would expire an
address dnsmasq still has cached and break a running session.

Home Assistant is a plain IP:port rule rather than an allowlisted domain, since
it's a LAN address that's never resolved.

Two honest limitations:

- **The grain is IP, not hostname.** Anything sharing an allowlisted IP is
  reachable. In practice `code.claude.com` and `platform.claude.com` both sit
  behind the same address as `api.anthropic.com`, so allowing the API allows
  those too. Convenient here, but don't mistake it for precision.
- **Only the listed documentation hosts work.** Home Assistant's docs and source
  are allowed because this project needs them constantly; anything else a
  WebFetch reaches for will fail. Switch to `EGRESS=any` when that matters, or
  add the host to `ALLOWED_DOMAINS` in `images/firewall/firewall.sh` if it turns
  out to be a recurring need.

Alpine's dnsmasq is built with `ipset` but `no-nftset`, which is why this is
ipset + iptables rather than nftables.

The published port `127.0.0.1:5173` still works: that's inbound, and `OUTPUT`
rules don't govern it.

Verify from inside:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://registry.npmjs.org/   # 200
curl -s --max-time 8 https://example.com/                              # exit 7, instantly
curl -s --max-time 8 http://host.docker.internal/                      # exit 7
```

## Credentials

Nothing is mounted from the host: no `~/.ssh`, no `~/.aws`, no `~/.config/gh`,
no `~/.gitconfig`. No host environment is passed through either — `${VAR}` in
the compose file interpolates at parse time and does **not** put `VAR` inside
the container; only keys named under `environment:` get in.

Two things necessarily *are* inside, and the agent can read both from its own
environment: the Claude Code token, and a GitHub credential if you add one for
pushing. That is unavoidable — the agent has to authenticate — and it's why the
compose file says not to add convenience mounts.

Cloning needs no credential; the repository is public. Pushing does, so without
one the agent can commit but not push.

## What this does *not* protect

**Your Home Assistant session.** During development the browser reaches HA
*through* the container's dev proxy, so your HA access token crosses the
container on every page load. The proxy's configuration is code the agent
writes, so capturing that token is a few lines in `vite.config.ts` — not a
packet capture, not a privilege escalation, and not conspicuous in a diff.

Moving the proxy into a separate sidecar would close that particular channel,
but not the class: the app itself reads `hass.auth.accessToken`, so any edit to
agent-authored frontend code can exfiltrate the token from the browser whatever
the network topology is.

The honest summary is that **this container improves host safety, not
Home-Assistant-credential safety** — and HA-credential safety is already exactly
where it was before, since running agent-authored code against a logged-in HA
session is what development here has always involved. Review what you load in a
browser that's signed in to Home Assistant.

## Notes

- **Claude Code auto-updates itself.** It's installed into the `dev` user's home
  so it can write its own updates. Since `/home/dev` is a named volume, Docker
  seeds it from the image only when the volume is first created — so rebuilding
  the image does *not* change the CLI version, and doesn't need to. To pin a
  version instead, install it system-wide as root and set `DISABLE_AUTOUPDATER=1`.
- **`--dangerously-skip-permissions` needs a non-root user**; the container runs
  as `dev` for that reason.
- **Keep the port mapping 1:1.** Remap `5173` to something else and Vite's HMR
  socket needs `server.hmr.clientPort` to match.
- **The dev server binds `0.0.0.0`** (`server.host` in `frontend/vite.config.ts`),
  without which a published port reaches nothing.
- **No `hass-mcp` container**, unlike the equivalent setup in the infra repo.
  Lightening talks to Home Assistant through the app, not through agent tools.
  Adding a sidecar later needs an explicit firewall rule — the Docker bridge
  subnet is inside the rejected `172.16/12`.
