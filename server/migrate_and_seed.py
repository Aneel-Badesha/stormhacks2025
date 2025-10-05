#!/usr/bin/env python3
"""
Migrate database to new schema and seed with mock data
"""
import sqlite3
import bcrypt
from datetime import datetime
import random

DB_PATH = 'data/rewards.db'

# Mock company data matching the format
MOCK_COMPANIES = [
    {
        'name': 'Great Dane Coffee',
        'category': 'Coffee',
        'color': '#616161',
        'description': 'Light-filled coffee shop offering baked goods & sandwiches, plus an outdoor patio with a fireplace.',
        'program_description': 'Great Dane Coffee Rewards lets you earn danes with every purchase. Collect danes to redeem free drinks, food, and merchandise. Enjoy personalized offers, free refills on brewed coffee and tea, and a free birthday reward. Members also get early access to new products and exclusive promotions.',
        'login_email': 'greatdane@example.com',
        'target_score': 10,
        'cash_per_redeem': 5.0
    },
    {
        'name': "Ayoub's Dried Fruits and Nuts",
        'category': 'Grocery',
        'color': '#86c447',
        'description': "Ayoub’s is a Canadian specialty retailer known for premium roasted nuts, dried fruits, and snacks. Blending traditional Middle Eastern roasting techniques with fresh, natural ingredients, Ayoub’s has been serving handcrafted snacks since 2009.",
        'program_description': 'Join Ayoub’s Rewards to earn points on every purchase. Redeem them for free nuts, dried fruits, and treats, and enjoy exclusive offers, member discounts, and seasonal promotions.',
        'login_email': 'ayoub@example.com',
        'target_score': 1,
        'cash_per_redeem': 10.0
    },
    {
        'name': 'Fujiya',
        'category': 'Grocery',
        'color': '#FFC72C',
        'description': 'Fujiya is a beloved Japanese grocery store and deli in Vancouver, offering authentic Japanese ingredients, fresh sushi, bento boxes, and imported snacks. Since 1977, it’s been a go-to destination for quality Japanese food and everyday essentials.',
        'program_description': 'Join Fujiya Rewards to earn points on every purchase. Redeem them for free sushi, bento boxes, and treats, and enjoy exclusive offers, member discounts, and seasonal promotions.',
        'login_email': 'fujiya@example.com',
        'target_score': 10,
        'cash_per_redeem': 15.0
    },
    {
        'name': "Cartems Donuts",
        'category': 'Bakeries & Pastry',
        'color': '#c48c5c',
        'description': "Beloved local donut shop known for creative flavors and quality ingredients, including vegan and gluten-friendly options.",
        'program_description': 'Cartems Club: buy 10 donuts across visits, get 1 free. Member-only seasonal flavor previews.',
        'login_email': 'rewards+cartems@example.com',
        'target_score': 10,
        'cash_per_redeem': 5.0
    },
    {
        'name': "Rain or Shine Ice Cream",
        'category': 'Ice Cream & Gelato',
        'color': '#ff9aa2',
        'description': "Small-batch ice cream made in-house with local ingredients and rotating seasonal flavors.",
        'program_description': 'Scoop Squad: 7 scoops earns a free single; occasional double-stamp days.',
        'login_email': 'rewards+rainorshine@example.com',
        'target_score': 7,
        'cash_per_redeem': 6.0
    },
    {
        'name': "The Juice Truck",
        'category': 'Juice & Smoothie Bars',
        'color': '#4caf50',
        'description': "Cold-pressed juices and smoothies with a focus on wellness and whole foods.",
        'program_description': 'Juice Miles: collect 8 stamps for a free smoothie or juice shot bundle.',
        'login_email': 'rewards+juicetruck@example.com',
        'target_score': 8,
        'cash_per_redeem': 7.0
    },
    {
        'name': "Meat & Bread",
        'category': 'Bagels & Sandwich Shops',
        'color': '#d4a373',
        'description': "Simple menu, perfected: porchetta and rotating sandwiches served with house condiments.",
        'program_description': 'Sandwich Stamps: 9 sandwiches gets your 10th free.',
        'login_email': 'rewards+meatandbread@example.com',
        'target_score': 9,
        'cash_per_redeem': 12.0
    },
    {
        'name': "Marutama Ramen",
        'category': 'Pho & Ramen',
        'color': '#f57c00',
        'description': "Chicken-based ramen shop known for silky broth and fresh noodles made daily.",
        'program_description': 'Ramen Rewards: 9 bowls earns a free classic ramen or topping bundle.',
        'login_email': 'rewards+marutama@example.com',
        'target_score': 9,
        'cash_per_redeem': 15.0
    },
    {
        'name': "Tacofino Ocho",
        'category': 'Tacos & Food Trucks',
        'color': '#ff7043',
        'description': "Born from a Tofino food truck, serving West Coast tacos and burritos with bold flavors.",
        'program_description': 'Taco Tally: buy 10 tacos across visits, get $10 off your next order.',
        'login_email': 'rewards+tacofino@example.com',
        'target_score': 10,
        'cash_per_redeem': 10.0
    },
    {
        'name': "Nero Waffle Bar",
        'category': 'Dessert Cafés',
        'color': '#ad5389',
        'description': "Brussels and Liège waffles with sweet and savory toppings in a cozy café setting.",
        'program_description': 'Waffle Punches: 8 waffles earns a free classic waffle.',
        'login_email': 'rewards+nero@example.com',
        'target_score': 8,
        'cash_per_redeem': 9.0
    },
    {
        'name': "O5 Tea",
        'category': 'Tea Houses',
        'color': '#6b8e23',
        'description': "Single-origin teas sourced directly from growers, plus curated tastings and workshops.",
        'program_description': 'O5 Leaves: buy 10 pots or pouches, get a free tasting flight.',
        'login_email': 'rewards+o5tea@example.com',
        'target_score': 10,
        'cash_per_redeem': 9.0
    },
    {
        'name': "The Flower Factory",
        'category': 'Florists',
        'color': '#7cb342',
        'description': "Independent florist crafting seasonal bouquets and event arrangements with local blooms.",
        'program_description': 'Blooms Bonus: spend $200 total to earn $15 off your next bouquet.',
        'login_email': 'rewards+flowerfactory@example.com',
        'target_score': 10,
        'cash_per_redeem': 15.0
    },
    {
        'name': "Massy Books",
        'category': 'Bookstores (Indie)',
        'color': '#3f51b5',
        'description': "Indigenous-owned independent bookstore offering new and used titles and community events.",
        'program_description': 'Reader Rewards: spend $150 total to unlock $10 in store credit.',
        'login_email': 'rewards+massy@example.com',
        'target_score': 10,
        'cash_per_redeem': 10.0
    },
    {
        'name': "Good Boy Collective",
        'category': 'Pet Grooming & Boutiques',
        'color': '#8e24aa',
        'description': "Curated pet goods and grooming add-ons focused on quality and comfort.",
        'program_description': 'Paw Points: 5 visits earns a free nail trim or treat bundle.',
        'login_email': 'rewards+goodboy@example.com',
        'target_score': 5,
        'cash_per_redeem': 15.0
    },
    {
        'name': "Barber & Co",
        'category': 'Barbers & Hair Salons',
        'color': '#455a64',
        'description': "Local barbershop collective for classic cuts, hot shaves, and grooming products.",
        'program_description': 'Cut Card: 5 cuts earns 50% off your next service.',
        'login_email': 'rewards+barberco@example.com',
        'target_score': 5,
        'cash_per_redeem': 20.0
    },
    {
        'name': "Onyx Nails Studio",
        'category': 'Nail Salons',
        'color': '#ec407a',
        'description': "Boutique nail studio offering gels, designs, and careful, hygienic service.",
        'program_description': 'Polish Points: 5 manis earns a free add-on (design or paraffin).',
        'login_email': 'rewards+onyxnails@example.com',
        'target_score': 5,
        'cash_per_redeem': 15.0
    },
    {
        'name': "Karma Teachers",
        'category': 'Yoga & Pilates Studios',
        'color': '#26a69a',
        'description': "Community-minded yoga studio with accessible classes and diverse teachers.",
        'program_description': 'Mat Miles: 10 classes earns 1 free drop-in.',
        'login_email': 'rewards+karmateachers@example.com',
        'target_score': 10,
        'cash_per_redeem': 20.0
    },
    {
        'name': "The Hive Bouldering",
        'category': 'Climbing & Fitness',
        'color': '#1e88e5',
        'description': "Local climbing gyms focused on bouldering, movement, and inclusive community.",
        'program_description': 'Climb Counts: 10 drop-ins earns 1 free session.',
        'login_email': 'rewards+hive@example.com',
        'target_score': 10,
        'cash_per_redeem': 22.0
    },
    {
        'name': "Ride On Bike Shop",
        'category': 'Bike Shops (Service)',
        'color': '#607d8b',
        'description': "Neighborhood bike shop for tune-ups, repairs, and commuter upgrades.",
        'program_description': 'Tune Track: 3 standard tunes earns a free minor service.',
        'login_email': 'rewards+rideon@example.com',
        'target_score': 3,
        'cash_per_redeem': 25.0
    },
    {
        'name': "West Boulevard Cleaners",
        'category': 'Dry Cleaners & Tailors',
        'color': '#0097a7',
        'description': "Family dry cleaner and alterations with careful garment care.",
        'program_description': 'Pressed Points: spend $150 total to earn $10 off.',
        'login_email': 'rewards+westblvdcleaners@example.com',
        'target_score': 10,
        'cash_per_redeem': 10.0
    },
    {
        'name': "Shiny Mobile Detailing",
        'category': 'Car Wash & Detailing',
        'color': '#00acc1',
        'description': "Local mobile detailer offering interior and exterior packages at your location.",
        'program_description': 'Shine Stamps: 5 washes earns 1 express wash free.',
        'login_email': 'rewards+shinymobile@example.com',
        'target_score': 5,
        'cash_per_redeem': 18.0
    },
    {
        'name': "Yaletown Coin Laundry",
        'category': 'Laundromats (Wash & Fold)',
        'color': '#5c6bc0',
        'description': "Neighborhood laundromat with wash-and-fold service and same-day options.",
        'program_description': 'Fresh Funds: spend $100 total to earn $10 credit.',
        'login_email': 'rewards+yaletownlaundry@example.com',
        'target_score': 10,
        'cash_per_redeem': 10.0
    },
    {
        'name': "Brassneck Brewery",
        'category': 'Craft Breweries (To-go cans)',
        'color': '#795548',
        'description': "Small-batch brewery on Main Street with rotating taps and fresh can releases.",
        'program_description': 'Can Club: buy 9 four-packs, get $10 off your next.',
        'login_email': 'rewards+brassneck@example.com',
        'target_score': 9,
        'cash_per_redeem': 10.0
    },
    {
        'name': "Bosa Foods",
        'category': 'Specialty Grocers & Delis',
        'color': '#9e9d24',
        'description': "Italian grocer and deli with imported goods, fresh pasta, and pantry staples.",
        'program_description': 'Pantry Points: spend $200 total to earn $15 off.',
        'login_email': 'rewards+bosa@example.com',
        'target_score': 10,
        'cash_per_redeem': 15.0
    },
    {
        'name': "Klippers Organics (Farmers Market)",
        'category': 'Farmers\' Market Vendors',
        'color': '#2a9d8f',
        'description': "Okanagan farm bringing organic produce and preserves to Vancouver markets.",
        'program_description': 'Market Miles: 10 visits earns a $5 credit.',
        'login_email': 'rewards+klippers@example.com',
        'target_score': 10,
        'cash_per_redeem': 5.0
    }
]

