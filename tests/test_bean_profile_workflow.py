import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from database import db
from database.bean_profiles import generate_and_store_bean_profile


class BeanProfileWorkflowTest(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temporary_directory.name) / "coffee.db"
        self.db_path_patch = patch.object(db, "DB_PATH", self.database_path)
        self.db_path_patch.start()
        db.init_db()

    def tearDown(self):
        self.db_path_patch.stop()
        self.temporary_directory.cleanup()

    def add_bean(self, name="Test Bean"):
        return db.execute_insert(
            "INSERT INTO beans (name, country, process, roast_level) VALUES (?, ?, ?, ?)",
            [name, "Ethiopia", "washed", "light"],
        )

    @staticmethod
    def profile(notes="citrus"):
        return {
            "predicted_acidity": "high",
            "predicted_body": "light",
            "predicted_sweetness": "high",
            "predicted_notes": notes,
            "recommended_method": "V60",
            "recommended_ratio": "1:16",
            "recommended_temp": "92",
            "confidence": 0.75,
            "reasoning": "Test profile",
        }

    def test_generates_profile_for_persisted_bean(self):
        bean_id = self.add_bean()

        result = generate_and_store_bean_profile(
            bean_id, generator=lambda bean: self.profile(bean["name"])
        )

        stored = db.fetch_one("SELECT * FROM bean_profiles WHERE bean_id = ?", [bean_id])
        self.assertEqual(result["predicted_notes"], "Test Bean")
        self.assertEqual(stored["predicted_notes"], "Test Bean")

    def test_regeneration_upserts_instead_of_creating_duplicate(self):
        bean_id = self.add_bean()
        generate_and_store_bean_profile(bean_id, generator=lambda bean: self.profile("first"))
        generate_and_store_bean_profile(bean_id, generator=lambda bean: self.profile("second"))

        profiles = db.fetch_all("SELECT * FROM bean_profiles WHERE bean_id = ?", [bean_id])
        self.assertEqual(len(profiles), 1)
        self.assertEqual(profiles[0]["predicted_notes"], "second")

    def test_generation_failure_keeps_the_saved_bean(self):
        bean_id = self.add_bean()

        def fail(_bean):
            raise RuntimeError("generator unavailable")

        with self.assertRaisesRegex(RuntimeError, "generator unavailable"):
            generate_and_store_bean_profile(bean_id, generator=fail)

        self.assertIsNotNone(db.fetch_one("SELECT * FROM beans WHERE id = ?", [bean_id]))
        self.assertIsNone(
            db.fetch_one("SELECT * FROM bean_profiles WHERE bean_id = ?", [bean_id])
        )


if __name__ == "__main__":
    unittest.main()
