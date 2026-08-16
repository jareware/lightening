import os
from functools import partial

from homeassistant.components.frontend import (
    async_register_built_in_panel,
    async_remove_panel,
)
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.loader import async_get_integration

from .const import DOMAIN
from .store import ConfigStore, FloorplanStore
from .api import (
    LighteningConfigView,
    LighteningFloorplanView,
    LighteningUploadView,
)

STATIC_URL = "/lightening-assets"
PANEL_FRONTEND_PATH = "custom_components/lightening/frontend"
UPLOADS_PATH = "custom_components/lightening/uploads"


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    frontend_path = hass.config.path(PANEL_FRONTEND_PATH)
    uploads_path = hass.config.path(UPLOADS_PATH)
    # Off the event loop -- HA flags blocking I/O during setup.
    await hass.async_add_executor_job(partial(os.makedirs, uploads_path, exist_ok=True))

    hass.data[DOMAIN] = {
        "floorplan": FloorplanStore(uploads_path),
        "config": ConfigStore(hass),
    }

    await hass.http.async_register_static_paths(
        [StaticPathConfig(STATIC_URL, frontend_path, cache_headers=False)]
    )

    hass.http.register_view(LighteningUploadView)
    hass.http.register_view(LighteningFloorplanView)
    hass.http.register_view(LighteningConfigView)

    # Straight from manifest.json, so there's no second copy to drift. Used only
    # to bust the browser cache on the glue when a new version is installed.
    integration = await async_get_integration(hass, DOMAIN)

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
                "js_url": f"{STATIC_URL}/lightening-panel.js?v={integration.version}",
                "trust_external_script": True,
            },
        },
    )

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.data.pop(DOMAIN, None)
    async_remove_panel(hass, "lightening")
    return True
