#!/usr/bin/env python3
"""
Reset the database - deletes the old database and creates a fresh one
"""
import os
import sqlite3

DB_PATH = 'data/rewards.db'
SCHEMA_PATH = 'data/schema.sql'

def reset_database():
    """Delete and recreate the database"""
    
    # Delete existing database
    if os.path.exists(DB_PATH):
        print(f"🗑️  Deleting existing database: {DB_PATH}")
        os.remove(DB_PATH)
        
        # Also delete WAL and SHM files if they exist
        for ext in ['-wal', '-shm', '.db-wal', '.db-shm']:
            wal_file = DB_PATH + ext
            if os.path.exists(wal_file):
                os.remove(wal_file)
                print(f"🗑️  Deleted: {wal_file}")
    
    # Create fresh database
    print(f"\n📝 Creating fresh database from schema...")
    conn = sqlite3.connect(DB_PATH)
    
    with open(SCHEMA_PATH, 'r') as f:
        schema = f.read()
        conn.executescript(schema)
    
    conn.commit()
    conn.close()
    
    print("✅ Database reset complete!")
    print("\nYou can now:")
    print("  • Run migrate_and_seed.py to add mock data")
    print("  • Start the server: python3 server.py")
    print("  • Register new users via the API")

if __name__ == "__main__":
    confirm = input("⚠️  This will DELETE all data in the database. Continue? (yes/no): ")
    if confirm.lower() in ['yes', 'y']:
        reset_database()
    else:
        print("❌ Cancelled")
