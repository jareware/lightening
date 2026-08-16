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

`bin/claude` builds the images if they've changed, starts the stack, reattaches
the firewall, clones the repository on first run, and drops you into a Claude
Code session in the checkout.

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

Two hazards, both inherited from how compose handles a shared network namespace:

> **Never** use `docker compose run claude` — that spawns a new container the
> firewall isn't attached to, so it is **unfirewalled**. The launcher uses
> `exec` for this reason.

> Compose does **not** reattach the firewall when the `claude` container gets a
> fresh netns, so a bare restart leaves it unfirewalled until the sidecar is
> force-recreated. `bin/claude` does that every time; if you drive compose by
> hand, run `docker compose up -d --force-recreate claude-firewall` after any
> recreate of `claude`.

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

| | |
|---|---|
| Public internet | allowed — the Anthropic API, npm, GitHub, documentation |
| One Home Assistant host, port 8123 | allowed — the Vite dev server proxies to it |
| The rest of the LAN | blocked |
| The host machine | blocked, with no exceptions |

There is no pure-compose way to say "internet yes, LAN no", so this is done with
`iptables` in a sidecar that shares the dev container's network namespace
(`network_mode: service:claude`). The dev container has no `NET_ADMIN`, so it
can't alter the rules. Default policy is `DROP` and `iptables` is baked into the
image, so a firewall script that dies partway leaves the container with no
egress rather than full access.

The published port `127.0.0.1:5173` still works: that's inbound, and `OUTPUT`
rules don't govern it.

Verify from inside:

```bash
# permitted
curl -s -o /dev/null -w '%{http_code}\n' https://registry.npmjs.org/   # 200

# blocked -- both fail to connect
curl -s --max-time 6 http://host.docker.internal/
curl -s --max-time 6 http://<some-other-LAN-address>/
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
