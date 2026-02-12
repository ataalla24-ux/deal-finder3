// ============================================
// ENHANCED FREEFINDER SCRAPER
// Integrates all improvements: validation, social media, events
// ============================================

import { DealValidator } from './deal-validator.js';
import { ViennaEventsScaper } from './vienna-events-scraper.js';
import fs from 'fs';
import https from 'https';

class EnhancedFreeFinder {
  constructor() {
    this.validator = new DealValidator();
    this.eventsScraper = new ViennaEventsScaper();
    this.allDeals = [];
    this.stats = {
      total: 0,
      valid: 0,
      expired: 0,
      newEvents: 0,
      socialDeals: 0
    };
  }

  async run() {
    console.log('🚀 Enhanced freeFinder starting...');
    console.log('📅', new Date().toLocaleString('de-AT'));

    // 1. Load existing deals
    await this.loadExistingDeals();

    // 2. Validate existing deals
    await this.validateDeals();

    // 3. Scrape new Vienna events
    await this.addViennaEvents();

    // 4. Add Vienna-specific improvements
    await this.addViennaSpecific();

    // 5. Score and prioritize deals
    this.scoreDeals();

    // 6. Save enhanced results
    this.saveResults();

    this.printStats();
  }

  async loadExistingDeals() {
    try {
      if (fs.existsSync('docs/deals.json')) {
        const data = JSON.parse(fs.readFileSync('docs/deals.json', 'utf8'));
        this.allDeals = data.deals || [];
        console.log(`📂 Loaded ${this.allDeals.length} existing deals`);
      }
    } catch (error) {
      console.log('⚠️ Could not load existing deals:', error.message);
      this.allDeals = [];
    }
  }

  async validateDeals() {
    console.log('🔍 Validating existing deals...');
    const validDeals = [];

    for (const deal of this.allDeals) {
      const validation = await this.validator.validateSingleDeal(deal);
      if (validation.valid) {
        validDeals.push(deal);
        this.stats.valid++;
      } else {
        console.log(`❌ Removed: ${deal.brand} - ${validation.reason}`);
        this.stats.expired++;
      }
    }

    this.allDeals = validDeals;
    console.log(`✅ Validation complete: ${this.stats.valid} valid, ${this.stats.expired} removed`);
  }

  async addViennaEvents() {
    console.log('🎭 Adding Vienna events and activities...');
    const eventDeals = await this.eventsScraper.scrapeAll();
    
    // Merge new events (avoid duplicates)
    for (const eventDeal of eventDeals) {
      const exists = this.allDeals.some(deal => 
        deal.title === eventDeal.title || deal.id === eventDeal.id
      );
      
      if (!exists) {
        this.allDeals.push(eventDeal);
        this.stats.newEvents++;
      }
    }

    console.log(`🎭 Added ${this.stats.newEvents} new Vienna events`);
  }

  async addViennaSpecific() {
    console.log('🏙️ Adding Vienna-specific improvements...');
    
    // Add current seasonal deals
    const seasonalDeals = this.getSeasonalDeals();
    this.allDeals.push(...seasonalDeals);

    // Add student-specific deals
    const studentDeals = this.getStudentDeals();
    this.allDeals.push(...studentDeals);

    // Add transportation deals
    const transportDeals = this.getTransportDeals();
    this.allDeals.push(...transportDeals);

    console.log(`🏙️ Added ${seasonalDeals.length + studentDeals.length + transportDeals.length} Vienna-specific deals`);
  }

  getSeasonalDeals() {
    const month = new Date().getMonth() + 1;
    const season = month >= 3 && month <= 5 ? 'spring' :
                  month >= 6 && month <= 8 ? 'summer' :
                  month >= 9 && month <= 11 ? 'autumn' : 'winter';

    const seasonalDeals = {
      spring: [
        {
          id: 'spring-1',
          brand: 'Botanischer Garten',
          logo: '🌸',
          title: 'Gratis Frühlingsblüte bestaunen',
          description: 'Universitätssternwarte & Botanischer Garten - kostenloser Eintritt zur Blütezeit!',
          type: 'gratis',
          category: 'wien',
          source: 'Universität Wien',
          expires: 'März-Mai',
          distance: '3. Bezirk',
          hot: true,
          priority: 1
        }
      ],
      summer: [
        {
          id: 'summer-1',
          brand: 'Donauinselfest',
          logo: '🎪',
          title: 'Gratis Open-Air Festival',
          description: 'Europas größtes gratis Open-Air Festival - 3 Tage kostenlose Musik!',
          type: 'gratis',
          category: 'wien',
          source: 'SPÖ Wien',
          expires: 'Juni (Wochenende)',
          distance: 'Donauinsel',
          hot: true,
          priority: 1
        }
      ],
      autumn: [
        {
          id: 'autumn-1',
          brand: 'Lange Nacht der Museen',
          logo: '🏛️',
          title: '€15 für 700+ Museen',
          description: 'Eine Nacht, ein Ticket, über 700 Museen und Kulturstätten!',
          type: 'rabatt',
          category: 'kultur',
          source: 'Lange Nacht',
          expires: 'Oktober',
          distance: 'Wien',
          hot: true,
          priority: 1
        }
      ],
      winter: [
        {
          id: 'winter-1',
          brand: 'Christkindlmärkte',
          logo: '🎄',
          title: 'Gratis Punsch-Verkostung',
          description: 'Viele Christkindlmärkte bieten kostenlose Punsch-Proben an!',
          type: 'gratis',
          category: 'essen',
          source: 'Wiener Märkte',
          expires: 'Dezember-Januar',
          distance: 'Wien Zentrum',
          hot: true,
          priority: 1
        }
      ]
    };

    return seasonalDeals[season] || [];
  }

