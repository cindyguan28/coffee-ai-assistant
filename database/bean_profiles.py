"""Bean Profile generation and persistence workflow."""

from collections.abc import Callable

from ai.bean_profile_engine import generate_bean_profile
from database.db import execute, fetch_one


def upsert_bean_profile(bean_id: int, profile: dict) -> None:
    """Persist exactly one generated profile for a bean."""
    execute(
        """
        INSERT INTO bean_profiles
        (
            bean_id,
            predicted_acidity,
            predicted_body,
            predicted_sweetness,
            predicted_notes,
            recommended_method,
            recommended_ratio,
            recommended_temp,
            confidence,
            reasoning
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(bean_id) DO UPDATE SET
            predicted_acidity = excluded.predicted_acidity,
            predicted_body = excluded.predicted_body,
            predicted_sweetness = excluded.predicted_sweetness,
            predicted_notes = excluded.predicted_notes,
            recommended_method = excluded.recommended_method,
            recommended_ratio = excluded.recommended_ratio,
            recommended_temp = excluded.recommended_temp,
            confidence = excluded.confidence,
            reasoning = excluded.reasoning,
            generated_at = CURRENT_TIMESTAMP
        """,
        [
            bean_id,
            profile["predicted_acidity"],
            profile["predicted_body"],
            profile["predicted_sweetness"],
            profile["predicted_notes"],
            profile["recommended_method"],
            profile["recommended_ratio"],
            profile["recommended_temp"],
            profile["confidence"],
            profile["reasoning"],
        ],
    )


def generate_and_store_bean_profile(
    bean_id: int,
    generator: Callable[[dict], dict] = generate_bean_profile,
) -> dict:
    """Generate and upsert a profile for an already-persisted bean."""
    bean = fetch_one("SELECT * FROM beans WHERE id = ?", [bean_id])
    if bean is None:
        raise ValueError(f"Bean {bean_id} does not exist.")

    profile = generator(bean)
    upsert_bean_profile(bean_id, profile)
    return profile
