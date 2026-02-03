import sqlite3
import os

DB_PATH = "dev.db"

if not os.path.exists(DB_PATH):
    print(f"Database {DB_PATH} not found!")
    exit(1)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Get existing columns
cursor.execute("PRAGMA table_info(competitions)")
columns = [info[1] for info in cursor.fetchall()]

if "ground_truth_path" not in columns:
    print("Adding ground_truth_path...")
    try:
        cursor.execute("ALTER TABLE competitions ADD COLUMN ground_truth_path TEXT")
        print("Success.")
    except Exception as e:
        print(f"Error adding ground_truth_path: {e}")
else:
    print("ground_truth_path already exists.")

conn.commit()
conn.close()
