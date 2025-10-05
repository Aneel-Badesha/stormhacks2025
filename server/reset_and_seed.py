#!/usr/bin/env python3
"""
Reset the database and seed it with data from seed.sql
"""
import os
import sqlite3

DB_PATH = 'data/rewards.db'
SCHEMA_PATH = 'data/schema.sql'
SEED_PATH = 'data/seed.sql'

def reset_and_seed():
    """Delete, recreate, and seed the database"""
    
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
    
    # Create fresh database with schema
    print(f"\n📝 Creating fresh database from schema...")
    conn = sqlite3.connect(DB_PATH)
    
    with open(SCHEMA_PATH, 'r') as f:
        schema = f.read()
        conn.executescript(schema)
    
    print("✅ Schema applied!")
    
    # Seed with data
    print(f"\n🌱 Seeding database from {SEED_PATH}...")
    with open(SEED_PATH, 'r') as f:
        seed = f.read()
        conn.executescript(seed)
    
    conn.commit()
    conn.close()
    
    print("✅ Database reset and seeded complete!")
    print("\n" + "="*60)
    print("📊 Database now contains:")
    print("  • 25 companies (all with password: password123)")
    print("  • 11 users (customers)")
    print("  • Sample reward cards")
    print("="*60)
    print("\nYou can now:")
    print("  • Start the server: python3 server.py")
    print("  • Login with: greatdane@example.com / password123")
    print("  • Or any other company email from seed.sql")

if __name__ == "__main__":
    confirm = input("⚠️  This will DELETE all data in the database. Continue? (yes/no): ")
    if confirm.lower() in ['yes', 'y']:
        reset_and_seed()
    else:
        print("❌ Cancelled")
