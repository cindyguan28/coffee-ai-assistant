#!/usr/bin/env python3
"""Export one local SQLite database into a deterministic Supabase import bundle."""

from __future__ import annotations

import argparse
import json
import sqlite3
import uuid
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB = ROOT_DIR / "data" / "coffee.db"


def _stable_id(user_id: str, table: str, legacy_id: int) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"mylot:{user_id}:{table}:{legacy_id}"))


def _rows(connection: sqlite3.Connection, table: str) -> list[dict[str, Any]]:
    connection.row_factory = sqlite3.Row
    return [dict(row) for row in connection.execute(f"SELECT * FROM {table} ORDER BY id")]


def _blank_to_none(value: Any) -> Any:
    return None if value == "" else value


def build_bundle(connection: sqlite3.Connection, user_id: str) -> dict[str, Any]:
    """Build a repeatable bundle without changing the source database."""
    canonical_user_id = str(uuid.UUID(user_id))
    source_beans = _rows(connection, "beans")
    source_profiles = _rows(connection, "bean_profiles")
    source_brews = _rows(connection, "brew_logs")
    bean_ids = {
        row["id"]: _stable_id(canonical_user_id, "beans", row["id"])
        for row in source_beans
    }

    bean_fields = (
        "name", "roaster", "country", "process", "roast_level", "price", "weblink",
        "flavor_notes", "acidity", "body", "sweetness", "milk_compatibility",
        "personal_interest", "description_raw", "notes", "created_at",
    )
    profile_fields = (
        "predicted_acidity", "predicted_body", "predicted_sweetness", "predicted_notes",
        "recommended_method", "recommended_ratio", "recommended_temp", "confidence",
        "reasoning", "generated_at",
    )
    brew_fields = (
        "brew_date", "bean_best_before", "machine_model", "grinder_type", "default_dose_g",
        "brew_method", "drink_type", "grind_setting", "espresso_volume_ml",
        "extraction_time_sec", "milk_ml", "milk_type", "acidity", "bitterness", "body",
        "sweetness", "balance", "aroma", "score", "taste_result", "problem_tags",
        "next_adjustment", "notes", "created_at",
    )

    beans = [
        {
            "id": bean_ids[row["id"]],
            "user_id": canonical_user_id,
            "legacy_id": row["id"],
            **{field: _blank_to_none(row.get(field)) for field in bean_fields},
        }
        for row in source_beans
    ]
    profiles = [
        {
            "id": _stable_id(canonical_user_id, "bean_profiles", row["id"]),
            "bean_id": bean_ids[row["bean_id"]],
            "legacy_id": row["id"],
            **{field: _blank_to_none(row.get(field)) for field in profile_fields},
        }
        for row in source_profiles
        if row.get("bean_id") in bean_ids
    ]
    brew_logs = [
        {
            "id": _stable_id(canonical_user_id, "brew_logs", row["id"]),
            "user_id": canonical_user_id,
            "bean_id": bean_ids.get(row.get("bean_id")),
            "legacy_id": row["id"],
            **{field: _blank_to_none(row.get(field)) for field in brew_fields},
        }
        for row in source_brews
    ]

    return {
        "format": "mylot-supabase-import-v1",
        "user_id": canonical_user_id,
        "tables": {"beans": beans, "bean_profiles": profiles, "brew_logs": brew_logs},
        "counts": {
            "beans": len(beans),
            "bean_profiles": len(profiles),
            "brew_logs": len(brew_logs),
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--user-id", required=True, help="Supabase auth.users UUID that owns the data")
    parser.add_argument("--db", type=Path, default=DEFAULT_DB, help="Source SQLite database")
    parser.add_argument("--output", type=Path, required=True, help="Private JSON bundle destination")
    args = parser.parse_args()

    if not args.db.is_file():
        parser.error(f"SQLite database not found: {args.db}")
    if args.output.exists():
        parser.error(f"Refusing to overwrite existing bundle: {args.output}")

    with sqlite3.connect(args.db) as connection:
        bundle = build_bundle(connection, args.user_id)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(bundle, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Exported {bundle['counts']} to {args.output}")


if __name__ == "__main__":
    main()

