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