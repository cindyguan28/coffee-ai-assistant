import sqlite3
from pathlib import Path

DB_PATH = Path("data/coffee.db")


def get_connection():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    return sqlite3.connect(DB_PATH)


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
        brew_method TEXT,
        grinder TEXT,
        grind_setting TEXT,
        dose_g REAL,
        water_g REAL,
        water_temp_c REAL,
        brew_time TEXT,
        score REAL,
        notes TEXT,

        FOREIGN KEY(bean_id) REFERENCES beans(id)
    )
    """)
    migrate_db(cur)
    conn.commit()
    conn.close()

def migrate_db(cur):
    def add_column_if_missing(table_name: str, column_name: str, column_def: str):
        cur.execute(f"PRAGMA table_info({table_name})")
        existing_columns = [row[1] for row in cur.fetchall()]

        if column_name not in existing_columns:
            cur.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_def}")

    add_column_if_missing("brew_logs", "brew_time", "TEXT")


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
    print("Database initialized.")