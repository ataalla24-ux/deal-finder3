// ============================================
// FIRECRAWL SCRAPER - Für blockierte Seiten
// Läuft 1x täglich, nutzt max 16 Credits
// ES Module Version
// ============================================

import https from 'https';
import fs from 'fs';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

if (!FIRECRAWL_API_KEY) {
  console.error('❌ FIRECRAWL_API_KEY nicht gesetzt!');
  console.log('💡 Setze den Key als GitHub Secret oder Umgebungsvariable.');
  process.exit(0);
}

// ============================================
// WICHTIGSTE BLOCKIERTE SEITEN (max 16/Tag)
// ============================================

const FIRECRAWL_SOURCES = [
  // Supermärkte
  { name: 'BILLA Angebote', url: 'https://www.billa.at/angebote/aktuelle-angebote', category: 'supermarkt', brand: 'BILLA', logo: '🛒' },
  { name: 'SPAR Angebote', url: 'https://www.spar.at/angebote', category: 'supermarkt', brand: 'SPAR', logo: '🛒' },
  { name: 'INTERSPAR', url: 'https://www.interspar.at/angebote', category: 'supermarkt', brand: 'INTERSPAR', logo: '🛒' },
  
  // Technik
  { name: 'MediaMarkt', url: 'https://www.mediamarkt.at/de/campaign/angebote', category: 'technik', brand: 'MediaMarkt', logo: '📺' },
  { name: 'Saturn', url: 'https://www.saturn.at/de/campaign/angebote', category: 'technik', brand: 'Saturn', logo: '📺' },
  
  // Beauty
  { name: 'Douglas', url: 'https://www.douglas.at/de/c/sale/01', category: 'beauty', brand: 'Douglas', logo: '💄' },
  { name: 'BIPA', url: 'https://www.bipa.at/angebote', category: 'beauty', brand: 'BIPA', logo: '💇' },
  { name: 'Müller', url: 'https://www.mueller.at/angebote/', category: 'beauty', brand: 'Müller', logo: '🧴' },
  
  // Mode
  { name: 'H&M Sale', url: 'https://www2.hm.com/de_at/sale.html', category: 'mode', brand: 'H&M', logo: '👕' },
  { name: 'Zalando Sale', url: 'https://www.zalando.at/sale/', category: 'mode', brand: 'Zalando', logo: '👟' },
  
  // Essen
  { name: 'Dominos Angebote', url: 'https://www.dominos.at/speisekarte/angebote', category: 'essen', brand: 'Dominos', logo: '🍕' },
  { name: 'Subway', url: 'https://www.subway.at/de/angebote', category: 'essen', brand: 'Subway', logo: '🥪' },
  
  // Weiteres
  { name: 'Notino', url: 'https://www.notino.at/aktionen/', category: 'beauty', brand: 'Notino', logo: '🧴' },
  { name: 'Cyberport', url: 'https://www.cyberport.at/sale', category: 'technik', brand: 'Cyberport', logo: '💻' }
];

// ============================================
// FIRECRAWL API CALL
// ============================================

async function scrapeWithFirecrawl(url) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      url: url,
      formats: ['markdown'],
      onlyMainContent: true,
      timeout: 30000
    });

    const options = {
      hostname: 'api.firecrawl.dev',
      port: 443,
      path: '/v1/scrape',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.success && json.data) {
            resolve(json.data.markdown || '');
          } else {
            reject(new Error(json.error || 'Firecrawl error'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(35000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.write(postData);
    req.end();
  });
}

// ============================================
// DEAL EXTRAKTION
// ============================================

const GRATIS_KEYWORDS = ['gratis', 'kostenlos', 'geschenkt', 'umsonst', 'free', '0€', '0 €', '0,00'];
const DEAL_KEYWORDS = ['rabatt', 'sale', 'aktion', 'angebot', 'sparen', 'reduziert', 'günstiger', '%', 'prozent', 'ersparnis'];

function extractDealsFromMarkdown(markdown, source) {
  const deals = [];
  const lines = markdown.split('\n').filter(l => l.trim().length > 10);
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    const isGratis = GRATIS_KEYWORDS.some(k => lowerLine.includes(k));
    const isDeal = DEAL_KEYWORDS.some(k => lowerLine.includes(k));
    
    if (!isGratis && !isDeal) continue;
    
    const percentMatch = line.match(/(\d{1,2})\s*%/);
    const percent = percentMatch ? percentMatch[1] : null;
    
    let title = line
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[#*_`]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 70);
    
    if (title.length < 15) continue;
    
    deals.push({
      id: `fc-${source.brand}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      brand: source.brand,
      logo: source.logo,
      title: percent ? `${percent}% ${title}` : title,
      description: `${source.name}: ${title}`,
      type: isGratis ? 'gratis' : 'rabatt',
      badge: isGratis ? 'gratis' : 'limited',
      category: source.category,
      source: `Firecrawl: ${source.name}`,
      url: source.url,
      expires: 'Begrenzt',
      distance: 'Österreich',
      hot: isGratis || (percent && parseInt(percent) >= 30),
      isNew: true,
      pubDate: new Date().toISOString()
    });
  }
  
  return deals.slice(0, 5);
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('🔥 FIRECRAWL SCRAPER gestartet...\n');
  console.log(`📅 ${new Date().toLocaleString('de-AT')}\n`);
  console.log(`🎯 ${FIRECRAWL_SOURCES.length} Premium-Quellen\n`);
  
  const allDeals = [];
  let successCount = 0;
  let errorCount = 0;
  
  for (const source of FIRECRAWL_SOURCES) {
    try {
      console.log(`🔄 ${source.name}...`);
      
      const markdown = await scrapeWithFirecrawl(source.url);
      const deals = extractDealsFromMarkdown(markdown, source);
      
      allDeals.push(...deals);
      successCount++;
      
      console.log(`✅ ${source.name}: ${deals.length} Deals`);
      
      await new Promise(r => setTimeout(r, 1000));
      
    } catch (error) {
      errorCount++;
      console.log(`❌ ${source.name}: ${error.message}`);
    }
  }
  
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Firecrawl abgeschlossen!`);
  console.log(`   📦 Quellen: ${successCount}/${FIRECRAWL_SOURCES.length}`);
  console.log(`   🆕 Deals gefunden: ${allDeals.length}`);
  console.log(`   ⚠️  Fehler: ${errorCount}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
  // Merge mit bestehenden Deals
  try {
    const existingPath = 'docs/deals.json';
    if (fs.existsSync(existingPath)) {
      const existing = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
      
      const mergedDeals = [...allDeals, ...existing.deals];
      
      const seen = new Set();
      const uniqueDeals = mergedDeals.filter(d => {
        const key = d.title.toLowerCase().substring(0, 30);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      
      existing.deals = uniqueDeals;
      existing.totalDeals = uniqueDeals.length;
      existing.lastUpdated = new Date().toISOString();
      
      fs.writeFileSync(existingPath, JSON.stringify(existing, null, 2));
      console.log(`✅ Merged: Jetzt ${uniqueDeals.length} Deals total`);
    } else {
      console.log('⚠️ docs/deals.json nicht gefunden - Firecrawl Deals werden nicht gemerged');
    }
  } catch (e) {
    console.log('⚠️ Merge fehlgeschlagen:', e.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal:', err.message);
    process.exit(0);
  });
