/**
 * Generate valid test deep links with correct signatures
 * Run this script to generate working test URLs
 */

// Simple hash function (same as in nfcEncoder.js)
const generateSignature = (programId, points, timestamp) => {
  const data = `${programId}-${points}-${timestamp}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 6);
};

// Your Expo URL - UPDATE THIS!
const EXPO_URL = 'exp://172.16.189.173:8081';

// Generate test links (1 punch per scan)
const testLinks = [
  { id: '1', name: 'Starbucks Rewards', points: 1, emoji: '☕' },
  { id: '2', name: 'Tim Hortons', points: 1, emoji: '🍩' },
  { id: '3', name: 'Shoppers Optimum', points: 1, emoji: '💊' },
  { id: '4', name: 'Aeroplan', points: 1, emoji: '✈️' },
  { id: '5', name: 'Best Buy Rewards', points: 1, emoji: '🔌' },
  { id: '6', name: 'Sephora Beauty Insider', points: 1, emoji: '💄' },
];

console.log('\n=== VALID TEST DEEP LINKS ===\n');
console.log('Copy these URLs into your test-deeplink.html file:\n');

testLinks.forEach((link, index) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateSignature(link.id, link.points, timestamp);
  const merchantId = `test-${String(index + 1).padStart(3, '0')}`;
  
  const url = `${EXPO_URL}/--/scan?program=${link.id}&points=${link.points}&time=${timestamp}&sig=${signature}&merchant=${merchantId}`;
  
  console.log(`${link.emoji} ${link.name} (+${link.points} pts):`);
  console.log(url);
  console.log('');
});

console.log('\n=== HTML FORMAT ===\n');
console.log('Or copy this HTML directly:\n');

testLinks.forEach((link, index) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateSignature(link.id, link.points, timestamp);
  const merchantId = `test-${String(index + 1).padStart(3, '0')}`;
  
  const url = `${EXPO_URL}/--/scan?program=${link.id}&points=${link.points}&time=${timestamp}&sig=${signature}&merchant=${merchantId}`;
  
  console.log(`    <a href="${url}" class="link-card">`);
  console.log(`        <h3>${link.emoji} ${link.name}</h3>`);
  console.log(`        <p class="points">+${link.points} points</p>`);
  console.log(`        <p>Test awarding points to ${link.name} card</p>`);
  console.log(`    </a>\n`);
});

console.log('\nNOTE: These links are valid for 24 hours from now.');
console.log('After that, run this script again to generate new ones.\n');
