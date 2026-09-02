import unittest

from ai.coffee_summary import build_coffee_summary


class CoffeeSummaryTest(unittest.TestCase):
    def test_maps_existing_reference_fields_to_consumer_scores(self):
        summary = build_coffee_summary(
            {
                "roast_level": "medium_dark",
                "acidity": "low",
                "body": "heavy",
                "sweetness": "high",
                "flavor_notes": "caramel,hazelnut,dark_chocolate",
            }
        )

        self.assertEqual(summary["roast_score"], 4)
        self.assertEqual(summary["intensity_score"], 4)
        self.assertEqual(summary["acidity_score"], 2)
        self.assertEqual(summary["profile_label"], "Sweet & Creamy")
        self.assertEqual(summary["flavor_notes"], ["Caramel", "Hazelnut", "Dark Chocolate"])
        self.assertEqual(summary["recommended_method"], "Espresso / Automatic machine")

    def test_uses_generated_profile_when_explicit_values_are_missing(self):
        summary = build_coffee_summary(
            {
                "roast_level": "light",
                "predicted_acidity": "high",
                "predicted_body": "light",
                "predicted_sweetness": "medium",
                "predicted_notes": "citrus,jasmine",
                "recommended_method": "V60",
            }
        )

        self.assertEqual(summary["profile_label"], "Fruity & Bright")
        self.assertEqual(summary["recommended_method"], "V60")

    def test_missing_data_has_safe_display_values(self):
        summary = build_coffee_summary({})

        self.assertIsNone(summary["roast_score"])
        self.assertEqual(summary["roast_label"], "Not set")
        self.assertEqual(summary["profile_label"], "Balanced & Smooth")


if __name__ == "__main__":
    unittest.main()
