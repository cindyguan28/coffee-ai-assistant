import csv
from pathlib import Path


KNOWLEDGE_DIR = Path("knowledge")


def load_csv(filename: str) -> list[dict]:
    path = KNOWLEDGE_DIR / filename

    if not path.exists():
        return []

    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def load_origin_profiles() -> list[dict]:
    return load_csv("origin_profiles.csv")


def load_processing_profiles() -> list[dict]:
    return load_csv("processing_profiles.csv")


def load_roast_profiles() -> list[dict]:
    return load_csv("roast_profiles.csv")


def load_flavor_dictionary() -> list[dict]:
    return load_csv("flavor_dictionary.csv")


def load_roaster_profiles() -> list[dict]:
    return load_csv("roaster_profiles.csv")


def get_country_options() -> list[str]:
    rows = load_origin_profiles()
    countries = sorted({row["country"] for row in rows if row.get("country")})
    return [""] + countries


def get_process_options() -> list[str]:
    rows = load_processing_profiles()
    processes = sorted({row["process"] for row in rows if row.get("process")})
    return [""] + processes


def get_roast_level_options() -> list[str]:
    rows = load_roast_profiles()
    roast_levels = sorted({row["roast_level"] for row in rows if row.get("roast_level")})
    return [""] + roast_levels


def get_flavor_note_options() -> list[tuple[str, str]]:
    rows = load_flavor_dictionary()
    seen = set()
    options = []

    for row in rows:
        normalized = row.get("normalized_value")
        if not normalized or normalized in seen:
            continue

        seen.add(normalized)
        display = row.get("en") or row.get("de") or normalized
        options.append((normalized, display))

    options.sort(key=lambda item: item[1].lower())
    return options


def get_roaster_options() -> list[str]:
    rows = load_roaster_profiles()
    roasters = sorted({row["roaster"] for row in rows if row.get("roaster")})
    return roasters


def get_roaster_profile(roaster_name: str) -> dict | None:
    rows = load_roaster_profiles()
    for row in rows:
        if row.get("roaster") and row["roaster"].strip().lower() == roaster_name.strip().lower():
            return row
    return None


def get_roaster_options() -> list[str]:
    rows = load_roaster_profiles()
    roasters = sorted({row["roaster"] for row in rows if row.get("roaster")})
    return roasters