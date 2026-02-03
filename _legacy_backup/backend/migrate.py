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

print(f"Existing columns: {columns}")

if "start_date" not in columns:
    print("Adding start_date...")
    try:
        cursor.execute("ALTER TABLE competitions ADD COLUMN start_date TIMESTAMP")
        print("Success.")
    except Exception as e:
        print(f"Error adding start_date: {e}")
else:
    print("start_date already exists.")

if "end_date" not in columns:
    print("Adding end_date...")
    try:
        cursor.execute("ALTER TABLE competitions ADD COLUMN end_date TIMESTAMP")
        print("Success.")
    except Exception as e:
        print(f"Error adding end_date: {e}")
else:
    print("end_date already exists.")

conn.commit()
conn.close()
