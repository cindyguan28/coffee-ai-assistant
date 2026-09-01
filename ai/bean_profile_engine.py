from database.import_knowledge import (
    load_origin_profiles,
    load_processing_profiles,
    load_roast_profiles,
    load_flavor_dictionary,
)


def split_csv(value: str) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def find_by_value(rows: list[dict], key: str, value: str) -> dict | None:
    if not value:
        return None

    value_clean = value.strip().lower()

    for row in rows:
        if row.get(key, "").strip().lower() == value_clean:
            return row

    return None


def match_description(description_raw: str) -> dict:
    """
    用 flavor_dictionary.csv 解析德语/英语/中文描述。
    例如：
    ausgewogen, kräftig und würzig, aber mit dezenter Säure
    """
    if not description_raw:
        return {
            "matched_notes": [],
            "matched_acidity": None,
            "matched_body": None,
            "matched_sweetness": None,
            "matched_balance": None,
            "matched_terms": [],
        }

    text = description_raw.lower()
    dictionary = load_flavor_dictionary()

    matched_notes = []
    matched_terms = []
    matched_acidity = None
    matched_body = None
    matched_sweetness = None
    matched_balance = None

    for row in dictionary:
        de = row.get("de", "").lower()
        en = row.get("en", "").lower()
        zh = row.get("zh", "").lower()
        category = row.get("category", "")
        normalized = row.get("normalized_value", "")

        candidates = [de, en, zh]

        if any(candidate and candidate in text for candidate in candidates):
            matched_terms.append(
                {
                    "category": category,
                    "de": row.get("de"),
                    "en": row.get("en"),
                    "zh": row.get("zh"),
                    "normalized_value": normalized,
                }
            )

            if category == "acidity":
                matched_acidity = normalized
            elif category == "body":
                matched_body = normalized
            elif category == "sweetness":
                matched_sweetness = normalized
            elif category == "balance":
                matched_balance = normalized
            else:
                matched_notes.append(normalized)

    return {
        "matched_notes": list(dict.fromkeys(matched_notes)),
        "matched_acidity": matched_acidity,
        "matched_body": matched_body,
        "matched_sweetness": matched_sweetness,
        "matched_balance": matched_balance,
        "matched_terms": matched_terms,
    }


def generate_bean_profile(bean: dict) -> dict:
    country = bean.get("country")
    process = bean.get("process")
    roast_level = bean.get("roast_level")
    description_raw = bean.get("description_raw")

    origin_profiles = load_origin_profiles()
    processing_profiles = load_processing_profiles()
    roast_profiles = load_roast_profiles()

    origin = None
    if country:
        # support multiple origin countries stored as comma-separated values
        origin_candidates = [item.strip() for item in country.split(",") if item.strip()]
        for candidate in origin_candidates:
            origin = find_by_value(origin_profiles, "country", candidate)
            if origin:
                break

    process_profile = find_by_value(processing_profiles, "process", process)
    roast_profile = find_by_value(roast_profiles, "roast_level", roast_level)
    desc_match = match_description(description_raw)

    notes = []
    reasoning = []
    confidence_points = 0
    max_points = 4

    predicted_acidity = None
    predicted_body = None
    predicted_sweetness = None
    recommended_method = "V60"
    recommended_ratio = "1:16"
    recommended_temp = "92"

    if origin:
        predicted_acidity = origin.get("acidity") or predicted_acidity
        predicted_body = origin.get("body") or predicted_body
        predicted_sweetness = origin.get("sweetness") or predicted_sweetness
        notes.extend(split_csv(origin.get("common_notes")))
        methods = split_csv(origin.get("recommended_methods"))
        if methods:
            recommended_method = methods[0]

        reasoning.append(f"Origin profile matched: {country}")
        confidence_points += 1

    if process_profile:
        predicted_acidity = process_profile.get("expected_acidity") or predicted_acidity
        predicted_body = process_profile.get("expected_body") or predicted_body
        predicted_sweetness = process_profile.get("expected_sweetness") or predicted_sweetness
        notes.extend(split_csv(process_profile.get("common_characteristics")))

        reasoning.append(f"Processing profile matched: {process}")
        confidence_points += 1

    if roast_profile:
        predicted_acidity = roast_profile.get("acidity") or predicted_acidity
        predicted_body = roast_profile.get("body") or predicted_body
        recommended_temp = roast_profile.get("recommended_temp") or recommended_temp
        notes.extend(split_csv(roast_profile.get("expected_notes")))

        reasoning.append(f"Roast profile matched: {roast_level}")
        confidence_points += 1

    if desc_match["matched_notes"]:
        notes.extend(desc_match["matched_notes"])
        reasoning.append("Raw description matched flavor dictionary.")

    if desc_match["matched_acidity"]:
        predicted_acidity = desc_match["matched_acidity"]
        reasoning.append("Acidity inferred from raw description.")

    if desc_match["matched_body"]:
        predicted_body = desc_match["matched_body"]
        reasoning.append("Body inferred from raw description.")

    if desc_match["matched_sweetness"]:
        predicted_sweetness = desc_match["matched_sweetness"]
        reasoning.append("Sweetness inferred from raw description.")

    if description_raw:
        confidence_points += 1

    notes = list(dict.fromkeys([note for note in notes if note]))

    confidence = round(confidence_points / max_points, 2)

    return {
        "predicted_acidity": predicted_acidity or "unknown",
        "predicted_body": predicted_body or "unknown",
        "predicted_sweetness": predicted_sweetness or "unknown",
        "predicted_notes": ",".join(notes),
        "recommended_method": recommended_method,
        "recommended_ratio": recommended_ratio,
        "recommended_temp": recommended_temp,
        "confidence": confidence,
        "reasoning": " | ".join(reasoning) if reasoning else "Insufficient data. Profile generated with default assumptions.",
    }