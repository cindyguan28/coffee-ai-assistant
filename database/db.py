import sqlite3
from pathlib import Path
from config import FLAVOR_NOTES

DB_PATH = Path("coffee.db")

def get_connection():
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
        region TEXT,
        farm TEXT,
        altitude_m TEXT,
        variety TEXT,
        process TEXT,
        roast_level TEXT,
        roast_date TEXT,
        flavor_notes TEXT,
        acidity TEXT,
        sweetness TEXT,
        body TEXT,
        balance TEXT,
        overall_style TEXT,
        original_description TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        ratio REAL,
        water_temp_c REAL,
        bloom_time_sec INTEGER,
        total_brew_time_sec INTEGER,
        perceived_acidity TEXT,
        perceived_sweetness TEXT,
        perceived_body TEXT,
        perceived_balance TEXT,
        score REAL,
        issue_tags TEXT,
        notes TEXT,
        FOREIGN KEY(bean_id) REFERENCES beans(id)
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS grinder_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        grinder TEXT,
        brew_method TEXT,
        grind_setting TEXT,
        particle_description TEXT,
        notes TEXT
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS flavor_taxonomy (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        flavor_note TEXT UNIQUE,
        category TEXT
    )
    """)

    default_profiles = [
        ("Generic", "Espresso", "fine", "fine_sugar_like", "start finer; adjust by flow and extraction time"),
        ("Generic", "Moka Pot", "medium_fine", "fine_salt_like", "slightly coarser than espresso"),
        ("Generic", "V60", "medium", "white_sugar_like", "good starting point for pour-over"),
        ("Generic", "Origami", "medium", "white_sugar_like", "adjust by filter type and drawdown"),
        ("Generic", "Kalita Wave", "medium_fine", "slightly_finer_than_white_sugar", "flat-bottom brewer, often slightly finer"),
        ("Generic", "Aeropress", "medium", "white_sugar_like", "adjust by steep time"),
        ("Generic", "French Press", "coarse", "sea_salt_like", "immersion brew"),
        ("Generic", "Cold Brew", "very_coarse", "coarse_sea_salt_like", "long immersion")
    ]
    cur.executemany("""
    INSERT INTO grinder_profiles (grinder, brew_method, grind_setting, particle_description, notes)
    SELECT ?, ?, ?, ?, ?
    WHERE NOT EXISTS (SELECT 1 FROM grinder_profiles WHERE grinder = ? AND brew_method = ?)
    """, [(g, m, s, p, n, g, m) for g, m, s, p, n in default_profiles])

    flavor_categories = {
        "jasmine":"floral", "rose":"floral", "bergamot":"floral_citrus", "orange_blossom":"floral",
        "lemon":"citrus", "lime":"citrus", "orange":"citrus", "grapefruit":"citrus", "citrus":"citrus",
        "apple":"pome_fruit", "pear":"pome_fruit", "peach":"stone_fruit", "apricot":"stone_fruit", "plum":"stone_fruit",
        "strawberry":"berry", "raspberry":"berry", "blueberry":"berry", "blackberry":"berry",
        "mango":"tropical_fruit", "pineapple":"tropical_fruit", "passion_fruit":"tropical_fruit", "tropical_fruit":"tropical_fruit",
        "honey":"sweet", "brown_sugar":"sweet", "caramel":"sweet", "maple_syrup":"sweet",
        "milk_chocolate":"chocolate", "dark_chocolate":"chocolate", "cocoa":"chocolate",
        "almond":"nutty", "hazelnut":"nutty", "walnut":"nutty", "peanut":"nutty",
        "cinnamon":"spice", "clove":"spice", "black_pepper":"spice", "spice":"spice",
        "black_tea":"tea", "green_tea":"tea", "winey":"fermented", "fermented":"fermented",
        "earthy":"earthy", "woody":"woody", "roasted":"roasted"
    }
    cur.executemany("INSERT OR IGNORE INTO flavor_taxonomy (flavor_note, category) VALUES (?, ?)",
                    [(note, flavor_categories.get(note, "other")) for note in FLAVOR_NOTES])

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized: coffee.db")
