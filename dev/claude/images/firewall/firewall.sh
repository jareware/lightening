#!/bin/sh
set -eu

# Egress firewall for the dev container.
#
# Runs with `network_mode: service:claude`, so it shares that container's network
# namespace and these OUTPUT rules govern *its* outbound traffic. The dev
# container has no NET_ADMIN, so it cannot alter them.
#
# Policy:
#   ALLOW  the public internet          (Anthropic API, npm, GitHub, docs)
#   ALLOW  one LAN host, on one port    (Home Assistant, for the Vite dev proxy)
#   DENY   everything else private      -- the rest of the LAN, and the host machine
#
# The host is not reachable at all: Docker Desktop's host-gateway address falls
# inside the RFC1918 ranges rejected below, and unlike some setups we need no
# exception for anything running on the host.
#
# Fail-closed: the default policy is DROP and iptables is baked into the image,
# so a script that dies partway leaves the container with no egress rather than
# with full access.

HA_HOST_IP="${HA_HOST_IP:?set HA_HOST_IP in dev/claude/.env}"
HA_PORT="${HA_PORT:-8123}"

echo "claude-firewall: permitting Home Assistant at ${HA_HOST_IP}:${HA_PORT}"

### IPv4 -- the LAN, the host and Home Assistant are all IPv4.
iptables -F OUTPUT
iptables -P OUTPUT DROP
iptables -A OUTPUT -o lo -j ACCEPT
iptables -A OUTPUT -d 127.0.0.0/8 -j ACCEPT                                 # Docker's embedded DNS (127.0.0.11)
iptables -A OUTPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A OUTPUT -d "$HA_HOST_IP" -p tcp --dport "$HA_PORT" -j ACCEPT     # the one LAN exception, before the reject
for net in 10.0.0.0/8 172.16.0.0/12 192.168.0.0/16 169.254.0.0/16 100.64.0.0/10; do
  iptables -A OUTPUT -d "$net" -j REJECT                                    # LAN, host, CGNAT, link-local
done
iptables -A OUTPUT -j ACCEPT                                                # whatever is left is the public internet

# Note: there is deliberately no blanket allow for the Docker bridge subnet.
# Nothing else runs on this network. If a sidecar is ever added (an MCP server,
# say), it needs an explicit rule -- 172.16/12 is rejected above.

### IPv6 -- no exceptions; nothing we depend on is IPv6-only.
ip6tables -F OUTPUT
ip6tables -P OUTPUT DROP
ip6tables -A OUTPUT -o lo -j ACCEPT
ip6tables -A OUTPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
ip6tables -A OUTPUT -d fc00::/7 -j REJECT                                   # ULA: host-services net, any IPv6 LAN
ip6tables -A OUTPUT -d fe80::/10 -j REJECT                                  # link-local
ip6tables -A OUTPUT -j ACCEPT                                               # public IPv6 internet

echo "claude-firewall: rules applied -----------------------------------"
iptables -S OUTPUT
ip6tables -S OUTPUT
echo "------------------------------------------------------------------"

# Stay alive so the rules persist for the dev container's lifetime. If that
# container is recreated it gets a fresh netns and these rules go with the old
# one -- see the note about reattaching in README.md.
exec tail -f /dev/null