def migrate_database():
    """Add new columns to existing tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("🔄 Migrating database schema...")
    
    # Add new columns to companies table
    company_columns = [
        ('program_description', 'TEXT'),
        ('category', 'TEXT'),
        ('color', "TEXT DEFAULT '#6366F1'"),
        ('default_target_score', 'INTEGER DEFAULT 10')
    ]
    
    for col_name, col_type in company_columns:
        try:
            cursor.execute(f'ALTER TABLE companies ADD COLUMN {col_name} {col_type}')
            print(f"  ✅ Added column: companies.{col_name}")
        except sqlite3.OperationalError as e:
            if 'duplicate column name' in str(e):
                print(f"  ⏭️  Column already exists: companies.{col_name}")
            else:
                raise
    
    # Add new columns to rewards table
    reward_columns = [
        ('visits', 'INTEGER DEFAULT 0'),
        ('rewards_earned', 'INTEGER DEFAULT 0'),
        ('total_saved', 'REAL DEFAULT 0.0'),
        ('cash_per_redeem', 'REAL DEFAULT 5.0'),
        ('card_number', 'TEXT')
    ]
    
    for col_name, col_type in reward_columns:
        try:
            cursor.execute(f'ALTER TABLE rewards ADD COLUMN {col_name} {col_type}')
            print(f"  ✅ Added column: rewards.{col_name}")
        except sqlite3.OperationalError as e:
            if 'duplicate column name' in str(e):
                print(f"  ⏭️  Column already exists: rewards.{col_name}")
            else:
                raise
    
    conn.commit()
    conn.close()
    print("✅ Migration complete!\n")

def seed_mock_data():
    """Seed database with mock companies and user cards"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    print("🌱 Seeding mock data...")
    
    # Check if user 1 exists
    user = cursor.execute('SELECT id FROM users WHERE id = 1').fetchone()
    if not user:
        print("❌ User with id=1 not found. Please register first.")
        conn.close()
        return
    
    print("✅ Found user with id=1\n")
    
    # Add mock companies
    company_ids = []
    for company_data in MOCK_COMPANIES:
        # Check if company exists
        existing = cursor.execute(
            'SELECT id FROM companies WHERE name = ?',
            (company_data['name'],)
        ).fetchone()
        
        if existing:
            company_id = existing['id']
            # Update existing company with new fields including login credentials
            password_hash = bcrypt.hashpw(b'password123', bcrypt.gensalt()).decode('utf-8')
            cursor.execute('''
                UPDATE companies 
                SET description = ?,
                    program_description = ?,
                    category = ?,
                    color = ?,
                    default_target_score = ?,
                    login_email = ?,
                    password_hash = ?,
                    is_active = 1
                WHERE id = ?
            ''', (
                company_data['description'],
                company_data['program_description'],
                company_data['category'],
                company_data['color'],
                company_data['target_score'],
                company_data['login_email'],
                password_hash,
                company_id
            ))
            print(f"  ✅ Updated company: {company_data['name']} (id={company_id})")
        else:
            # Create new company
            password_hash = bcrypt.hashpw(b'password123', bcrypt.gensalt()).decode('utf-8')
            cursor.execute('''
                INSERT INTO companies (
                    name, description, program_description, category, color,
                    default_target_score, login_email, password_hash, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                company_data['name'],
                company_data['description'],
                company_data['program_description'],
                company_data['category'],
                company_data['color'],
                company_data['target_score'],
                company_data['login_email'],
                password_hash,
                1
            ))
            company_id = cursor.lastrowid
            print(f"  ✅ Created company: {company_data['name']} (id={company_id})")
        
        company_ids.append((company_id, company_data))
    
    print()
    
    # Add user cards (rewards) for user 1
    for company_id, company_data in company_ids:
        # Check if reward already exists
        existing = cursor.execute(
            'SELECT id FROM rewards WHERE user_id = 1 AND company_id = ?',
            (company_id,)
        ).fetchone()
        
        # Generate random progress
        score = random.randint(0, company_data['target_score'] - 1)
        visits = random.randint(score, score + 5)
        rewards_earned = random.randint(0, 3)
        total_saved = rewards_earned * company_data['cash_per_redeem']
        card_number = f"****{random.randint(1000, 9999)}"
        
        now_iso = datetime.now().isoformat()
        
        if existing:
            # Update existing reward
            cursor.execute('''
                UPDATE rewards 
                SET score = ?,
                    target_score = ?,
                    visits = ?,
                    rewards_earned = ?,
                    total_saved = ?,
                    cash_per_redeem = ?,
                    card_number = ?,
                    updated_at = ?
                WHERE id = ?
            ''', (
                score,
                company_data['target_score'],
                visits,
                rewards_earned,
                total_saved,
                company_data['cash_per_redeem'],
                card_number,
                now_iso,
                existing['id']
            ))
            print(f"  ✅ Updated card: {company_data['name']} - {score}/{company_data['target_score']} punches")
        else:
            # Create new reward
            cursor.execute('''
                INSERT INTO rewards (
                    user_id, company_id, score, target_score, visits,
                    rewards_earned, total_saved, cash_per_redeem, card_number,
                    last_scan_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                1,
                company_id,
                score,
                company_data['target_score'],
                visits,
                rewards_earned,
                total_saved,
                company_data['cash_per_redeem'],
                card_number,
                now_iso
            ))
            print(f"  ✅ Created card: {company_data['name']} - {score}/{company_data['target_score']} punches")
    
    conn.commit()
    conn.close()
    
    print("\n" + "="*60)
    print("✅ Mock data seeding complete!")
    print("="*60)
    print("\nYou can now:")
    print("  • Test API: python3 test_card_api.py")
    print("  • View in DB: Use SQLite extension in VS Code")
    print("  • Start server: python3 server.py")

if __name__ == "__main__":
    try:
        migrate_database()
        seed_mock_data()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
