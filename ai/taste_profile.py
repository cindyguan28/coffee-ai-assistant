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
