#!/bin/sh
set -eu

# Egress firewall for the dev container.
#
# This container owns the network namespace and the dev container joins it
# (`network_mode: service:net`), so these OUTPUT rules govern the dev
# container's outbound traffic. It has no NET_ADMIN, so it cannot alter them.
#
# Ownership is this way round on purpose: recreating the dev container rejoins a
# namespace that still has these rules. Were it the owner, every rebuild would
# hand it a fresh, empty, default-ACCEPT namespace instead.
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

echo "firewall: permitting Home Assistant at ${HA_HOST_IP}:${HA_PORT}"

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

echo "firewall: rules applied -----------------------------------"
iptables -S OUTPUT
ip6tables -S OUTPUT
echo "------------------------------------------------------------------"

# Stay alive: this container owns the namespace the dev container is using, so
# it must outlive it. Recreating *this* container is the one operation that
# requires recreating the dev container too.
exec tail -f /dev/null
