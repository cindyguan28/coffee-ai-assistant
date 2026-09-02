"""Consumer-friendly presentation helpers for coffee reference profiles."""

from typing import Any


ROAST_SCORES = {
    "ultra_light": 1,
    "light": 1,
    "medium_light": 2,
    "medium": 3,
    "medium_dark": 4,
    "dark": 5,
}

BODY_SCORES = {
    "light": 1,
    "light_bodied": 1,
    "delicate": 1,
    "silky": 2,
    "smooth": 2,
    "medium": 3,
    "round": 3,
    "creamy": 4,
    "heavy": 4,
    "full_bodied": 4,
    "dense": 5,
    "syrupy": 5,
    "very_heavy": 5,
}

LEVEL_SCORES = {
    "very_low": 1,
    "very_low_acidity": 1,
    "low": 2,
    "low_acidity": 2,
    "low_medium": 2,
    "medium": 3,
    "medium_acidity": 3,
    "medium_high": 4,
    "high": 4,
    "high_acidity": 4,
    "very_high": 5,
    "very_high_acidity": 5,
}

FRUIT_NOTES = {
    "fruit",
    "fruity",
    "citrus",
    "lemon",
    "lime",
    "orange",
    "berry",
    "strawberry",
    "raspberry",
    "blueberry",
    "peach",
    "apricot",
    "mango",
    "tropical_fruit",
}
FLORAL_NOTES = {"floral", "jasmine", "rose", "lavender", "orange_blossom"}
COMFORT_NOTES = {
    "chocolatey",
    "milk_chocolate",
    "dark_chocolate",
    "cocoa",
    "nutty",
    "almond",
    "hazelnut",
    "caramel",
    "toffee",
    "brown_sugar",
}
ROASTY_NOTES = {"roasted", "spicy", "dark_chocolate", "cocoa"}


def _clean(value: Any) -> str:
    return str(value or "").strip().lower().replace("-", "_").replace(" ", "_")


def _first_present(bean: dict[str, Any], *keys: str) -> str:
    for key in keys:
        value = bean.get(key)
        if value and _clean(value) != "unknown":
            return _clean(value)
    return ""


def _split_notes(value: Any) -> list[str]:
    if not value:
        return []
    return list(
        dict.fromkeys(
            _clean(note)
            for note in str(value).split(",")
            if str(note).strip()
        )
    )


def _display(value: str) -> str:
    return value.replace("_", " ").title()


def build_coffee_summary(bean: dict[str, Any]) -> dict[str, Any]:
    """Create a compact reference summary without changing stored bean data."""

    roast_level = _clean(bean.get("roast_level"))
    acidity = _first_present(bean, "acidity", "predicted_acidity")
    body = _first_present(bean, "body", "predicted_body")
    sweetness = _first_present(bean, "sweetness", "predicted_sweetness")
    notes = _split_notes(bean.get("flavor_notes")) or _split_notes(
        bean.get("predicted_notes")
    )

    roast_score = ROAST_SCORES.get(roast_level)
    body_score = BODY_SCORES.get(body)
    acidity_score = LEVEL_SCORES.get(acidity)
    sweetness_score = LEVEL_SCORES.get(sweetness)

    if roast_score is not None and body_score is not None:
        intensity_score = round((roast_score * 0.6) + (body_score * 0.4))
    else:
        intensity_score = roast_score or body_score

    note_set = set(notes)
    if sweetness_score and sweetness_score >= 4 and body_score and body_score >= 3:
        profile_label = "Sweet & Creamy"
        description = "Round, smooth and pleasantly sweet, with an easy, creamy character."
    elif note_set & FRUIT_NOTES and acidity_score and acidity_score >= 4:
        profile_label = "Fruity & Bright"
        description = "Lively and fruit-forward, with a fresh acidity and a clear finish."
    elif note_set & FLORAL_NOTES and roast_score and roast_score <= 2:
        profile_label = "Floral & Light"
        description = "Light and aromatic, with delicate floral notes and a clean cup."
    elif note_set & COMFORT_NOTES:
        profile_label = "Nutty & Chocolatey"
        description = "Comforting and rounded, led by nut, caramel or chocolate-like notes."
    elif (roast_score and roast_score >= 4) or note_set & ROASTY_NOTES:
        profile_label = "Bold & Roasty"
        description = "Full and intense, with a darker roast character and a robust finish."
    else:
        profile_label = "Balanced & Smooth"
        description = "An approachable, balanced cup with a smooth overall character."

    recommended_method = bean.get("recommended_method")
    if not recommended_method:
        if roast_score and roast_score >= 4:
            recommended_method = "Espresso / Automatic machine"
        elif roast_score and roast_score <= 2:
            recommended_method = "V60 / Filter coffee"
        else:
            recommended_method = "Espresso / Filter coffee"

    return {
        "roast_score": roast_score,
        "roast_label": _display(roast_level) if roast_level else "Not set",
        "intensity_score": intensity_score,
        "intensity_label": (
            {1: "Very gentle", 2: "Gentle", 3: "Balanced", 4: "Rich", 5: "Intense"}.get(
                intensity_score,
                "Not set",
            )
        ),
        "acidity_score": acidity_score,
        "acidity_label": (
            {1: "Very low", 2: "Low", 3: "Balanced", 4: "Bright", 5: "Very bright"}.get(
                acidity_score,
                "Not set",
            )
        ),
        "profile_label": profile_label,
        "description": description,
        "flavor_notes": [_display(note) for note in notes[:3]],
        "recommended_method": recommended_method,
    }
