import os
from functools import partial

from homeassistant.components.frontend import (
    async_register_built_in_panel,
    async_remove_panel,
)
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN, VERSION
from .store import FloorplanStore
from .api import LighteningUploadView, LighteningFloorplanView

STATIC_URL = "/lightening-assets"
PANEL_FRONTEND_PATH = "custom_components/lightening/frontend"
UPLOADS_PATH = "custom_components/lightening/uploads"


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    frontend_path = hass.config.path(PANEL_FRONTEND_PATH)
    uploads_path = hass.config.path(UPLOADS_PATH)
    # Off the event loop -- HA flags blocking I/O during setup.
    await hass.async_add_executor_job(partial(os.makedirs, uploads_path, exist_ok=True))

    store = FloorplanStore(uploads_path)
    hass.data[DOMAIN] = {"store": store}

    await hass.http.async_register_static_paths(
        [StaticPathConfig(STATIC_URL, frontend_path, cache_headers=False)]
    )

    hass.http.register_view(LighteningUploadView)
    hass.http.register_view(LighteningFloorplanView)

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
    hass.data.pop(DOMAIN, None)
    async_remove_panel(hass, "lightening")
    return True
