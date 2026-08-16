import asyncio
import os
import json
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import CONFIG_STORAGE_KEY, CONFIG_STORAGE_VERSION


class ConfigStore:
    """
    Lightening's config, held as one opaque JSON document.

    Deliberately schema-agnostic: whatever the frontend PUTs is what comes back
    out. That keeps the frontend free to restructure its config without a
    backend release, at the cost of owning its own migrations -- the document
    carries a schemaVersion the frontend reads.

    Writes are guarded by a revision counter rather than last-write-wins. A save
    naming a stale revision is rejected, so two clients editing at once can't
    silently drop one another's changes.
    """

    def __init__(self, hass: HomeAssistant) -> None:
        self._store = Store(hass, CONFIG_STORAGE_VERSION, CONFIG_STORAGE_KEY)
        # Serializes read-modify-write; without it two PUTs can interleave at an
        # await point and both pass the revision check.
        self._lock = asyncio.Lock()
        self._document: dict[str, Any] | None = None

    async def async_load(self) -> dict[str, Any]:
        """The current document, as {"revision": int, "data": {...}}."""
        async with self._lock:
            return await self._async_load_locked()

    async def _async_load_locked(self) -> dict[str, Any]:
        if self._document is None:
            stored = await self._store.async_load()
            self._document = stored or {"revision": 0, "data": {}}
        return self._document

    async def async_save(
        self, data: Any, expected_revision: int
    ) -> dict[str, Any] | None:
        """
        Replace the document, bumping its revision.

        Returns the new document, or None if expected_revision is stale --
        meaning someone else wrote first and the caller should reconcile.
        """
        async with self._lock:
            current = await self._async_load_locked()
            if expected_revision != current["revision"]:
                return None
            document = {"revision": current["revision"] + 1, "data": data}
            await self._store.async_save(document)
            self._document = document
            return document


class FloorplanStore:
    """Manages floorplan SVG files on disk in the uploads directory."""

    def __init__(self, uploads_path: str) -> None:
        self._path = uploads_path
        self._meta_file = os.path.join(uploads_path, "meta.json")

    def _read_meta(self) -> dict:
        if os.path.exists(self._meta_file):
            with open(self._meta_file) as f:
                return json.load(f)
        return {}

    def _write_meta(self, meta: dict) -> None:
        with open(self._meta_file, "w") as f:
            json.dump(meta, f)

    def save_floorplan(self, filename: str, content: bytes) -> None:
        svg_path = os.path.join(self._path, "floorplan.svg")
        with open(svg_path, "wb") as f:
            f.write(content)
        meta = self._read_meta()
        meta["floorplan"] = {"original_filename": filename}
        self._write_meta(meta)

    def get_floorplan(self) -> bytes | None:
        svg_path = os.path.join(self._path, "floorplan.svg")
        if os.path.exists(svg_path):
            with open(svg_path, "rb") as f:
                return f.read()
        return None

    def get_meta(self) -> dict:
        return self._read_meta()

    def delete_floorplan(self) -> None:
        svg_path = os.path.join(self._path, "floorplan.svg")
        if os.path.exists(svg_path):
            os.remove(svg_path)
        meta = self._read_meta()
        meta.pop("floorplan", None)
        self._write_meta(meta)
