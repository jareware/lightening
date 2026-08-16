# The dev container: a full working environment for Claude Code, with nothing
# from the host in it. The repository is cloned inside; no bind mounts.

FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      git \
      jq \
      less \
      procps \
      python3 \
      ripgrep \
    && rm -rf /var/lib/apt/lists/*

# Claude Code refuses --dangerously-skip-permissions when running as root, and
# that flag is the whole point of putting it in a container.
RUN useradd --create-home --shell /bin/bash dev
USER dev
WORKDIR /home/dev

# Installed into the user's home rather than system-wide, so Claude Code can
# auto-update itself in place. /home/dev is a named volume: Docker seeds it from
# this image the first time the volume is created, and the volume wins after
# that -- so rebuilding this image will NOT move the CLI's version. It doesn't
# need to, because it updates itself. See README.md.
RUN curl -fsSL https://claude.ai/install.sh | bash

ENV PATH=/home/dev/.local/bin:$PATH

CMD ["bash", "-l"]
