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


def get_flavor_note_options() -> list[str]:
    rows = load_flavor_dictionary()
    notes = sorted({
        row["normalized_value"]
        for row in rows
        if row.get("normalized_value")
    })
    return notes