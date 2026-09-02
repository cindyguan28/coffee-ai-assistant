import sqlite3
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from database import db


class DatabaseMigrationTest(unittest.TestCase):
    def test_existing_brew_logs_gain_aroma_without_losing_records(self):
        with tempfile.TemporaryDirectory() as directory:
            database_path = Path(directory) / "coffee.db"
            connection = sqlite3.connect(database_path)
            connection.execute(
                """
                CREATE TABLE brew_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    score REAL
                )
                """
            )
            connection.execute("INSERT INTO brew_logs (score) VALUES (8.5)")
            connection.commit()
            connection.close()

            with patch.object(db, "DB_PATH", database_path):
                db.init_db()

            connection = sqlite3.connect(database_path)
            columns = {
                row[1] for row in connection.execute("PRAGMA table_info(brew_logs)")
            }
            row_count = connection.execute("SELECT COUNT(*) FROM brew_logs").fetchone()[0]
            connection.close()

            self.assertIn("aroma", columns)
            self.assertEqual(row_count, 1)


if __name__ == "__main__":
    unittest.main()
