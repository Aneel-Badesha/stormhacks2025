/**
 * NFC Tag Encoder/Decoder for Loyalty Program Rewards
 * 
 * Format: LOYALTY://[programId]:[points]:[timestamp]:[signature]
 * Example: LOYALTY://1:10:1696435200:a3f2c9
 */

import { ALL_PROGRAMS } from '../data/mockData';

/**
 * Generate a simple hash for verification
 * In production, use a proper HMAC with a secret key
 */
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

/**
 * Encode loyalty program data into an NFC-compatible string
 * @param {string} programId - The ID of the loyalty program
 * @param {number} points - Points to award (default: 10)
 * @param {string} merchantId - Optional merchant/location identifier
 * @returns {string} Encoded string for NFC tag
 */
export const encodeLoyaltyTag = (programId, points = 10, merchantId = null) => {
  const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp
  const signature = generateSignature(programId, points, timestamp);
  
  let payload = `${programId}:${points}:${timestamp}:${signature}`;
  
  // Add merchant ID if provided
  if (merchantId) {
    payload += `:${merchantId}`;
  }
  
  return `LOYALTY://${payload}`;
};

/**
 * Decode and validate an NFC tag string
 * @param {string} tagData - The scanned NFC tag data
 * @returns {object|null} Decoded data or null if invalid
 */
export const decodeLoyaltyTag = (tagData) => {
  try {
    // Check if it's a loyalty tag
    if (!tagData.startsWith('LOYALTY://')) {
      return { error: 'Invalid tag format' };
    }
    
    // Extract payload
    const payload = tagData.replace('LOYALTY://', '');
    const parts = payload.split(':');
    
    if (parts.length < 4) {
      return { error: 'Incomplete tag data' };
    }
    
    const [programId, pointsStr, timestampStr, signature, merchantId] = parts;
    const points = parseInt(pointsStr, 10);
    const timestamp = parseInt(timestampStr, 10);
    
    // Verify signature
    const expectedSignature = generateSignature(programId, points, timestamp);
    if (signature !== expectedSignature) {
      return { error: 'Invalid signature - tag may be tampered' };
    }
    
    // Check if tag is too old (optional: prevent replay attacks)
    const currentTime = Math.floor(Date.now() / 1000);
    const ageInHours = (currentTime - timestamp) / 3600;
    
    if (ageInHours > 24) {
      return { error: 'Tag expired (older than 24 hours)' };
    }
    
    // Find the program
    const program = ALL_PROGRAMS.find(p => p.id === programId);
    if (!program) {
      return { error: 'Program not found' };
    }
    
    return {
      success: true,
      programId,
      programName: program.name,
      points,
      timestamp,
      merchantId: merchantId || null,
      scannedAt: new Date(timestamp * 1000).toISOString(),
    };
      url += `&merchant=${merchantId}`;
    }
    return url;
  }
  
  // For production (standalone app)
  let url = `loyaltyapp://scan?program=${programId}&points=${points}&time=${timestamp}&sig=${signature}`;
  if (merchantId) {
    url += `&merchant=${merchantId}`;
  }
  
  return url;
};

/**
 * Generate a universal link (HTTPS) that opens the app or web fallback
 * This works on both iOS and Android
 * @param {string} programId - The ID of the loyalty program
 * @param {number} points - Points to award
 * @param {string} merchantId - Optional merchant identifier
 * @returns {string} Universal link URL
 */
export const generateUniversalLink = (programId, points = 10, merchantId = null) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateSignature(programId, points, timestamp);
  
  // Replace with your actual domain
  let url = `https://yourdomain.com/scan?program=${programId}&points=${points}&time=${timestamp}&sig=${signature}`;
  
  if (merchantId) {
    url += `&merchant=${merchantId}`;
  }
  
  return url;
};

/**
 * Parse deep link parameters
 * @param {string} url - The deep link URL
 * @returns {object} Parsed parameters
 */
