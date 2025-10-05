#!/usr/bin/env python3
"""Add password_hash column to users table"""
import sqlite3
import os

DB_PATH = 'data/rewards.db'

def add_password_column():
    if not os.path.exists(DB_PATH):
        print(f"ERROR: Database not found at {DB_PATH}")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'password_hash' in columns:
            print("SUCCESS: password_hash column already exists")
        else:
            cursor.execute("ALTER TABLE users ADD COLUMN password_hash TEXT")
            conn.commit()
            print("SUCCESS: Added password_hash column to users table")
    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    add_password_column()
