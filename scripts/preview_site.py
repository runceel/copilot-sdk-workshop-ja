#!/usr/bin/env python3

from __future__ import annotations

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import shutil
from tempfile import TemporaryDirectory


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
WORKSHOP = ROOT / "workshop"


def prepare_site(site_directory: Path) -> None:
    shutil.copytree(DOCS, site_directory, dirs_exist_ok=True)
    shutil.copytree(WORKSHOP, site_directory / "workshop", dirs_exist_ok=True)


def main() -> None:
    with TemporaryDirectory(prefix="copilot-sdk-workshop-preview-") as temporary_directory:
        site_directory = Path(temporary_directory)
        prepare_site(site_directory)
        handler = partial(SimpleHTTPRequestHandler, directory=str(site_directory))

        with ThreadingHTTPServer(("127.0.0.1", 8000), handler) as server:
            print(f"Serving workshop preview at http://localhost:{server.server_port}/", flush=True)
            server.serve_forever()


if __name__ == "__main__":
    main()
