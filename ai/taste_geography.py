"""Country-level coffee preference aggregation for Taste Geography."""

from collections.abc import Iterable, Mapping
from typing import Any
import re
import unicodedata


SENSORY_DIMENSIONS = (
    "acidity",
    "sweetness",
    "bitterness",
    "body",
    "balance",
    "aroma",
)

NON_FLAVOR_CATEGORIES = {"acidity", "body", "sweetness", "balance", "style"}


COUNTRIES = {
    "Bolivia": ("BOL", ("bolivia", "bolivien", "玻利维亚")),
    "Brazil": ("BRA", ("brazil", "brasil", "brasilien", "巴西")),
    "Burundi": ("BDI", ("burundi", "布隆迪")),
    "China": ("CHN", ("china", "中国")),
    "Colombia": ("COL", ("colombia", "kolumbien", "哥伦比亚")),
    "Costa Rica": ("CRI", ("costa rica", "哥斯达黎加")),
    "Ecuador": ("ECU", ("ecuador", "厄瓜多尔")),
    "El Salvador": ("SLV", ("el salvador", "萨尔瓦多")),
    "Ethiopia": ("ETH", ("ethiopia", "ethiopien", "äthiopien", "埃塞俄比亚")),
    "Guatemala": ("GTM", ("guatemala", "危地马拉")),
    "Honduras": ("HND", ("honduras", "洪都拉斯")),
    "India": ("IND", ("india", "indien", "印度")),
    "Indonesia": ("IDN", ("indonesia", "indonesien", "印度尼西亚")),
    "Kenya": ("KEN", ("kenya", "肯尼亚")),
    "Laos": ("LAO", ("laos", "老挝")),
    "Malawi": ("MWI", ("malawi", "马拉维")),
    "Mexico": ("MEX", ("mexico", "mexiko", "墨西哥")),
    "Nicaragua": ("NIC", ("nicaragua", "尼加拉瓜")),
    "Panama": ("PAN", ("panama", "巴拿马")),
    "Papua New Guinea": ("PNG", ("papua new guinea", "papua-neuguinea", "巴布亚新几内亚")),
    "Peru": ("PER", ("peru", "秘鲁")),
    "Rwanda": ("RWA", ("rwanda", "ruanda", "卢旺达")),
    "Tanzania": ("TZA", ("tanzania", "tansania", "坦桑尼亚")),
    "Thailand": ("THA", ("thailand", "泰国")),
    "Uganda": ("UGA", ("uganda", "乌干达")),
    "United States": ("USA", ("united states", "usa", "hawaii", "vereinigte staaten", "美国")),
    "Venezuela": ("VEN", ("venezuela", "委内瑞拉")),
    "Vietnam": ("VNM", ("vietnam", "viet nam", "越南")),
    "Yemen": ("YEM", ("yemen", "jemen", "也门")),
}


def _key(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value.strip().lower())
    without_accents = "".join(char for char in normalized if not unicodedata.combining(char))
    return re.sub(r"\s+", " ", without_accents)


COUNTRY_BY_ALIAS = {
    _key(alias): {"country": country, "iso_alpha": iso_alpha}
    for country, (iso_alpha, aliases) in COUNTRIES.items()
    for alias in (country, *aliases)
}


def normalize_country(value: str | None) -> dict[str, str] | None:
    """Return a canonical country name and ISO-3 code without changing source data."""

    if not value or _key(value) in {"", "unknown", "not set", "n/a"}:
        return None
    match = COUNTRY_BY_ALIAS.get(_key(value))
    return dict(match) if match else None


def split_origin_countries(value: str | None) -> tuple[list[dict[str, str]], list[str]]:
    """Split a stored origin into unique mapped countries and unmapped labels."""

    if not value:
        return [], []

    mapped = []
    unmapped = []
    seen = set()
    for original in re.split(r"[,;/]", value):
        original = original.strip()
        if not original:
            continue
        normalized = normalize_country(original)
        if normalized:
            if normalized["iso_alpha"] not in seen:
                seen.add(normalized["iso_alpha"])
                mapped.append({**normalized, "original": original})
        elif _key(original) not in {"unknown", "not set", "n/a"}:
            unmapped.append(original)
    return mapped, unmapped


