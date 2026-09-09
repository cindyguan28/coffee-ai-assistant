import sqlite3
import unittest

from scripts.export_sqlite_bundle import build_bundle
from scripts.import_supabase_bundle import _request_headers


USER_ID = "11111111-1111-4111-8111-111111111111"


class CloudMigrationBundleTests(unittest.TestCase):
    def setUp(self):
        self.connection = sqlite3.connect(":memory:")
        self.connection.executescript(
            """
            CREATE TABLE beans (
                id INTEGER PRIMARY KEY, name TEXT, roaster TEXT, country TEXT,
                process TEXT, roast_level TEXT, price REAL, weblink TEXT,
                flavor_notes TEXT, acidity TEXT, body TEXT, sweetness TEXT,
                milk_compatibility TEXT, personal_interest TEXT,
                description_raw TEXT, notes TEXT, created_at TEXT
            );
            CREATE TABLE bean_profiles (
                id INTEGER PRIMARY KEY, bean_id INTEGER, predicted_acidity TEXT,
                predicted_body TEXT, predicted_sweetness TEXT, predicted_notes TEXT,
                recommended_method TEXT, recommended_ratio TEXT, recommended_temp TEXT,
                confidence REAL, reasoning TEXT, generated_at TEXT
            );
            CREATE TABLE brew_logs (
                id INTEGER PRIMARY KEY, bean_id INTEGER, brew_date TEXT,
                bean_best_before TEXT, machine_model TEXT, grinder_type TEXT,
                default_dose_g REAL, brew_method TEXT, drink_type TEXT,
                grind_setting INTEGER, espresso_volume_ml REAL,
                extraction_time_sec REAL, milk_ml REAL, milk_type TEXT,
                acidity INTEGER, bitterness INTEGER, body INTEGER, sweetness INTEGER,
                balance INTEGER, aroma INTEGER, score REAL, taste_result TEXT,
                problem_tags TEXT, next_adjustment TEXT, notes TEXT, created_at TEXT
            );
            INSERT INTO beans (id, name, country, created_at)
            VALUES (7, 'Halo Beriti', 'Ethiopia', '2026-09-01 10:00:00');
            INSERT INTO bean_profiles (id, bean_id, predicted_acidity, confidence)
            VALUES (8, 7, 'high', 0.75);
            INSERT INTO brew_logs (id, bean_id, brew_date, score, acidity)
            VALUES (9, 7, '2026-09-02', 8.5, 4);
            """
        )

    def tearDown(self):
        self.connection.close()

    def test_bundle_preserves_ownership_and_relationships(self):
        bundle = build_bundle(self.connection, USER_ID)
        bean = bundle["tables"]["beans"][0]
        profile = bundle["tables"]["bean_profiles"][0]
        brew = bundle["tables"]["brew_logs"][0]

        self.assertEqual(bundle["counts"], {"beans": 1, "bean_profiles": 1, "brew_logs": 1})
        self.assertEqual(bean["user_id"], USER_ID)
        self.assertEqual(brew["user_id"], USER_ID)
        self.assertEqual(profile["bean_id"], bean["id"])
        self.assertEqual(brew["bean_id"], bean["id"])

    def test_ids_are_deterministic_for_safe_retries(self):
        first = build_bundle(self.connection, USER_ID)
        second = build_bundle(self.connection, USER_ID)
        self.assertEqual(first, second)

    def test_invalid_user_id_is_rejected(self):
        with self.assertRaises(ValueError):
            build_bundle(self.connection, "not-a-uuid")

    def test_current_secret_key_is_not_sent_as_bearer_token(self):
        headers = _request_headers("sb_secret_example")
        self.assertEqual(headers["apikey"], "sb_secret_example")
        self.assertNotIn("Authorization", headers)

    def test_legacy_service_role_jwt_remains_supported(self):
        headers = _request_headers("eyJlegacy")
        self.assertEqual(headers["Authorization"], "Bearer eyJlegacy")


if __name__ == "__main__":
    unittest.main()
