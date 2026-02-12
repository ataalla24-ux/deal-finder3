// ============================================
// VIENNA SOCIAL MEDIA SCRAPER
// Tracks Instagram, Facebook, TikTok for new openings and flash deals
// ============================================

import https from 'https';
import fs from 'fs';

const SOCIAL_SOURCES = [
  // Instagram hashtags for Vienna
  { 
    platform: 'instagram', 
    hashtag: 'wienneueröffnung',
    searchUrl: `https://www.instagram.com/explore/tags/wienneueröffnung/`,
    category: 'neueröffnung'
  },
  { 
    platform: 'instagram', 
    hashtag: 'wienfree',
    searchUrl: `https://www.instagram.com/explore/tags/wienfree/`,
    category: 'gratis'
  },
  { 
    platform: 'instagram', 
    hashtag: 'viennafree',
    searchUrl: `https://www.instagram.com/explore/tags/viennafree/`,
    category: 'gratis'
  },
  
  // Food blogger accounts
  { 
    platform: 'instagram', 
    account: 'vienna.foodguide',
    searchUrl: 'https://www.instagram.com/vienna.foodguide/',
    category: 'essen'
  },
  { 
    platform: 'instagram', 
    account: 'eattheworld.vienna',
    searchUrl: 'https://www.instagram.com/eattheworld.vienna/',
    category: 'essen'
  },
  
  // Facebook groups and pages
  { 
    platform: 'facebook', 
    name: 'Wien Tipps & Schnäppchen',
    searchUrl: 'https://www.facebook.com/groups/wientipps/',
    category: 'deals'
  },
  { 
    platform: 'facebook', 
    name: 'Gratis in Wien',
    searchUrl: 'https://www.facebook.com/groups/gratisinwien/',
    category: 'gratis'
  }
];

// Keywords for social media scanning
const SOCIAL_KEYWORDS = [
  // German
  'gratis', 'kostenlos', 'geschenkt', 'umsonst', 'freebie', 
  'neueröffnung', 'eröffnung', 'grand opening', 'opening',
  'rabatt', 'aktion', '50%', 'sale', 'angebot',
  'heute nur', 'limited', 'nur heute', 'flash',
  
  // English
  'free', 'opening', 'new', 'grand opening', 'sale',
  'discount', 'promo', 'limited time', 'flash sale'
];

const VIENNA_LOCATIONS = [
  '1010', '1020', '1030', '1040', '1050', '1060', '1070', '1080', '1090', '1100',
  '1110', '1120', '1130', '1140', '1150', '1160', '1170', '1180', '1190', '1200',
  '1210', '1220', '1230',
  'innere stadt', 'leopoldstadt', 'landstraße', 'wieden', 'margareten',
  'mariahilf', 'neubau', 'josefstadt', 'alsergrund', 'favoriten',
  'simmering', 'meidling', 'hietzing', 'penzing', 'rudolfsheim-fünfhaus',
  'ottakring', 'hernals', 'währing', 'döbling', 'brigittenau',
  'floridsdorf', 'donaustadt', 'liesing'
];

// Enhanced deal validation
export function validateDeal(deal) {
  const now = new Date();
  
  // Check expiry
  if (deal.expires && deal.expires !== 'Unbegrenzt' && deal.expires !== 'Täglich') {
    const expiryDate = parseDate(deal.expires);
    if (expiryDate && expiryDate < now) {
      return { valid: false, reason: 'expired' };
    }
  }
  
  // Check Vienna location relevance
  const hasViennaLocation = VIENNA_LOCATIONS.some(location => 
    deal.description.toLowerCase().includes(location.toLowerCase()) ||
    deal.distance.toLowerCase().includes(location.toLowerCase())
  );
  
  if (!hasViennaLocation && deal.distance !== 'Überall' && deal.distance !== 'Wien') {
    return { valid: false, reason: 'not_vienna' };
  }
  
  return { valid: true };
}

function parseDate(dateStr) {
  // Handle various date formats
  const patterns = [
    /(\d{1,2})\.(\d{1,2})\.(\d{4})/,  // DD.MM.YYYY
    /(\d{4})-(\d{2})-(\d{2})/,        // YYYY-MM-DD
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/   // MM/DD/YYYY
  ];
  
  for (const pattern of patterns) {
    const match = dateStr.match(pattern);
    if (match) {
      return new Date(match[3], match[2] - 1, match[1]);
    }
  }
  
  return null;
}

// Social media content analyzer
export function analyzeSocialContent(content) {
  const deals = [];
  const lines = content.toLowerCase().split('\n');
  
  for (const line of lines) {
    // Check for deal keywords
    const hasKeywords = SOCIAL_KEYWORDS.some(keyword => 
      line.includes(keyword.toLowerCase())
    );
    
    if (hasKeywords) {
      const deal = extractDealFromText(line, content);
      if (deal) deals.push(deal);
    }
  }
  
  return deals;
}

function extractDealFromText(line, fullContent) {
  // Extract deal info using patterns
  const patterns = {
    gratis: /(gratis|kostenlos|free|geschenkt)/i,
    discount: /(\d+)%\s*(rabatt|off|discount)/i,
    opening: /(neueröffnung|opening|eröffnung)/i,
    location: new RegExp(`(${VIENNA_LOCATIONS.join('|')})`, 'i')
  };
  
  let type = 'deal';
  if (patterns.gratis.test(line)) type = 'gratis';
  if (patterns.opening.test(line)) type = 'neueröffnung';
  
  const locationMatch = line.match(patterns.location);
  const discountMatch = line.match(patterns.discount);
  
  return {
    title: line.substring(0, 100).trim(),
    description: fullContent.substring(0, 300).trim(),
    type: type,
    discount: discountMatch ? discountMatch[1] : null,
    location: locationMatch ? locationMatch[1] : 'Wien',
    source: 'social_media',
    timestamp: new Date().toISOString(),
    needsVerification: true
  };
}

console.log('🔗 Vienna Social Media Scraper ready!');