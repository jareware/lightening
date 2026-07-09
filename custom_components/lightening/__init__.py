from homeassistant.components.frontend import async_register_built_in_panel
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN, VERSION

STATIC_URL = "/lightening-assets"
PANEL_FRONTEND_PATH = "custom_components/lightening/frontend"


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    frontend_path = hass.config.path(PANEL_FRONTEND_PATH)

    await hass.http.async_register_static_paths(
        [StaticPathConfig(STATIC_URL, frontend_path, cache_headers=False)]
    )

    async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title="Lightening",
        sidebar_icon="mdi:lightning-bolt",
        frontend_url_path="lightening",
        require_admin=False,
        config={
            "_panel_custom": {
                "name": "lightening-panel",
                "js_url": f"{STATIC_URL}/lightening-panel.js?v={VERSION}",
                "trust_external_script": True,
            },
        },
    )

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.components.frontend.async_remove_panel("lightening")
    return True
