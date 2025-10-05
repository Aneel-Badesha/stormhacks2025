/**
 * Static NFC Tag System - Tags Never Expire!
 * 
 * STATIC TAG FORMAT (written once to NFC tag, never changes):
 *   loyaltyapp://scan?program=[programId]&merchant=[merchantId]
 *   Example: loyaltyapp://scan?program=1&merchant=starbucks-downtown-001
 * 
 * The app generates timestamp and validates the scan server-side,
 * so tags never expire and don't need to be rewritten.
 */

/**
 * Generate a static NFC tag URL (write this to the NFC tag once)
 * @param {string} programId - The ID of the loyalty program
 * @param {string} merchantId - Merchant/location identifier
 * @param {string} expoUrl - Your Expo Go URL for development (optional)
 * @returns {string} Static URL for NFC tag
 */
export const generateStaticTag = (programId, merchantId, expoUrl = null) => {
  // For Expo Go development
  if (expoUrl) {
    return `${expoUrl}/--/scan?program=${programId}&merchant=${merchantId}`;
  }
  
  // For production (standalone app)
  return `loyaltyapp://scan?program=${programId}&merchant=${merchantId}`;
};

/**
 * Parse static NFC tag and validate
 * @param {string} url - The scanned NFC tag URL
 * @returns {object} Parsed and validated data
 */
export const parseStaticTag = (url) => {
  try {
    console.log('Parsing static tag:', url);
    
    // If URL doesn't have query params, it's just the base URL - ignore it
    if (!url.includes('?')) {
      console.log('No query parameters found in URL, ignoring');
      return { error: 'No query parameters found', silent: true };
    }
    
    // Extract query parameters
    let params;
    
    if (url.includes('/--/')) {
      // Expo Go format
      const queryStart = url.indexOf('?');
      if (queryStart === -1) {
        return { error: 'No query parameters found', silent: true };
      }
      const queryString = url.substring(queryStart + 1);
      console.log('Query string:', queryString);
      params = new URLSearchParams(queryString);
    } else {
      // Standard format
      const urlObj = new URL(url.replace('loyaltyapp://', 'https://temp.com/'));
      params = new URLSearchParams(urlObj.search);
    }
    
    const programId = params.get('program');
    const merchantId = params.get('merchant');
    
    console.log('Parsed params:', { programId, merchantId });
    
    if (!programId) {
      console.log('Missing program ID');
      return { error: 'Missing program ID' };
    }
    
    // Don't validate program here - let App.js handle it with real data from API
    // Generate timestamp NOW (when scanned, not when tag was created)
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Award 1 punch per scan
    const punches = 1;
    
    return {
      success: true,
      programId,
      points: punches, // Keep as 'points' for compatibility with existing code
      timestamp,
      merchantId: merchantId || null,
      scannedAt: new Date(timestamp * 1000).toISOString(),
    };
  } catch (error) {
    return { error: 'Invalid URL format', details: error.message };
  }
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
 * Award punches to user's card
 * @param {object} card - The user's loyalty card
 * @param {number} punchesToAdd - Number of punches to add (default 1)
 * @returns {object} Updated card
 */
export const awardPunches = (card, punchesToAdd = 1) => {
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
 * Example static tags for merchants (write these to NFC tags once):
 * 
 * Starbucks Downtown:
 *   loyaltyapp://scan?program=1&merchant=starbucks-downtown-001
 * 
 * Tim Hortons Main St:
 *   loyaltyapp://scan?program=2&merchant=timhortons-main-001
 * 
 * These tags NEVER expire and never need to be rewritten!
 */

/**
 * Generate static tags for all test locations
 */
export const STATIC_MERCHANT_TAGS = {
  starbucks_downtown: generateStaticTag('1', 'starbucks-downtown-001'),
  starbucks_mall: generateStaticTag('1', 'starbucks-mall-002'),
  timhortons_main: generateStaticTag('2', 'timhortons-main-001'),
  shoppers_pharmacy: generateStaticTag('3', 'shoppers-pharm-001'),
  aeroplan_airport: generateStaticTag('4', 'aeroplan-airport-001'),
  bestbuy_store: generateStaticTag('5', 'bestbuy-store-001'),
  sephora_mall: generateStaticTag('6', 'sephora-mall-001'),
};

/**
 * For Expo Go development, generate with your Expo URL:
 * 
 * const expoUrl = 'exp://172.16.189.173:8081';
 * const tag = generateStaticTag('1', 'starbucks-001', expoUrl);
 * // Output: exp://172.16.189.173:8081/--/scan?program=1&merchant=starbucks-001
 */
