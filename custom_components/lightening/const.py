DOMAIN = "lightening"

# Fired on the HA bus after config is written, so every open client can refetch.
# Carries only {"revision": int} -- a doorbell, not the payload.
EVENT_CONFIG_UPDATED = f"{DOMAIN}_config_updated"

# Config lives in HA's .storage, not under custom_components: HACS updates can't
# touch it and HA's own backups include it.
CONFIG_STORAGE_KEY = f"{DOMAIN}_config"
CONFIG_STORAGE_VERSION = 1