export const parseDeepLink = (url) => {
  try {
    console.log('Parsing URL:', url);
    console.log('URL length:', url.length);
    console.log('URL includes /--/:', url.includes('/--/'));
    console.log('URL includes ?:', url.includes('?'));
    
    // If URL doesn't have query params, it's just the base URL - ignore it
    if (!url.includes('?')) {
      console.log('No query parameters found in URL, ignoring');
      return { error: 'No query parameters found', silent: true };
    }
    
    // Handle Expo Go URLs (exp://192.168.0.117:19000/--/scan?...)
    // Handle custom scheme (loyaltyapp://scan?...)
    // Handle universal links (https://...)
    
    let params;
    
    if (url.includes('/--/')) {
      // Expo Go format: exp://192.168.0.117:19000/--/scan?program=1&points=10...
      const queryStart = url.indexOf('?');
      if (queryStart === -1) {
        return { error: 'No query parameters found', silent: true };
      }
      const queryString = url.substring(queryStart + 1);
      console.log('Query string:', queryString);
      params = new URLSearchParams(queryString);
    } else {
      // Standard format: loyaltyapp://scan?program=1&points=10...
      const urlObj = new URL(url.replace('loyaltyapp://', 'https://temp.com/'));
      params = new URLSearchParams(urlObj.search);
    }
    
    const programId = params.get('program');
    const points = parseInt(params.get('points'), 10);
    const timestamp = parseInt(params.get('time'), 10);
    const signature = params.get('sig');
    const merchantId = params.get('merchant');
    
    console.log('Parsed params:', { programId, points, timestamp, signature, merchantId });
    
    if (!programId || !points || !timestamp || !signature) {
      console.log('Missing required parameters');
      return { error: 'Missing required parameters' };
    }
    
    // Verify signature
    const expectedSignature = generateSignature(programId, points, timestamp);
    if (signature !== expectedSignature) {
      return { error: 'Invalid signature' };
    }
    
    // Check timestamp (24 hour expiry)
    const currentTime = Math.floor(Date.now() / 1000);
    const ageInHours = (currentTime - timestamp) / 3600;
    
    if (ageInHours > 24) {
      return { error: 'Link expired' };
    }
    
    return {
      success: true,
      programId,
      points,
      timestamp,
      merchantId,
    };
  } catch (error) {
    return { error: 'Invalid URL format', details: error.message };
  }
};

/**
 * Generate a QR code compatible string (same format as NFC)
 * Can be used for QR code scanning as an alternative to NFC
 */
export const generateQRCode = (programId, points = 10, merchantId = null) => {
  // Use deep link for QR codes too - opens app automatically
  return generateDeepLink(programId, points, merchantId);
};

/**
 * Validate if user has the program card before awarding points
 * @param {string} programId - The program ID from the tag
 * @param {array} userCards - User's current cards
 * @returns {boolean} True if user has the card
 */
export const validateUserHasCard = (programId, userCards) => {
  return userCards.some(card => card.id === programId);
};

/**
 * Award punches to user's card (replaces points system)
 * @param {object} card - The user's loyalty card
 * @param {number} punchesToAdd - Number of punches to add (default 1)
 * @returns {object} Updated card
 */
export const awardPoints = (card, punchesToAdd = 1) => {
  const currentPunches = card.punches || 0;
  const maxPunches = card.maxPunches || 10;
  const newPunches = Math.min(currentPunches + punchesToAdd, maxPunches);
  const newVisits = (card.visits || 0) + 1;
  
  return {
    ...card,
    punches: newPunches,
    visits: newVisits,
  };
};

/**
 * Example usage for merchants to generate tags:
 * 
 * // OPTION 1: Deep Link (opens app automatically)
 * const deepLink = generateDeepLink('1', 10, 'store-123');
 * // Output: loyaltyapp://scan?program=1&points=10&time=1696435200&sig=a3f2c9&merchant=store-123
 * // Write this URL to NFC tag - when scanned, opens app and awards points
 * 
 * // OPTION 2: Universal Link (works on web too)
 * const universalLink = generateUniversalLink('1', 10, 'store-123');
 * // Output: https://yourdomain.com/scan?program=1&points=10&time=1696435200&sig=a3f2c9&merchant=store-123
 * 
 * // OPTION 3: Legacy format (requires manual scan in app)
 * const legacyTag = encodeLoyaltyTag('1', 10, 'store-123');
 * // Output: LOYALTY://1:10:1696435200:a3f2c9:store-123
 */

/**
 * Example merchant tag configurations (Deep Links)
 * These would be programmed into NFC tags at merchant locations
 * When customer taps phone to tag, app opens automatically and awards points
 */
export const MERCHANT_TAG_EXAMPLES = {
  // Deep link format - opens app automatically
  starbucks_downtown: generateDeepLink('1', 10, 'starbucks-downtown-001'),
  starbucks_mall: generateDeepLink('1', 10, 'starbucks-mall-002'),
  timhortons_main: generateDeepLink('2', 5, 'timhortons-main-001'),
  shoppers_pharmacy: generateDeepLink('3', 50, 'shoppers-pharm-001'),
  
  // Universal link format - works on web and app
  aeroplan_airport: generateUniversalLink('4', 100, 'aeroplan-airport-001'),
};
