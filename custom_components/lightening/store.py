import os
import json


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
