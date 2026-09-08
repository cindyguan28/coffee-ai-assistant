#!/usr/bin/env python3
"""Import a Mylot bundle through Supabase REST without overwriting rows."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

TABLE_ORDER = ("beans", "bean_profiles", "brew_logs")


def _chunks(rows: list[dict], size: int = 100):
    for index in range(0, len(rows), size):
        yield rows[index:index + size]


def import_bundle(bundle: dict, supabase_url: str, service_key: str) -> dict[str, int]:
    if bundle.get("format") != "mylot-supabase-import-v1":
        raise ValueError("Unsupported or missing bundle format.")

    imported = {table: 0 for table in TABLE_ORDER}
    for table in TABLE_ORDER:
        rows = bundle.get("tables", {}).get(table, [])
        if not isinstance(rows, list):
            raise ValueError(f"Bundle table {table} must be a list.")
        for batch in _chunks(rows):
            query = urlencode({"on_conflict": "id"})
            request = Request(
                f"{supabase_url.rstrip('/')}/rest/v1/{table}?{query}",
                data=json.dumps(batch).encode("utf-8"),
                method="POST",
                headers={
                    "apikey": service_key,
                    "Authorization": f"Bearer {service_key}",
                    "Content-Type": "application/json",
                    "Prefer": "resolution=ignore-duplicates,return=minimal",
                },
            )
            try:
                with urlopen(request, timeout=30) as response:
                    if response.status not in (200, 201, 204):
                        raise RuntimeError(f"Unexpected Supabase response: {response.status}")
            except HTTPError as error:
                detail = error.read().decode("utf-8", errors="replace")
                raise RuntimeError(f"Import failed for {table}: HTTP {error.code}: {detail}") from error
            imported[table] += len(batch)
    return imported


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("bundle", type=Path)
    parser.add_argument("--supabase-url", default=os.environ.get("SUPABASE_URL"))
    parser.add_argument("--service-key", default=os.environ.get("SUPABASE_SERVICE_ROLE_KEY"))
    args = parser.parse_args()

    if not args.supabase_url or not args.service_key:
        parser.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or pass both flags.")
    if not args.bundle.is_file():
        parser.error(f"Bundle not found: {args.bundle}")

    bundle = json.loads(args.bundle.read_text(encoding="utf-8"))
    imported = import_bundle(bundle, args.supabase_url, args.service_key)
    print(f"Submitted rows without overwriting existing IDs: {imported}")


if __name__ == "__main__":
    main()

