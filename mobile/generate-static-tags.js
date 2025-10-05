/**
 * Generate static NFC tags that NEVER expire!
 * Write these URLs to NFC tags once and they'll work forever.
 */

// Your Expo URL - UPDATE THIS!
const EXPO_URL = 'exp://172.16.189.173:8081';

// Current companies in database (matching migrate_and_seed.py)
const locations = [
  { id: '1', name: 'Great Dane Coffee', merchant: 'greatdane-sfu-001', emoji: '☕' },
  { id: '2', name: "Ayoub's Dried Fruits and Nuts", merchant: 'ayoubs-burnaby-001', emoji: '🥜' },
  { id: '3', name: 'Fujiya', merchant: 'fujiya-vancouver-001', emoji: '🍱' },
  { id: '4', name: 'Subway', merchant: 'subway-sfu-001', emoji: '🥪' },
  { id: '5', name: 'PC Optimum', merchant: 'pcoptimum-superstore-001', emoji: '🛒' },
  { id: '6', name: 'Cartems Donuts', merchant: 'cartems-main-001', emoji: '🍩' },
  { id: '7', name: 'Rain or Shine Ice Cream', merchant: 'rainorshine-kits-001', emoji: '🍦' },
  { id: '8', name: 'The Juice Truck', merchant: 'juicetruck-olympic-001', emoji: '🥤' },
  { id: '9', name: 'Meat & Bread', merchant: 'meatbread-downtown-001', emoji: '🥖' },
  { id: '10', name: 'Marutama Ramen', merchant: 'marutama-robson-001', emoji: '🍜' },
  { id: '11', name: 'Tacofino Ocho', merchant: 'tacofino-hastings-001', emoji: '🌮' },
  { id: '12', name: 'Nero Waffle Bar', merchant: 'nero-commercial-001', emoji: '🧇' },
  { id: '13', name: 'O5 Tea', merchant: 'o5tea-chinatown-001', emoji: '🍵' },
  { id: '14', name: 'The Flower Factory', merchant: 'flowerfactory-main-001', emoji: '💐' },
  { id: '15', name: 'Massy Books', merchant: 'massy-chinatown-001', emoji: '📚' },
  { id: '16', name: 'Good Boy Collective', merchant: 'goodboy-fraser-001', emoji: '🐕' },
  { id: '17', name: 'Barber & Co', merchant: 'barberco-gastown-001', emoji: '💈' },
  { id: '18', name: 'Onyx Nails Studio', merchant: 'onyxnails-broadway-001', emoji: '💅' },
  { id: '19', name: 'Karma Teachers', merchant: 'karmateachers-main-001', emoji: '🧘' },
  { id: '20', name: 'The Hive Bouldering', merchant: 'hive-north-001', emoji: '🧗' },
  { id: '21', name: 'Ride On Bike Shop', merchant: 'rideon-commercial-001', emoji: '🚴' },
  { id: '22', name: 'West Boulevard Cleaners', merchant: 'westblvd-kerrisdale-001', emoji: '👔' },
  { id: '23', name: 'Shiny Mobile Detailing', merchant: 'shiny-mobile-001', emoji: '🚗' },
  { id: '24', name: 'Yaletown Coin Laundry', merchant: 'yaletown-laundry-001', emoji: '🧺' },
  { id: '25', name: 'Brassneck Brewery', merchant: 'brassneck-main-001', emoji: '🍺' },
  { id: '26', name: 'Bosa Foods', merchant: 'bosa-burnaby-001', emoji: '🍝' },
  { id: '27', name: 'Klippers Organics', merchant: 'klippers-market-001', emoji: '🥕' },
];

console.log('\n=== STATIC NFC TAGS (NEVER EXPIRE!) ===\n');
console.log('Write these URLs to NFC tags ONCE and they work forever:\n');

locations.forEach((location) => {
  // For Expo Go development
  const expoUrl = `${EXPO_URL}/--/scan?program=${location.id}&merchant=${location.merchant}`;
  
  // For production app
  const prodUrl = `loyaltyapp://scan?program=${location.id}&merchant=${location.merchant}`;
  
  console.log(`${location.emoji} ${location.name}:`);
  console.log(`  Expo Go: ${expoUrl}`);
  console.log(`  Production: ${prodUrl}`);
  console.log('');
});

console.log('\n=== HTML FORMAT (for test-deeplink.html) ===\n');

locations.forEach((location) => {
  const url = `${EXPO_URL}/--/scan?program=${location.id}&merchant=${location.merchant}`;
  
  console.log(`    <a href="${url}" class="link-card">`);
  console.log(`        <h3>${location.emoji} ${location.name}</h3>`);
  console.log(`        <p class="points">+1 punch</p>`);
  console.log(`        <p>Scan to add a punch to ${location.name}</p>`);
  console.log(`    </a>\n`);
});

console.log('\n=== KEY BENEFITS ===\n');
console.log('✅ Tags NEVER expire');
console.log('✅ No timestamps embedded in tags');
console.log('✅ Write once, use forever');
console.log('✅ App generates timestamp when scanned');
console.log('✅ No need to rewrite tags ever\n');
