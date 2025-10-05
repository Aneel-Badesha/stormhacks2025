import sqlite3
import bcrypt

DB_PATH = 'rewards.db'

def add_test_company():
    """Add test company with sample data"""
    name = "Test Company"
    description = "Demo test company"
    login_email = "test@email.com"
    password = "password"
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    try:
        # Insert company
        cur.execute("""
            INSERT INTO companies (name, description, login_email, password_hash)
            VALUES (?, ?, ?, ?)
        """, (name, description, login_email, password_hash))
        company_id = cur.lastrowid
        
        # Add sample users
        cur.execute("""
            INSERT INTO users (email, phone, full_name)
            VALUES 
                ('customer1@test.com', '+1111111111', 'Test Customer 1'),
                ('customer2@test.com', '+1222222222', 'Test Customer 2'),
                ('customer3@test.com', '+1333333333', 'Test Customer 3')
        """)
        
        # Get user IDs
        user_ids = [1, 2, 3]  # Assuming these are the first users
        
        # Add sample rewards
        cur.execute("""
            INSERT INTO rewards (user_id, company_id, score, target_score, last_scan_at)
            VALUES 
                (?, ?, 3, 10, datetime('now', '-1 day')),
                (?, ?, 7, 10, datetime('now', '-2 hours')),
                (?, ?, 9, 10, datetime('now', '-30 minutes'))
        """, (user_ids[0], company_id, user_ids[1], company_id, user_ids[2], company_id))
        
        conn.commit()
        print(f"Added test company!")
        print(f"   Email: {login_email}")
        print(f"   Password: {password}")
        print(f"   Customers: 3")
        print(f"\nDo: python3 server.py")
        print(f"Login:      http://localhost:5000")
        
    except sqlite3.IntegrityError as e:
        print(f"Data may already exist: {e}")
        print(f"Try logging in with: {login_email} / {password}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    add_test_company()