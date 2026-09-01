import sqlite3
from pathlib import Path

DB_PATH = Path("data/coffee.db")


def get_connection():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    return sqlite3.connect(DB_PATH)



def migrate_db(cur):
    def add_column_if_missing(table_name: str, column_name: str, column_def: str):
        cur.execute(f"PRAGMA table_info({table_name})")
        existing_columns = [row[1] for row in cur.fetchall()]

        if column_name not in existing_columns:
            cur.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_def}")

    # beans
    add_column_if_missing("beans", "price", "REAL")
    add_column_if_missing("beans", "weblink", "TEXT")
    add_column_if_missing("beans", "flavor_notes", "TEXT")
    add_column_if_missing("beans", "acidity", "TEXT")
    add_column_if_missing("beans", "body", "TEXT")
    add_column_if_missing("beans", "sweetness", "TEXT")
    add_column_if_missing("beans", "milk_compatibility", "TEXT")
    add_column_if_missing("beans", "personal_interest", "TEXT")
    add_column_if_missing("beans", "description_raw", "TEXT")
    add_column_if_missing("beans", "notes", "TEXT")

    # brew_logs
    add_column_if_missing("brew_logs", "bean_best_before", "TEXT")
    add_column_if_missing("brew_logs", "machine_model", "TEXT")
    add_column_if_missing("brew_logs", "grinder_type", "TEXT")
    add_column_if_missing("brew_logs", "default_dose_g", "REAL")
    add_column_if_missing("brew_logs", "brew_method", "TEXT")
    add_column_if_missing("brew_logs", "drink_type", "TEXT")
    add_column_if_missing("brew_logs", "grind_setting", "INTEGER")
    add_column_if_missing("brew_logs", "espresso_volume_ml", "REAL")
    add_column_if_missing("brew_logs", "extraction_time_sec", "REAL")
    add_column_if_missing("brew_logs", "milk_ml", "REAL")
    add_column_if_missing("brew_logs", "milk_type", "TEXT")

    add_column_if_missing("brew_logs", "acidity", "INTEGER")
    add_column_if_missing("brew_logs", "bitterness", "INTEGER")
    add_column_if_missing("brew_logs", "body", "INTEGER")
    add_column_if_missing("brew_logs", "sweetness", "INTEGER")
    add_column_if_missing("brew_logs", "balance", "INTEGER")

    add_column_if_missing("brew_logs", "score", "REAL")
    add_column_if_missing("brew_logs", "taste_result", "TEXT")
    add_column_if_missing("brew_logs", "problem_tags", "TEXT")
    add_column_if_missing("brew_logs", "next_adjustment", "TEXT")
    add_column_if_missing("brew_logs", "notes", "TEXT")

def init_db():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS beans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        roaster TEXT,
        country TEXT,
        process TEXT,
        roast_level TEXT,
        price REAL,
        weblink TEXT,

        flavor_notes TEXT,
        acidity TEXT,
        body TEXT,
        sweetness TEXT,
        milk_compatibility TEXT,
        personal_interest TEXT,

        description_raw TEXT,
        notes TEXT,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS bean_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bean_id INTEGER UNIQUE,

        predicted_acidity TEXT,
        predicted_body TEXT,
        predicted_sweetness TEXT,
        predicted_notes TEXT,

        recommended_method TEXT,
        recommended_ratio TEXT,
        recommended_temp TEXT,

        confidence REAL,
        reasoning TEXT,

        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY(bean_id) REFERENCES beans(id)
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS brew_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        bean_id INTEGER,

        brew_date TEXT,
        bean_best_before TEXT,

        machine_model TEXT,
        grinder_type TEXT,
        default_dose_g REAL,

        brew_method TEXT,
        drink_type TEXT,

        grind_setting INTEGER,

        espresso_volume_ml REAL,
        extraction_time_sec REAL,

        milk_ml REAL,
        milk_type TEXT,

        acidity INTEGER,
        bitterness INTEGER,
        body INTEGER,
        sweetness INTEGER,
        balance INTEGER,

        score REAL,

        taste_result TEXT,
        problem_tags TEXT,
        next_adjustment TEXT,
        notes TEXT,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY(bean_id) REFERENCES beans(id)
    )
    """)

    migrate_db(cur)

    conn.commit()
    conn.close()


def execute(query, params=None):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(query, params or [])
    conn.commit()
    conn.close()


def fetch_all(query, params=None):
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(query, params or [])
    rows = cur.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def fetch_one(query, params=None):
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(query, params or [])
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None


if __name__ == "__main__":
    init_db()

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(brew_logs)")
    print("brew_logs columns:")
    for row in cur.fetchall():
        print(row[1])
    conn.close()