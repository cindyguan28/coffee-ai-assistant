import unittest

from ai.taste_geography import (
    aggregate_country_tastes,
    normalize_country,
    split_origin_countries,
)


class TasteGeographyTest(unittest.TestCase):
    def setUp(self):
        self.taxonomy = [
            {"normalized_value": "lemon", "category": "citrus"},
            {"normalized_value": "jasmine", "category": "floral"},
            {"normalized_value": "cocoa", "category": "chocolate"},
            {"normalized_value": "balanced", "category": "balance"},
        ]

    def test_normalizes_aliases_to_map_compatible_iso_codes(self):
        self.assertEqual(
            normalize_country("Äthiopien"),
            {"country": "Ethiopia", "iso_alpha": "ETH"},
        )
        mapped, unmapped = split_origin_countries("Brazil, Colombia, Brazil")
        self.assertEqual([item["iso_alpha"] for item in mapped], ["BRA", "COL"])
        self.assertEqual(unmapped, [])

    def test_aggregates_multi_country_brews_and_preferences(self):
        rows = [
            {
                "bean_id": 1,
                "brew_id": 10,
                "country": "Ethiopia, Kenya",
                "process": "washed",
                "flavor_notes": "lemon,jasmine,balanced",
                "score": 9,
                "acidity": 5,
                "sweetness": 4,
                "bitterness": 2,
                "body": 3,
                "balance": 5,
                "aroma": 5,
            },
            {
                "bean_id": 1,
                "brew_id": 11,
                "country": "Ethiopia, Kenya",
                "process": "washed",
                "flavor_notes": "lemon,jasmine",
                "score": 7,
                "acidity": 3,
                "sweetness": 4,
                "bitterness": 2,
                "body": 3,
                "balance": 4,
                "aroma": None,
            },
            {
                "bean_id": 2,
                "brew_id": 12,
                "country": "Ethiopia",
                "process": "natural",
                "flavor_notes": "cocoa",
                "score": 5,
                "acidity": 1,
                "sweetness": 3,
                "bitterness": 4,
                "body": 5,
                "balance": 3,
                "aroma": 2,
            },
            {"bean_id": 3, "brew_id": None, "country": "Atlantis"},
        ]

        result = aggregate_country_tastes(rows, self.taxonomy)
        countries = {item["country"]: item for item in result["countries"]}

        self.assertEqual(countries["Ethiopia"]["coffee_count"], 2)
        self.assertEqual(countries["Ethiopia"]["brewed_coffee_count"], 2)
        self.assertEqual(countries["Ethiopia"]["brew_count"], 3)
        self.assertEqual(countries["Ethiopia"]["average_liking"], 7)
        self.assertEqual(countries["Ethiopia"]["average_acidity"], 3)
        self.assertEqual(countries["Ethiopia"]["preferred_process"], "washed")
        self.assertEqual(
            countries["Ethiopia"]["top_flavor_families"], ["citrus", "floral"]
        )
        self.assertEqual(countries["Kenya"]["coffee_count"], 1)
        self.assertEqual(countries["Kenya"]["average_liking"], 8)
        self.assertEqual(result["unmapped_origins"], ["Atlantis"])

    def test_keeps_country_with_a_bean_but_no_brew_data(self):
        result = aggregate_country_tastes(
            [
                {"bean_id": 4, "brew_id": None, "country": "Peru", "process": "washed"},
                {
                    "bean_id": 5,
                    "brew_id": 13,
                    "country": "Peru",
                    "process": "natural",
                    "score": None,
                },
            ],
            self.taxonomy,
        )

        peru = result["countries"][0]
        self.assertEqual(peru["coffee_count"], 2)
        self.assertEqual(peru["brewed_coffee_count"], 1)
        self.assertEqual(peru["brew_count"], 1)
        self.assertIsNone(peru["average_liking"])


if __name__ == "__main__":
    unittest.main()