def _number(value: Any) -> float | None:
    if value is None or isinstance(value, bool):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _average(values: list[float]) -> float | None:
    return round(sum(values) / len(values), 2) if values else None


def aggregate_country_tastes(
    rows: Iterable[Mapping[str, Any]],
    flavor_taxonomy: Iterable[Mapping[str, Any]],
) -> dict[str, Any]:
    """Aggregate bean and personal brew data at country level."""

    family_by_note = {
        str(row.get("normalized_value", "")).strip().lower(): str(
            row.get("category", "")
        ).strip()
        for row in flavor_taxonomy
        if row.get("normalized_value")
        and row.get("category") not in NON_FLAVOR_CATEGORIES
    }
    buckets: dict[str, dict[str, Any]] = {}
    unmapped_origins = set()

    for row in rows:
        origins, unmapped = split_origin_countries(row.get("country"))
        unmapped_origins.update(unmapped)

        for origin in origins:
            bucket = buckets.setdefault(
                origin["iso_alpha"],
                {
                    "country": origin["country"],
                    "iso_alpha": origin["iso_alpha"],
                    "bean_ids": set(),
                    "brewed_bean_ids": set(),
                    "brew_ids": set(),
                    "liking": [],
                    "sensory": {dimension: [] for dimension in SENSORY_DIMENSIONS},
                    "processes": {},
                    "family_weights": {},
                },
            )

            bean_id = row.get("bean_id")
            brew_id = row.get("brew_id")
            if bean_id is not None:
                bucket["bean_ids"].add(bean_id)

            process = str(row.get("process") or "").strip()
            if process and bean_id is not None:
                process_stats = bucket["processes"].setdefault(
                    process, {"bean_ids": set(), "liking": []}
                )
                process_stats["bean_ids"].add(bean_id)

            if brew_id is None or brew_id in bucket["brew_ids"]:
                continue

            bucket["brew_ids"].add(brew_id)
            if bean_id is not None:
                bucket["brewed_bean_ids"].add(bean_id)
            score = _number(row.get("score"))
            if score is not None:
                bucket["liking"].append(score)
                if process:
                    bucket["processes"][process]["liking"].append(score)

            for dimension in SENSORY_DIMENSIONS:
                rating = _number(row.get(dimension))
                if rating is not None:
                    bucket["sensory"][dimension].append(rating)

            flavor_weight = max(score - 5.0, 0.0) if score is not None else 0.0
            if flavor_weight:
                notes = {
                    note.strip().lower()
                    for note in str(row.get("flavor_notes") or "").split(",")
                    if note.strip()
                }
                families = {
                    family_by_note[note] for note in notes if note in family_by_note
                }
                for family in families:
                    bucket["family_weights"][family] = (
                        bucket["family_weights"].get(family, 0.0) + flavor_weight
                    )

    countries = []
    for bucket in buckets.values():
        process_ranking = []
        for process, stats in bucket["processes"].items():
            process_ranking.append(
                (
                    _average(stats["liking"]),
                    len(stats["bean_ids"]),
                    process,
                )
            )
        process_ranking.sort(
            key=lambda item: (
                -(item[0] if item[0] is not None else -1),
                -item[1],
                item[2],
            )
        )
        family_ranking = sorted(
            bucket["family_weights"].items(), key=lambda item: (-item[1], item[0])
        )

        countries.append(
            {
                "country": bucket["country"],
                "iso_alpha": bucket["iso_alpha"],
                "coffee_count": len(bucket["bean_ids"]),
                "brewed_coffee_count": len(bucket["brewed_bean_ids"]),
                "brew_count": len(bucket["brew_ids"]),
                "average_liking": _average(bucket["liking"]),
                **{
                    f"average_{dimension}": _average(bucket["sensory"][dimension])
                    for dimension in SENSORY_DIMENSIONS
                },
                "preferred_process": process_ranking[0][2] if process_ranking else None,
                "top_flavor_families": [family for family, _ in family_ranking[:3]],
            }
        )

    return {
        "countries": sorted(countries, key=lambda item: item["country"]),
        "unmapped_origins": sorted(unmapped_origins),
    }
