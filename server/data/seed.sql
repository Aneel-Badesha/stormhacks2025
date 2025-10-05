-- seed.sql — one-shot data insert for users, companies, rewards
PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

-- Optional resets (comment out if you don't want to wipe)
DELETE FROM rewards;
DELETE FROM companies;

-- ----------------------------
-- Companies (25 Vancouver businesses)
-- ----------------------------
-- All companies use password = "password123"
-- Generated bcrypt hash: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TuWJV7wGVFvzv4w8P3nq8kj2.lW6
INSERT INTO companies (id, name, description, program_description, category, color, default_target_score, login_email, password_hash, is_active, created_at)
VALUES
  (1, 'Great Dane Coffee', 'Light-filled coffee shop offering baked goods & sandwiches, plus an outdoor patio with a fireplace.', 'Great Dane Coffee Rewards lets you earn danes with every purchase. Collect danes to redeem free drinks, food, and merchandise. Enjoy personalized offers, free refills on brewed coffee and tea, and a free birthday reward. Members also get early access to new products and exclusive promotions.', 'Coffee', '#616161', 10, 'greatdane@example.com', '$2b$12$gTaB597zpfLTUNtx5Ddx3.c5v5s9aewe2R.nKORf3cQr8lx3/Xrny', 1, CURRENT_TIMESTAMP),
  (2, 'Ayoub''s Dried Fruits and Nuts', 'Ayoub''s is a Canadian specialty retailer known for premium roasted nuts, dried fruits, and snacks. Blending traditional Middle Eastern roasting techniques with fresh, natural ingredients, Ayoub''s has been serving handcrafted snacks since 2009.', 'Join Ayoub''s Rewards to earn points on every purchase. Redeem them for free nuts, dried fruits, and treats, and enjoy exclusive offers, member discounts, and seasonal promotions.', 'Grocery', '#86c447', 1, 'ayoub@example.com', '$2b$12$gTaB597zpfLTUNtx5Ddx3.c5v5s9aewe2R.nKORf3cQr8lx3/Xrny', 1, CURRENT_TIMESTAMP),
  (3, 'Fujiya', 'Fujiya is a beloved Japanese grocery store and deli in Vancouver, offering authentic Japanese ingredients, fresh sushi, bento boxes, and imported snacks. Since 1977, it''s been a go-to destination for quality Japanese food and everyday essentials.', 'Join Fujiya Rewards to earn points on every purchase. Redeem them for free sushi, bento boxes, and treats, and enjoy exclusive offers, member discounts, and seasonal promotions.', 'Grocery', '#FFC72C', 10, 'fujiya@example.com', '$2b$12$gTaB597zpfLTUNtx5Ddx3.c5v5s9aewe2R.nKORf3cQr8lx3/Xrny', 1, CURRENT_TIMESTAMP),
  (4, 'Cartems Donuts', 'Beloved local donut shop known for creative flavors and quality ingredients, including vegan and gluten-friendly options.', 'Cartems Club: buy 10 donuts across visits, get 1 free. Member-only seasonal flavor previews.', 'Bakeries & Pastry', '#c48c5c', 10, 'rewards+cartems@example.com', '$2b$12$gTaB597zpfLTUNtx5Ddx3.c5v5s9aewe2R.nKORf3cQr8lx3/Xrny', 1, CURRENT_TIMESTAMP),
  (5, 'Rain or Shine Ice Cream', 'Small-batch ice cream made in-house with local ingredients and rotating seasonal flavors.', 'Scoop Squad: 7 scoops earns a free single; occasional double-stamp days.', 'Ice Cream & Gelato', '#ff9aa2', 7, 'rewards+rainorshine@example.com', '$2b$12$gTaB597zpfLTUNtx5Ddx3.c5v5s9aewe2R.nKORf3cQr8lx3/Xrny', 1, CURRENT_TIMESTAMP),
  (6, 'The Juice Truck', 'Cold-pressed juices and smoothies with a focus on wellness and whole foods.', 'Juice Miles: collect 8 stamps for a free smoothie or juice shot bundle.', 'Juice & Smoothie Bars', '#4caf50', 8, 'rewards+juicetruck@example.com', '$2b$12$gTaB597zpfLTUNtx5Ddx3.c5v5s9aewe2R.nKORf3cQr8lx3/Xrny', 1, CURRENT_TIMESTAMP),
  (7, 'Meat & Bread', 'Simple menu, perfected: porchetta and rotating sandwiches served with house condiments.', 'Sandwich Stamps: 9 sandwiches gets your 10th free.', 'Bagels & Sandwich Shops', '#d4a373', 9, 'rewards+meatandbread@example.com', '$2b$12$gTaB597zpfLTUNtx5Ddx3.c5v5s9aewe2R.nKORf3cQr8lx3/Xrny', 1, CURRENT_TIMESTAMP),
  (8, 'Marutama Ramen', 'Chicken-based ramen shop known for silky broth and fresh noodles made daily.', 'Ramen Rewards: 9 bowls earns a free classic ramen or topping bundle.', 'Pho & Ramen', '#f57c00', 9, 'rewards+marutama@example.com', '$2b$12$gTaB597zpfLTUNtx5Ddx3.c5v5s9aewe2R.nKORf3cQr8lx3/Xrny', 1, CURRENT_TIMESTAMP),
  (9, 'Tacofino Ocho', 'Born from a Tofino food truck, serving West Coast tacos and burritos with bold flavors.', 'Taco Tally: buy 10 tacos across visits, get $10 off your next order.', 'Tacos & Food Trucks', '#ff7043', 10, 'rewards+tacofino@example.com', '$2b$12$gTaB597zpfLTUNtx5Ddx3.c5v5s9aewe2R.nKORf3cQr8lx3/Xrny', 1, CURRENT_TIMESTAMP),
  (10, 'Nero Waffle Bar', 'Brussels and Liège waffles with sweet and savory toppings in a cozy café setting.', 'Waffle Punches: 8 waffles earns a free classic waffle.', 'Dessert Cafés', '#ad5389', 8, 'rewards+nero@example.com', '$2b$12$gTaB597zpfLTUNtx5Ddx3.c5v5s9aewe2R.nKORf3cQr8lx3/Xrny', 1, CURRENT_TIMESTAMP),
  (11, 'O5 Tea', 'Single-origin teas sourced directly from growers, plus curated tastings and workshops.', 'O5 Leaves: buy 10 pots or pouches, get a free tasting flight.', 'Tea Houses', '#6b8e23', 10, 'rewards+o5tea@example.com', '$2b$12$gTaB597zpfLTUNtx5Ddx3.c5v5s9aewe2R.nKORf3cQr8lx3/Xrny', 1, CURRENT_TIMESTAMP),
  (12, 'The Flower Factory', 'Independent florist crafting seasonal bouquets and event arrangements with local blooms.', 'Blooms Bonus: spend $200 total to earn $15 off your next bouquet.', 'Florists', '#7cb342', 10, 'rewards+flowerfactory@example.com', '$2b$12$gTaB597zpfLTUNtx5Ddx3.c5v5s9aewe2R.nKORf3cQr8lx3/Xrny', 1, CURRENT_TIMESTAMP),
  (13, 'Massy Books', 'Indigenous-owned independent bookstore offering new and used titles and community events.', 'Reader Rewards: spend $150 total to unlock $10 in store credit.', 'Bookstores (Indie)', '#3f51b5', 10, 'rewards+massy@example.com', '$2b$12$gTaB597zpfLTUNtx5Ddx3.c5v5s9aewe2R.nKORf3cQr8lx3/Xrny', 1, CURRENT_TIMESTAMP),
  (14, 'Good Boy Collective', 'Curated pet goods and grooming add-ons focused on quality and comfort.', 'Paw Points: 5 visits earns a free nail trim or treat bundle.', 'Pet Grooming & Boutiques', '#8e24aa', 5, 'rewards+goodboy@example.com', '$2b$12$gTaB597zpfLTUNtx5Ddx3.c5v5s9aewe2R.nKORf3cQr8lx3/Xrny', 1, CURRENT_TIMESTAMP),
  (15, 'Barber & Co', 'Local barbershop collective for classic cuts, hot shaves, and grooming products.', 'Cut Card: 5 cuts earns 50% off your next service.', 'Barbers & Hair Salons', '#455a64', 5, 'rewards+barberco@example.com', '$2b$12$gTaB597zpfLTUNtx5Ddx3.c5v5s9aewe2R.nKORf3cQr8lx3/Xrny', 1, CURRENT_TIMESTAMP),
  (16, 'Onyx Nails Studio', 'Boutique nail studio offering gels, designs, and careful, hygienic service.', 'Polish Points: 5 manis earns a free add-on (design or paraffin).', 'Nail Salons', '#ec407a', 5, 'rewards+onyxnails@example.com', '$2b$12$gTaB597zpfLTUNtx5Ddx3.c5v5s9aewe2R.nKORf3cQr8lx3/Xrny', 1, CURRENT_TIMESTAMP),
  (17, 'Karma Teachers', 'Community-minded yoga studio with accessible classes and diverse teachers.', 'Mat Miles: 10 classes earns 1 free drop-in.', 'Yoga & Pilates Studios', '#26a69a', 10, 'rewards+karmateachers@example.com', '$2b$12$gTaB597zpfLTUNtx5Ddx3.c5v5s9aewe2R.nKORf3cQr8lx3/Xrny', 1, CURRENT_TIMESTAMP),
  (18, 'The Hive Bouldering', 'Local climbing gyms focused on bouldering, movement, and inclusive community.', 'Climb Counts: 10 drop-ins earns 1 free session.', 'Climbing & Fitness', '#1e88e5', 10, 'rewards+hive@example.com', '$2b$12$gTaB597zpfLTUNtx5Ddx3.c5v5s9aewe2R.nKORf3cQr8lx3/Xrny', 1, CURRENT_TIMESTAMP),
  (19, 'Ride On Bike Shop', 'Neighborhood bike shop for tune-ups, repairs, and commuter upgrades.', 'Tune Track: 3 standard tunes earns a free minor service.', 'Bike Shops (Service)', '#607d8b', 3, 'rewards+rideon@example.com', '$2b$12$gTaB597zpfLTUNtx5Ddx3.c5v5s9aewe2R.nKORf3cQr8lx3/Xrny', 1, CURRENT_TIMESTAMP),
  (20, 'West Boulevard Cleaners', 'Family dry cleaner and alterations with careful garment care.', 'Pressed Points: spend $150 total to earn $10 off.', 'Dry Cleaners & Tailors', '#0097a7', 10, 'rewards+westblvdcleaners@example.com', '$2b$12$gTaB597zpfLTUNtx5Ddx3.c5v5s9aewe2R.nKORf3cQr8lx3/Xrny', 1, CURRENT_TIMESTAMP),
  (21, 'Shiny Mobile Detailing', 'Local mobile detailer offering interior and exterior packages at your location.', 'Shine Stamps: 5 washes earns 1 express wash free.', 'Car Wash & Detailing', '#00acc1', 5, 'rewards+shinymobile@example.com', '$2b$12$gTaB597zpfLTUNtx5Ddx3.c5v5s9aewe2R.nKORf3cQr8lx3/Xrny', 1, CURRENT_TIMESTAMP),
  (22, 'Yaletown Coin Laundry', 'Neighborhood laundromat with wash-and-fold service and same-day options.', 'Fresh Funds: spend $100 total to earn $10 credit.', 'Laundromats (Wash & Fold)', '#5c6bc0', 10, 'rewards+yaletownlaundry@example.com', '$2b$12$gTaB597zpfLTUNtx5Ddx3.c5v5s9aewe2R.nKORf3cQr8lx3/Xrny', 1, CURRENT_TIMESTAMP),
  (23, 'Brassneck Brewery', 'Small-batch brewery on Main Street with rotating taps and fresh can releases.', 'Can Club: buy 9 four-packs, get $10 off your next.', 'Craft Breweries (To-go cans)', '#795548', 9, 'rewards+brassneck@example.com', '$2b$12$gTaB597zpfLTUNtx5Ddx3.c5v5s9aewe2R.nKORf3cQr8lx3/Xrny', 1, CURRENT_TIMESTAMP),
  (24, 'Bosa Foods', 'Italian grocer and deli with imported goods, fresh pasta, and pantry staples.', 'Pantry Points: spend $200 total to earn $15 off.', 'Specialty Grocers & Delis', '#9e9d24', 10, 'rewards+bosa@example.com', '$2b$12$gTaB597zpfLTUNtx5Ddx3.c5v5s9aewe2R.nKORf3cQr8lx3/Xrny', 1, CURRENT_TIMESTAMP),
  (25, 'Klippers Organics (Farmers Market)', 'Okanagan farm bringing organic produce and preserves to Vancouver markets.', 'Market Miles: 10 visits earns a $5 credit.', 'Farmers'' Market Vendors', '#2a9d8f', 10, 'rewards+klippers@example.com', '$2b$12$gTaB597zpfLTUNtx5Ddx3.c5v5s9aewe2R.nKORf3cQr8lx3/Xrny', 1, CURRENT_TIMESTAMP);

-- ----------------------------
-- Users (10 demo customers)
-- ----------------------------
INSERT INTO users (id, email, phone, full_name, password_hash, created_at) VALUES
  (1,  'alice@example.com',    '+1111111111', 'Alice Anderson',   NULL, CURRENT_TIMESTAMP),
  (2,  'bob@example.com',      '+1222222222', 'Bob Baker',        NULL, CURRENT_TIMESTAMP),
  (3,  'charlie@example.com',  '+1333333333', 'Charlie Chen',     NULL, CURRENT_TIMESTAMP),
  (4,  'diana@example.com',    '+1444444444', 'Diana Davis',      NULL, CURRENT_TIMESTAMP),
  (5,  'evan@example.com',     '+1555555555', 'Evan Evans',       NULL, CURRENT_TIMESTAMP),
  (6,  'fiona@example.com',    '+1666666666', 'Fiona Foster',     NULL, CURRENT_TIMESTAMP),
  (7,  'george@example.com',   '+1777777777', 'George Garcia',    NULL, CURRENT_TIMESTAMP),
  (8,  'hannah@example.com',   '+1888888888', 'Hannah Harris',    NULL, CURRENT_TIMESTAMP),
  (9,  'ian@example.com',      '+1999999999', 'Ian Ingram',       NULL, CURRENT_TIMESTAMP),
  (10, 'julia@example.com',    '+1000000000', 'Julia Johnson',    NULL, CURRENT_TIMESTAMP),
  (11, 'abadesha@outlook.com', '6048806014',  'Aneel',            '$2b$12$5ygQnYdROUTYvIMRrQzvB.Z113m64iVAhulrbPoSsg9tHsf9rRgz6', CURRENT_TIMESTAMP);

-- ------------------------------------------------------
-- Rewards (sample data for first few companies)
-- ------------------------------------------------------
INSERT INTO rewards (user_id, company_id, score, target_score, visits, rewards_earned, total_saved, cash_per_redeem, card_number, last_scan_at, created_at, updated_at) VALUES
  -- Great Dane Coffee (company_id=1)
  (1, 1, 3, 10, 5, 0, 0.0, 5.0, '****1234', datetime('now', '-2 days'),  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (2, 1, 7, 10, 9, 1, 5.0, 5.0, '****5678', datetime('now', '-1 day'),   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (3, 1, 9, 10, 12, 1, 5.0, 5.0, '****9012', datetime('now', '-3 hours'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  -- Ayoub's (company_id=2)
  (1, 2, 0, 1, 2, 2, 20.0, 10.0, '****2345', datetime('now', '-5 days'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (4, 2, 1, 1, 3, 2, 20.0, 10.0, '****6789', datetime('now', '-1 hour'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  -- Fujiya (company_id=3)
  (2, 3, 5, 10, 7, 0, 0.0, 15.0, '****3456', datetime('now', '-4 days'),  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (5, 3, 8, 10, 10, 1, 15.0, 15.0, '****7890', datetime('now', '-2 hours'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  -- Cartems Donuts (company_id=4)
  (3, 4, 4, 10, 6, 0, 0.0, 5.0, '****4567', datetime('now', '-6 days'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (6, 4, 9, 10, 11, 0, 0.0, 5.0, '****8901', datetime('now', '-5 hours'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  -- Rain or Shine Ice Cream (company_id=5)
  (4, 5, 3, 7, 5, 0, 0.0, 6.0, '****5678', datetime('now', '-3 days'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (7, 5, 6, 7, 8, 1, 6.0, 6.0, '****9012', datetime('now', '-1 day'),  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

COMMIT;
