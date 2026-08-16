FROM alpine:3.20
# iptables + ip6tables baked into the image so the firewall needs no network at
# runtime and can therefore fail *closed*. iproute2 is for debugging the shared
# netns from inside this container.
RUN apk add --no-cache iptables ip6tables iproute2
COPY firewall.sh /firewall.sh
RUN chmod +x /firewall.sh
ENTRYPOINT ["/firewall.sh"]
