from aiohttp import web

from homeassistant.components.http import HomeAssistantView, KEY_HASS, require_admin

from .const import DOMAIN, EVENT_CONFIG_UPDATED

MAX_SVG_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_CONFIG_SIZE = 1024 * 1024  # 1 MB


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
        store = hass.data[DOMAIN]["floorplan"]

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
        store = hass.data[DOMAIN]["floorplan"]
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
        store = hass.data[DOMAIN]["floorplan"]
        content = await hass.async_add_executor_job(store.get_floorplan)
        if content is None:
            return web.Response(status=404, text="No floorplan uploaded")
        return web.Response(body=content, content_type="image/svg+xml")


class LighteningConfigView(HomeAssistantView):
    """
    Read and write Lightening's config document.

    The body shape is {"revision": int, "data": <anything>}. Only `revision` is
    ever interpreted here -- `data` is stored verbatim, so the frontend can
    change its schema freely without touching the backend.

    Readable by any authenticated user (the panel is not admin-only); writes are
    admin-only, since config decides what the panel controls.
    """

    url = "/api/lightening/config"
    name = "api:lightening:config"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass = request.app[KEY_HASS]
        store = hass.data[DOMAIN]["config"]
        return web.json_response(await store.async_load())

    @require_admin
    async def put(self, request: web.Request) -> web.Response:
        hass = request.app[KEY_HASS]
        store = hass.data[DOMAIN]["config"]

        if request.content_length and request.content_length > MAX_CONFIG_SIZE:
            return web.Response(status=413, text="Config too large")

        try:
            body = await request.json()
        except ValueError:
            return web.Response(status=400, text="Body must be JSON")

        if not isinstance(body, dict) or "data" not in body:
            return web.Response(status=400, text="Expected {revision, data}")
        revision = body.get("revision")
        if not isinstance(revision, int) or isinstance(revision, bool):
            return web.Response(status=400, text="'revision' must be an integer")

        document = await store.async_save(body["data"], revision)
        if document is None:
            # Someone wrote first. Hand back the current document so the client
            # can reconcile without a second round trip.
            return web.json_response(await store.async_load(), status=409)

        hass.bus.async_fire(EVENT_CONFIG_UPDATED, {"revision": document["revision"]})
        return web.json_response(document)
