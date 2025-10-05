/**
 * Generate static NFC tags that NEVER expire!
 * Write these URLs to NFC tags once and they'll work forever.
 */

// Your Expo URL - UPDATE THIS!
const EXPO_URL = 'exp://172.16.189.173:8081';

// Test locations
const locations = [
  { id: '1', name: 'Starbucks Rewards', merchant: 'starbucks-downtown-001', emoji: '☕' },
  { id: '2', name: 'Tim Hortons', merchant: 'timhortons-main-001', emoji: '🍩' },
  { id: '3', name: 'Shoppers Optimum', merchant: 'shoppers-pharm-001', emoji: '💊' },
  { id: '4', name: 'Aeroplan', merchant: 'aeroplan-airport-001', emoji: '✈️' },
  { id: '5', name: 'Best Buy Rewards', merchant: 'bestbuy-store-001', emoji: '🔌' },
  { id: '6', name: 'Sephora Beauty Insider', merchant: 'sephora-mall-001', emoji: '💄' },
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
