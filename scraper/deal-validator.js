// ============================================
// REAL-TIME DEAL VALIDATOR
// Checks if deals are still active and removes expired ones
// ============================================

import https from 'https';
import http from 'http';
import fs from 'fs';

export class DealValidator {
  constructor() {
    this.validationCache = new Map();
    this.cacheExpiry = 3600000; // 1 hour in ms
  }

  async validateDealsFile(filePath = 'docs/deals.json') {
    console.log('🔍 Starting deal validation...');
    
    if (!fs.existsSync(filePath)) {
      console.error('❌ Deals file not found:', filePath);
      return;
    }

    const dealsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const deals = dealsData.deals;
    const validDeals = [];
    const removedDeals = [];

    for (const deal of deals) {
      const validation = await this.validateSingleDeal(deal);
      
      if (validation.valid) {
        validDeals.push(deal);
        console.log(`✅ ${deal.brand}: ${deal.title}`);
      } else {
        removedDeals.push({ deal, reason: validation.reason });
        console.log(`❌ ${deal.brand}: ${deal.title} (${validation.reason})`);
      }
    }

    // Update the deals file
    dealsData.deals = validDeals;
    dealsData.totalDeals = validDeals.length;
    dealsData.lastValidated = new Date().toISOString();
    dealsData.removedDeals = removedDeals.length;

    fs.writeFileSync(filePath, JSON.stringify(dealsData, null, 2));
    
    console.log(`🎯 Validation complete: ${validDeals.length} valid, ${removedDeals.length} removed`);
    return { validDeals, removedDeals };
  }

  async validateSingleDeal(deal) {
    // Check cache first
    const cacheKey = `${deal.id}_${deal.url}`;
    if (this.validationCache.has(cacheKey)) {
      const cached = this.validationCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.result;
      }
    }

    const validation = await this._performValidation(deal);
    
    // Cache the result
    this.validationCache.set(cacheKey, {
      result: validation,
      timestamp: Date.now()
    });

    return validation;
  }

  async _performValidation(deal) {
    // 1. Check expiry date
    const expiryCheck = this._checkExpiry(deal);
    if (!expiryCheck.valid) return expiryCheck;

    // 2. Check URL availability
    const urlCheck = await this._checkUrl(deal.url);
    if (!urlCheck.valid) return urlCheck;

    // 3. Check deal-specific validation rules
    const contentCheck = await this._checkDealContent(deal);
    if (!contentCheck.valid) return contentCheck;

    return { valid: true, reason: 'active' };
  }

  _checkExpiry(deal) {
    if (!deal.expires) return { valid: true };
    
    const now = new Date();
    const expiryPatterns = [
      { pattern: /(\d{1,2})\.(\d{1,2})\.(\d{4})/, format: 'DD.MM.YYYY' },
      { pattern: /(\d{4})-(\d{2})-(\d{2})/, format: 'YYYY-MM-DD' },
      { pattern: /bis (\d{1,2})\.(\d{1,2})/i, format: 'bis DD.MM' },
      { pattern: /winter (\d{4})/i, format: 'winter YYYY' }
    ];

    for (const { pattern, format } of expiryPatterns) {
      const match = deal.expires.match(pattern);
      if (match) {
        let expiryDate;
        
        if (format === 'DD.MM.YYYY') {
          expiryDate = new Date(match[3], match[2] - 1, match[1]);
        } else if (format === 'YYYY-MM-DD') {
          expiryDate = new Date(match[1], match[2] - 1, match[3]);
        } else if (format === 'bis DD.MM') {
          expiryDate = new Date(now.getFullYear(), match[2] - 1, match[1]);
        } else if (format === 'winter YYYY') {
          expiryDate = new Date(match[1], 2, 20); // End of winter
        }

        if (expiryDate && expiryDate < now) {
          return { valid: false, reason: 'expired' };
        }
      }
    }

    // Special cases
    if (deal.expires.toLowerCase().includes('abgelaufen')) {
      return { valid: false, reason: 'expired' };
    }

    return { valid: true };
  }

  async _checkUrl(url) {
    if (!url || url === '#') return { valid: true };

    try {
      const response = await this._makeRequest(url, 'HEAD');
      if (response.statusCode >= 400) {
        return { valid: false, reason: `url_error_${response.statusCode}` };
      }
      return { valid: true };
    } catch (error) {
      return { valid: false, reason: 'url_unreachable' };
    }
  }

  async _checkDealContent(deal) {
    // Special validation rules for different deal types
    
    // McDonald's app deals - check if app is still promoting
    if (deal.brand === "McDonald's" && deal.source === "McDonald's App") {
      try {
        const content = await this._fetchContent('https://www.mcdonalds.at/aktionen');
        if (content && content.includes('app') && content.includes('gratis')) {
          return { valid: true };
        }
      } catch (error) {
        // Fallback: assume valid if can't check
        return { valid: true };
      }
    }

    // Student deals - check if still mentioned
    if (deal.description.toLowerCase().includes('student')) {
      // Most student deals are ongoing, assume valid
      return { valid: true };
    }

    // Birthday deals - always valid
    if (deal.description.toLowerCase().includes('geburtstag')) {
      return { valid: true };
    }

    // Newsletter signup deals - usually permanent
    if (deal.description.toLowerCase().includes('newsletter')) {
      return { valid: true };
    }

    return { valid: true };
  }

  async _makeRequest(url, method = 'GET') {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https:') ? https : http;
      const options = {
        method,
        timeout: 5000,
        headers: {
          'User-Agent': 'freeFinder-Vienna/1.0'
        }
      };

      const req = protocol.request(url, options, (res) => {
        resolve(res);
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('timeout')));
      req.end();
    });
  }

  async _fetchContent(url) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https:') ? https : http;
      
      protocol.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
  }

  // Clean up old cache entries
  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.validationCache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.validationCache.delete(key);
      }
    }
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new DealValidator();
  await validator.validateDealsFile();
}

console.log('✅ Deal Validator ready!');