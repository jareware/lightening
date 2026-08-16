FROM alpine:3.20
# All baked into the image so the firewall needs no network at runtime and can
# therefore fail *closed*. dnsmasq resolves for the whole namespace and populates
# the ipset allow-list as it answers; iproute2 is for debugging the shared netns.
#
# Alpine's dnsmasq is built with `ipset` but `no-nftset`, which is why the
# allow-list is ipset + iptables rather than nftables.
RUN apk add --no-cache iptables ip6tables ipset dnsmasq iproute2
COPY firewall.sh /firewall.sh
RUN chmod +x /firewall.sh
ENTRYPOINT ["/firewall.sh"]
