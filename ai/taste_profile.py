"""Build a personal taste profile from the user's consumed brews."""

from collections.abc import Iterable, Mapping
from typing import Any


SENSORY_DIMENSIONS = (
    "acidity",
    "sweetness",
    "bitterness",
    "body",
    "balance",
    "aroma",
)

NON_FLAVOR_CATEGORIES = {"acidity", "body", "sweetness", "balance", "style"}


def _number(value: Any) -> float | None:
    if value is None or isinstance(value, bool):
        return None

    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def calculate_liking_weighted_profile(
    brew_logs: Iterable[Mapping[str, Any]],
) -> dict[str, Any]:
    """Calculate the user's sensory fingerprint from brew-log ratings.

    A brew contributes only when its personal liking score is above five.
    Missing sensory ratings are excluded dimension by dimension so legacy logs
    remain valid without inventing values.
    """

    logs = list(brew_logs)
    weighted_sums = {dimension: 0.0 for dimension in SENSORY_DIMENSIONS}
    dimension_weights = {dimension: 0.0 for dimension in SENSORY_DIMENSIONS}
    contributing_brews = 0
    total_weight = 0.0

    for log in logs:
        score = _number(log.get("score"))
        if score is None:
            continue

        weight = max(score - 5.0, 0.0)
        if weight == 0:
            continue

        contributed = False
        for dimension in SENSORY_DIMENSIONS:
            rating = _number(log.get(dimension))
            if rating is None:
                continue

            weighted_sums[dimension] += rating * weight
            dimension_weights[dimension] += weight
            contributed = True

        if contributed:
            contributing_brews += 1
            total_weight += weight

    values = {
        dimension: (
            round(weighted_sums[dimension] / dimension_weights[dimension], 2)
            if dimension_weights[dimension] > 0
            else None
        )
        for dimension in SENSORY_DIMENSIONS
    }

    return {
        "dimensions": values,
        "dimension_weights": dimension_weights,
        "total_brews": len(logs),
        "contributing_brews": contributing_brews,
        "total_weight": round(total_weight, 2),
    }


def calculate_preferred_flavor_families(
    brew_logs: Iterable[Mapping[str, Any]],
    flavor_taxonomy: Iterable[Mapping[str, Any]],
) -> list[dict[str, Any]]:
    """Rank flavor families found in beans from high-liking brew logs.

    Each family contributes at most once per brew, even when a bean has several
    notes from the same family. This keeps a heavily tagged bean from receiving
    an artificial advantage.
    """

    family_by_note = {
        str(row.get("normalized_value", "")).strip().lower(): str(
            row.get("category", "")
        ).strip()
        for row in flavor_taxonomy
        if row.get("normalized_value")
        and row.get("category") not in NON_FLAVOR_CATEGORIES
    }
    family_weights: dict[str, float] = {}
    family_brews: dict[str, int] = {}

    for log in brew_logs:
        score = _number(log.get("score"))
        if score is None:
            continue

        weight = max(score - 5.0, 0.0)
        if weight == 0:
            continue

        notes = {
            note.strip().lower()
            for note in str(log.get("flavor_notes") or "").split(",")
            if note.strip()
        }
        families = {family_by_note[note] for note in notes if note in family_by_note}

        for family in families:
            family_weights[family] = family_weights.get(family, 0.0) + weight
            family_brews[family] = family_brews.get(family, 0) + 1

    total_family_weight = sum(family_weights.values())
    ranked = [
        {
            "family": family,
            "weight": round(weight, 2),
            "share": round(weight / total_family_weight, 3)
            if total_family_weight
            else 0.0,
            "brew_count": family_brews[family],
        }
        for family, weight in family_weights.items()
    ]
    return sorted(ranked, key=lambda item: (-item["weight"], item["family"]))
