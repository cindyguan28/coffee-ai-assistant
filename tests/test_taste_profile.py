import unittest

from ai.taste_profile import SENSORY_DIMENSIONS, calculate_liking_weighted_profile


class TasteProfileTest(unittest.TestCase):
    def test_uses_consumed_brew_ratings_and_liking_weights(self):
        logs = [
            {
                "score": 6,
                "acidity": 1,
                "sweetness": 2,
                "bitterness": 3,
                "body": 4,
                "balance": 5,
                "aroma": 2,
            },
            {
                "score": 9,
                "acidity": 5,
                "sweetness": 4,
                "bitterness": 3,
                "body": 2,
                "balance": 1,
                "aroma": 5,
            },
        ]

        result = calculate_liking_weighted_profile(logs)

        self.assertEqual(result["contributing_brews"], 2)
        self.assertEqual(result["total_weight"], 5)
        self.assertEqual(result["dimensions"]["acidity"], 4.2)
        self.assertEqual(result["dimensions"]["aroma"], 4.4)

    def test_scores_at_or_below_five_do_not_influence_profile(self):
        result = calculate_liking_weighted_profile(
            [{"score": 5, **dict.fromkeys(SENSORY_DIMENSIONS, 5)}]
        )

        self.assertEqual(result["contributing_brews"], 0)
        self.assertTrue(all(value is None for value in result["dimensions"].values()))

    def test_missing_legacy_dimension_is_not_invented(self):
        result = calculate_liking_weighted_profile(
            [
                {
                    "score": 8,
                    "acidity": 4,
                    "sweetness": 3,
                    "bitterness": 2,
                    "body": 4,
                    "balance": 5,
                    "aroma": None,
                }
            ]
        )

        self.assertEqual(result["dimensions"]["acidity"], 4)
        self.assertIsNone(result["dimensions"]["aroma"])

    def test_empty_history_is_supported(self):
        result = calculate_liking_weighted_profile([])

        self.assertEqual(result["total_brews"], 0)
        self.assertEqual(result["contributing_brews"], 0)


if __name__ == "__main__":
    unittest.main()
