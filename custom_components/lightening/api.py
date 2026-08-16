from aiohttp import web

from homeassistant.components.http import HomeAssistantView, KEY_HASS, require_admin

from .const import DOMAIN

MAX_SVG_SIZE = 10 * 1024 * 1024  # 10 MB


class LighteningUploadView(HomeAssistantView):
    """
    Upload and delete the floorplan.

    Writes are admin-only: the SVG is inlined into the panel DOM, so replacing
    it is effectively code execution in every viewer's session.
    """

    url = "/api/lightening/floorplan"
    name = "api:lightening:floorplan"
    requires_auth = True

    @require_admin
    async def post(self, request: web.Request) -> web.Response:
        hass = request.app[KEY_HASS]
        store = hass.data[DOMAIN]["store"]

        # Reject oversized uploads before reading them into memory.
        if request.content_length and request.content_length > MAX_SVG_SIZE:
            return web.Response(status=413, text="File too large")

        reader = await request.multipart()
        field = await reader.next()
        if field is None or field.name != "file":
            return web.Response(status=400, text="Missing 'file' field")

        content = await field.read(decode=False)
        if len(content) > MAX_SVG_SIZE:
            return web.Response(status=413, text="File too large")

        await hass.async_add_executor_job(
            store.save_floorplan, field.filename or "floorplan.svg", content
        )
        return web.json_response({"ok": True})

    @require_admin
    async def delete(self, request: web.Request) -> web.Response:
        hass = request.app[KEY_HASS]
        store = hass.data[DOMAIN]["store"]
        await hass.async_add_executor_job(store.delete_floorplan)
        return web.json_response({"ok": True})


class LighteningFloorplanView(HomeAssistantView):
    """Serve the uploaded floorplan. Readable by any authenticated user, since
    the panel itself is not admin-only."""

    url = "/api/lightening/floorplan/svg"
    name = "api:lightening:floorplan:svg"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app[KEY_HASS]
        store = hass.data[DOMAIN]["store"]
        content = await hass.async_add_executor_job(store.get_floorplan)
        if content is None:
            return web.Response(status=404, text="No floorplan uploaded")
        return web.Response(body=content, content_type="image/svg+xml")