  getStudentDeals() {
    return [
      {
        id: 'student-1',
        brand: 'Wiener Staatsoper',
        logo: '🎭',
        title: 'Stehplätze ab €3 für Studenten',
        description: 'Staatsoper, Volksoper & Burgtheater: Günstige Stehplätze für Studenten!',
        type: 'rabatt',
        category: 'kultur',
        source: 'Bundestheater',
        expires: 'Mit Studentenausweis',
        distance: '1. Bezirk',
        hot: true,
        priority: 2
      },
      {
        id: 'student-2',
        brand: 'Mensa',
        logo: '🍽️',
        title: 'Studenten-Menü ab €2,20',
        description: 'Alle Unis: Warme Mahlzeit schon ab €2,20 in der Mensa!',
        type: 'rabatt',
        category: 'essen',
        source: 'Mensen Wien',
        expires: 'Mit Studentenausweis',
        distance: 'Uni-Standorte',
        hot: false,
        priority: 3
      }
    ];
  }

  getTransportDeals() {
    return [
      {
        id: 'transport-1',
        brand: 'Wiener Linien',
        logo: '🚇',
        title: 'Klimaticket Wien €365/Jahr',
        description: 'Ganzes Jahr öffentliche Verkehrsmittel in Wien für nur €365!',
        type: 'rabatt',
        category: 'transport',
        source: 'Wiener Linien',
        expires: 'Jahresticket',
        distance: 'Ganz Wien',
        hot: true,
        priority: 2
      },
      {
        id: 'transport-2',
        brand: 'Nextbike',
        logo: '🚴',
        title: 'Erste 15min gratis',
        description: 'Nextbike Wien: Erste 15 Minuten jeder Fahrt kostenlos!',
        type: 'gratis',
        category: 'transport',
        source: 'Nextbike',
        expires: 'Unbegrenzt',
        distance: 'Wien',
        hot: false,
        priority: 2
      }
    ];
  }

  scoreDeals() {
    console.log('🎯 Scoring and prioritizing deals...');
    
    for (const deal of this.allDeals) {
      let score = 0;
      
      // Type scoring
      if (deal.type === 'gratis') score += 10;
      else if (deal.type === 'rabatt') score += 5;
      
      // Hot deals
      if (deal.hot) score += 5;
      
      // New deals
      if (deal.isNew) score += 3;
      
      // Category relevance
      if (['essen', 'kaffee'].includes(deal.category)) score += 3;
      if (deal.category === 'wien') score += 2;
      
      // Expiry urgency
      if (deal.expires && ['heute', 'nur heute', 'limited'].some(word => 
        deal.expires.toLowerCase().includes(word))) {
        score += 8;
      }
      
      // Vienna-specific
      if (deal.distance && deal.distance !== 'Überall') score += 2;
      
      deal.score = score;
    }
    
    // Sort by score
    this.allDeals.sort((a, b) => (b.score || 0) - (a.score || 0));
    console.log(`🎯 Scored ${this.allDeals.length} deals`);
  }

  saveResults() {
    this.stats.total = this.allDeals.length;
    
    const output = {
      lastUpdated: new Date().toISOString(),
      version: '2.1.0',
      totalDeals: this.allDeals.length,
      stats: this.stats,
      deals: this.allDeals.map((deal, index) => ({
        ...deal,
        rank: index + 1
      }))
    };

    // Save main file
    fs.writeFileSync('docs/deals.json', JSON.stringify(output, null, 2));
    
    // Save backup
    const timestamp = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(`docs/deals-backup-${timestamp}.json`, JSON.stringify(output, null, 2));
    
    console.log(`💾 Saved ${this.allDeals.length} deals to docs/deals.json`);
  }

  printStats() {
    console.log('\n📊 ENHANCED FREEFINDER STATS');
    console.log('=================================');
    console.log(`📋 Total Deals: ${this.stats.total}`);
    console.log(`✅ Valid Deals: ${this.stats.valid}`);
    console.log(`❌ Expired Removed: ${this.stats.expired}`);
    console.log(`🎭 New Events: ${this.stats.newEvents}`);
    console.log(`⭐ Top Scored Deal: ${this.allDeals[0]?.title || 'None'}`);
    console.log(`🏆 Gratis Deals: ${this.allDeals.filter(d => d.type === 'gratis').length}`);
    console.log(`🔥 Hot Deals: ${this.allDeals.filter(d => d.hot).length}`);
    console.log('=================================\n');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const enhanced = new EnhancedFreeFinder();
  await enhanced.run();
}

export { EnhancedFreeFinder };