// ============================================
// FREEFINDER WIEN - OPTIMIERTER SCRAPER V2
// Verbesserte Deal-Erkennung & Performance
// ============================================

import https from 'https';
import http from 'http';
import fs from 'fs';

// ============================================
// ERWEITERTE QUELLEN
// ============================================

const SOURCES = [
  // NEWS & LIFESTYLE (Top-Quellen)
  { name: 'Vienna.at', url: 'https://www.vienna.at/', type: 'html', brand: 'Vienna.at', logo: '📰', category: 'wien', priority: 1 },
  { name: 'Falter Lokalführer', url: 'https://www.falter.at/lokalfuehrer', type: 'html', brand: 'Falter', logo: '📰', category: 'essen', priority: 1 },
  { name: 'Stadtbekannt', url: 'https://www.stadtbekannt.at/', type: 'html', brand: 'Stadtbekannt', logo: '🏙️', category: 'wien', priority: 1 },
  { name: 'A-List', url: 'https://www.a-list.at/', type: 'html', brand: 'A-List', logo: '⭐', category: 'wien', priority: 1 },
  
  // PREISJÄGER (sehr gute Quelle!)
  { name: 'Preisjäger Gratis', url: 'https://www.preisjaeger.at/rss/gruppe/gratisartikel', type: 'rss', brand: 'Preisjäger', logo: '🆓', category: 'gratis', priority: 1 },
  { name: 'Preisjäger Wien', url: 'https://www.preisjaeger.at/rss/gruppe/lokal', type: 'rss', brand: 'Preisjäger', logo: '📍', category: 'wien', priority: 1 },
  { name: 'Preisjäger Food', url: 'https://www.preisjaeger.at/rss/gruppe/lebensmittel-getraenke', type: 'rss', brand: 'Preisjäger', logo: '🍕', category: 'essen', priority: 2 },
  
  // GOOGLE NEWS (gefiltert)
  { name: 'Google News Gratis', url: 'https://news.google.com/rss/search?q=Wien+gratis+OR+kostenlos+OR+geschenkt&hl=de&gl=AT', type: 'rss', brand: 'Google News', logo: '📰', category: 'wien', priority: 2 },
  { name: 'Google News Neueröffnung', url: 'https://news.google.com/rss/search?q=Wien+Neuer%C3%B6ffnung+Restaurant&hl=de&gl=AT', type: 'rss', brand: 'Google News', logo: '🆕', category: 'essen', priority: 2 },
  { name: 'Google News Aktion', url: 'https://news.google.com/rss/search?q=Wien+Aktion+OR+Rabatt+-Politik&hl=de&gl=AT', type: 'rss', brand: 'Google News', logo: '💰', category: 'wien', priority: 3 },
  
  // SUPERMÄRKTE
  { name: 'Lidl Angebote', url: 'https://www.lidl.at/c/billiger-montag/a10006065', type: 'html', brand: 'Lidl', logo: '🛒', category: 'supermarkt', priority: 2 },
  { name: 'HOFER Aktionen', url: 'https://www.hofer.at/de/angebote.html', type: 'html', brand: 'HOFER', logo: '🛒', category: 'supermarkt', priority: 2 },
  
  // RESTAURANTS & FOOD
  { name: "McDonald's AT", url: 'https://www.mcdonalds.at/aktionen', type: 'html', brand: "McDonald's", logo: '🍟', category: 'essen', priority: 2 },
  { name: 'Starbucks AT', url: 'https://www.starbucks.at/', type: 'html', brand: 'Starbucks', logo: '☕', category: 'kaffee', priority: 2 },
  
  // REDDIT
  { name: 'Reddit r/wien', url: 'https://www.reddit.com/r/wien/.rss', type: 'rss', brand: 'Reddit', logo: '🔴', category: 'wien', priority: 3 },
];

// ============================================
// VERBESSERTE KEYWORDS
// ============================================

const GRATIS_KEYWORDS = [
  'gratis', 'kostenlos', 'geschenkt', 'umsonst', 'free', 
  '0€', '0 €', '0,00€', 'freebie', 'gratisproben',
  'for free', 'ohne aufpreis', 'auf rechnung'
];

const DEAL_KEYWORDS = [
  'rabatt', 'sale', 'aktion', 'angebot', 'sparen', 'reduziert',
  'günstiger', '-50%', '-40%', '-30%', '-60%', '-70%',
  '1+1', '2 für 1', 'buy one get one', 'bogo'
];

const NEUEROFFNUNG_KEYWORDS = [
  'neueröffnung', 'eröffnung', 'opening', 'neu eröffnet',
  'grand opening', 'neues lokal', 'ab sofort', 'jetzt neu',
  'erstmals in wien', 'brand neu'
];

// NEGATIVE KEYWORDS (filtern!)
const NEGATIVE_KEYWORDS = [
  'politik', 'partei', 'regierung', 'wahl', 'bundeskanzler',
  'minister', 'parlament', 'gesetz', 'verordnung',
  'demonstration', 'protest', 'konflikt', 'krieg',
  'gericht', 'urteil', 'anklage', 'verdächtig',
  'tot', 'gestorben', 'unfall', 'verletzt', 'brand',
  'diebstahl', 'raub', 'überfall', 'betrug'
];

// ============================================
// INTELLIGENTE KATEGORISIERUNG V2
// ============================================

function detectCategory(text) {
  const t = text.toLowerCase();
  
  // KAFFEE (höchste Priorität)
  if (/\b(kaffee|coffee|latte|cappuccino|espresso|café|cafe|melange|macchiato|flat white|americano)\b/i.test(t)) {
    return 'kaffee';
  }
  
  // ESSEN
  if (/\b(essen|restaurant|lokal|gastro|pizza|kebab|döner|burger|sushi|pasta|schnitzel|würstel|bäcker|torte|kuchen|menü|buffet|brunch|frühstück)\b/i.test(t)) {
    return 'essen';
  }
  
  // SUPERMARKT
  if (/\b(billa|spar|lidl|hofer|penny|supermarkt|lebensmittel|einkauf)\b/i.test(t)) {
    return 'supermarkt';
  }
  
  // BEAUTY
  if (/\b(dm|bipa|douglas|beauty|kosmetik|friseur|haarschnitt|make.?up|parfum)\b/i.test(t)) {
    return 'beauty';
  }
  
  // TECHNIK
  if (/\b(iphone|smartphone|laptop|computer|gaming|tv|fernseher|kopfhörer|tablet)\b/i.test(t)) {
    return 'technik';
  }
  
  // STREAMING
  if (/\b(netflix|spotify|disney|prime|streaming|abo|subscription)\b/i.test(t)) {
    return 'streaming';
  }
  
  // MODE
  if (/\b(h&m|zara|fashion|mode|kleidung|schuhe|sneaker)\b/i.test(t)) {
    return 'mode';
  }
  
  // MOBILITÄT
  if (/\b(wiener\s?linien|öbb|bus|bahn|taxi|scooter|fahrrad|tanken)\b/i.test(t)) {
    return 'mobilität';
  }
  
  return 'wien';
}

// ============================================
// VERBESSERTE RELEVANZ-PRÜFUNG
// ============================================

function isRelevantDeal(title, description) {
  const text = (title + ' ' + description).toLowerCase();
  
  // 1. Negative Keywords ausschließen
  if (NEGATIVE_KEYWORDS.some(keyword => text.includes(keyword))) {
    return false;
  }
  
  // 2. Zu teure Deals (außer stark reduziert)
  const priceMatch = text.match(/(\d{3,4})[,.]?\d{0,2}\s*€/);
  if (priceMatch) {
    const price = parseInt(priceMatch[1]);
    const hasStrongDiscount = /-[5-9]\d%|gratis|kostenlos|geschenkt/.test(text);
    if (price > 500 && !hasStrongDiscount) return false;
  }
  
  // 3. Muss Deal-Keywords enthalten
  const hasGratis = GRATIS_KEYWORDS.some(k => text.includes(k));
  const hasDeal = DEAL_KEYWORDS.some(k => text.includes(k));
  const hasNeueroffnung = NEUEROFFNUNG_KEYWORDS.some(k => text.includes(k));
  
  if (!hasGratis && !hasDeal && !hasNeueroffnung) return false;
  
  // 4. Keine generischen Preisvergleiche
  if (/preisvergleich|geizhals|idealo/.test(text) && !hasGratis) {
    return false;
  }
  
  // 5. Keine reinen Gewinnspiele (außer garantiert gratis)
  if (/gewinnspiel|verlosung|teilnahme/.test(text) && !hasGratis) {
    return false;
  }
  
  return true;
}

// ============================================
// VERBESSERTE DUPLIKATSERKENNUNG
// ============================================

function createDealFingerprint(deal) {
  const text = (deal.title + ' ' + deal.brand).toLowerCase();
  
  // Normalisiere Text
  const normalized = text
    .replace(/[^a-zäöüß0-9]/g, '')
    .replace(/gratis|kostenlos|geschenkt|deal|aktion/g, '')
    .substring(0, 30);
  
  // Kombiniere mit Brand & Kategorie
  return `${normalized}-${deal.brand.toLowerCase()}-${deal.category}`;
}

// ============================================
// HTTP FETCHER (mit Retry)
// ============================================

async function fetchURL(url, retries = 2, timeout = 12000) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const req = protocol.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'de-AT,de;q=0.9',
            'Accept-Encoding': 'gzip, deflate'
          },
          timeout
        }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            fetchURL(res.headers.location, retries, timeout).then(resolve).catch(reject);
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }
          let data = '';
          res.setEncoding('utf8');
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
      });
    } catch (error) {
      if (i === retries) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

// ============================================
// VERBESSERTER RSS PARSER
// ============================================

function extractTag(xml, tag) {
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i');
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();
  
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].replace(/<[^>]*>/g, '').trim() : '';
}

function parseRSS(xml, source) {
  const deals = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title = extractTag(item, 'title');
    const description = extractTag(item, 'description');
    const link = extractTag(item, 'link');
    const pubDate = extractTag(item, 'pubDate');
    
    if (!title || title.length < 10) continue;
    
    // Relevanz prüfen
    if (!isRelevantDeal(title, description || '')) continue;
    
    const fullText = (title + ' ' + (description || '')).toLowerCase();
    const isGratis = GRATIS_KEYWORDS.some(k => fullText.includes(k));
    const isNeueroffnung = NEUEROFFNUNG_KEYWORDS.some(k => fullText.includes(k));
    
    const category = detectCategory(fullText);
    
    // Brand extrahieren
    let brand = source.brand;
    const brandMatch = title.match(/^([A-Za-zäöüÄÖÜß0-9&\-\.']+)[\s:–]/);
    if (brandMatch && brandMatch[1].length > 2) {
      brand = brandMatch[1];
    }
    
    // Description cleanen
    let cleanDesc = (description || title)
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
    
    if (cleanDesc.length > 140) {
      cleanDesc = cleanDesc.substring(0, 137) + '...';
    }
    
    deals.push({
      id: `rss-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      brand: brand.substring(0, 30),
      logo: source.logo,
      title: title.substring(0, 80),
      description: cleanDesc,
      type: isGratis ? 'gratis' : 'rabatt',
      badge: isGratis ? 'gratis' : 'limited',
      category,
      source: source.name,
      url: link || source.url,
      expires: isNeueroffnung ? 'Neueröffnung' : 'Begrenzt',
      distance: 'Wien',
      hot: isGratis || isNeueroffnung,
      isNew: true,
      pubDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString()
    });
  }
  
  return deals;
}

// ============================================
// VERBESSERTER HTML PARSER
// ============================================

function extractDealsFromHTML(html, source) {
  const deals = [];
  
  // Strikte Patterns für echte Deals
  const patterns = [
    { regex: /gratis\s+(kaffee|getränk|essen|probe|haarschnitt|eintritt)[^<]{0,100}/gi, priority: 1 },
    { regex: /kostenlos[^<]{10,150}/gi, priority: 1 },
    { regex: /geschenkt[^<]{10,100}/gi, priority: 1 },
    { regex: /1\+1\s*gratis[^<]{0,80}/gi, priority: 1 },
    { regex: /neueröffnung[^<]{10,150}/gi, priority: 2 },
    { regex: /-[5-9]\d\s*%[^<]{5,100}/gi, priority: 2 },
    { regex: /freebie[^<]{10,100}/gi, priority: 1 },
  ];
  
  const seen = new Set();
  
  patterns.forEach(({ regex, priority }) => {
    let match;
    while ((match = regex.exec(html)) !== null) {
      const context = match[0]
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();
      
      if (context.length < 20 || context.length > 200) continue;
      if (seen.has(context.substring(0, 30))) continue;
      
      if (!isRelevantDeal(context, '')) continue;
      
      seen.add(context.substring(0, 30));
      
      const isGratis = GRATIS_KEYWORDS.some(k => context.toLowerCase().includes(k));
      const isNeueroffnung = NEUEROFFNUNG_KEYWORDS.some(k => context.toLowerCase().includes(k));
      const category = detectCategory(context);
      
      deals.push({
        id: `html-${source.brand}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        brand: source.brand,
        logo: source.logo,
        title: `${isNeueroffnung ? '🆕' : (isGratis ? '🎁' : '💰')} ${context.substring(0, 50)}`,
        description: context.substring(0, 120),
        type: isGratis ? 'gratis' : 'rabatt',
        badge: isGratis ? 'gratis' : 'limited',
        category,
        source: source.name,
        url: source.url,
        expires: 'Begrenzt',
        distance: 'Wien',
        hot: isGratis,
        isNew: true,
        pubDate: new Date().toISOString()
      });
    }
  });
  
  return deals.slice(0, 8); // Max 8 pro HTML-Quelle
}

// ============================================
// VERBESSERTES OUTDATED FILTERING
// ============================================

function isOutdatedDeal(deal) {
  // 1. Explizites Ablaufdatum
  if (deal.validUntil) {
    const validDate = new Date(deal.validUntil);
    if (validDate < new Date()) return true;
  }
  
  const text = `${deal.title} ${deal.description}`.toLowerCase();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  // 2. Alte Jahre
  for (let year = 2020; year < currentYear; year++) {
    if (text.includes(String(year))) return true;
  }
  
  // 3. Vergangene Monate im aktuellen Jahr
  const months = [
    { name: 'januar', num: 1 }, { name: 'februar', num: 2 }, { name: 'märz', num: 3 },
    { name: 'april', num: 4 }, { name: 'mai', num: 5 }, { name: 'juni', num: 6 },
    { name: 'juli', num: 7 }, { name: 'august', num: 8 }, { name: 'september', num: 9 },
    { name: 'oktober', num: 10 }, { name: 'november', num: 11 }, { name: 'dezember', num: 12 }
  ];
  
  for (const month of months) {
    if (month.num < currentMonth && text.includes(month.name) && text.includes(String(currentYear))) {
      return true;
    }
  }
  
  // 4. Zu alte Scraping-Deals (14 Tage)
  if (deal.pubDate && !deal.id.startsWith('top-')) {
    const pubDate = new Date(deal.pubDate);
    const daysSincePub = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePub > 14) return true;
  }
  
  return false;
}

// ============================================
// MAIN SCRAPER
// ============================================

async function scrapeAllSources() {
  console.log('🚀 OPTIMIERTER SCRAPER V2 gestartet...\n');
  console.log(`📅 ${new Date().toLocaleString('de-AT')}\n`);
  console.log(`📡 ${SOURCES.length} Quellen werden durchsucht...\n`);
  
  const scrapedDeals = [];
  const errors = [];
  
  // Parallel scraping (schneller!)
  const promises = SOURCES.map(async (source) => {
    try {
      const content = await fetchURL(source.url);
      let deals = [];
      
      if (source.type === 'rss') {
        deals = parseRSS(content, source);
      } else {
        deals = extractDealsFromHTML(content, source);
      }
      
      console.log(`✅ ${source.name.padEnd(30)} → ${deals.length} Deals`);
      return deals;
      
    } catch (error) {
      errors.push(source.name);
      console.log(`❌ ${source.name.padEnd(30)} → ${error.message}`);
      return [];
    }
  });
  
  const results = await Promise.all(promises);
  results.forEach(deals => scrapedDeals.push(...deals));
  
  // Lade alte Deals falls vorhanden
  let baseDeals = [];
  try {
    const oldData = JSON.parse(fs.readFileSync('deals.json', 'utf8'));
    baseDeals = oldData.deals.filter(d => 
      d.id.startsWith('top-') || 
      d.id.startsWith('kaffee-') || 
      d.id.startsWith('essen-') ||
      d.id.startsWith('beauty-') ||
      d.id.startsWith('stream-')
    );
  } catch (e) {
    console.log('⚠️  Keine alten Basis-Deals gefunden');
  }
  
  // Kombiniere alle Deals
  const allDeals = [...baseDeals, ...scrapedDeals];
  
  // Filter: 1. Abgelaufen
  const validDeals = allDeals.filter(d => !isOutdatedDeal(d));
  console.log(`\n🗑️  ${allDeals.length - validDeals.length} abgelaufene Deals entfernt`);
  
  // Filter: 2. Duplikate (verbesserte Erkennung!)
  const uniqueDeals = [];
  const fingerprints = new Set();
  
  for (const deal of validDeals) {
    const fingerprint = createDealFingerprint(deal);
    if (!fingerprints.has(fingerprint)) {
      fingerprints.add(fingerprint);
      uniqueDeals.push(deal);
    }
  }
  
  console.log(`🔄 ${validDeals.length - uniqueDeals.length} Duplikate entfernt`);
  
  // Sortierung: Priority > Gratis > Hot > Neu
  uniqueDeals.sort((a, b) => {
    // 1. Priority
    const prioA = a.priority || (a.id.startsWith('top-') ? 1 : 99);
    const prioB = b.priority || (b.id.startsWith('top-') ? 1 : 99);
    if (prioA !== prioB) return prioA - prioB;
    
    // 2. Echte Gratis-Deals
    const isTrueFreeA = a.type === 'gratis' && !a.expires?.match(/geburtstag|10\.|sammeln/i);
    const isTrueFreeB = b.type === 'gratis' && !b.expires?.match(/geburtstag|10\.|sammeln/i);
    if (isTrueFreeA && !isTrueFreeB) return -1;
    if (!isTrueFreeA && isTrueFreeB) return 1;
    
    // 3. Hot Deals
    if (a.hot && !b.hot) return -1;
    if (!a.hot && b.hot) return 1;
    
    // 4. Neu
    if (a.isNew && !b.isNew) return -1;
    if (!a.isNew && b.isNew) return 1;
    
    // 5. Typ
    if (a.type === 'gratis' && b.type !== 'gratis') return -1;
    if (a.type !== 'gratis' && b.type === 'gratis') return 1;
    
    return 0;
  });
  
  // Output generieren
  const output = {
    lastUpdated: new Date().toISOString(),
    totalDeals: uniqueDeals.length,
    stats: {
      scraped: scrapedDeals.length,
      base: baseDeals.length,
      removed: allDeals.length - validDeals.length,
      duplicates: validDeals.length - uniqueDeals.length,
      errors: errors.length
    },
    deals: uniqueDeals
  };
  
  fs.writeFileSync('deals.json', JSON.stringify(output, null, 2));
  
  // Summary
  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ SCRAPING ABGESCHLOSSEN!`);
  console.log(`${'='.repeat(50)}`);
  console.log(`📦 Basis-Deals:        ${baseDeals.length}`);
  console.log(`🆕 Gescrapte Deals:    ${scrapedDeals.length}`);
  console.log(`🗑️  Entfernt:           ${allDeals.length - validDeals.length}`);
  console.log(`🔄 Duplikate:          ${validDeals.length - uniqueDeals.length}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 FINALE DEALS:       ${uniqueDeals.length}`);
  console.log(`⚠️  Fehler:             ${errors.length}/${SOURCES.length}`);
  console.log(`${'='.repeat(50)}\n`);
  
  // Top 5 anzeigen
  console.log('🔥 TOP 5 DEALS:');
  uniqueDeals.slice(0, 5).forEach((deal, i) => {
    console.log(`${i + 1}. ${deal.brand} - ${deal.title.substring(0, 50)}`);
  });
}

// Start
scrapeAllSources()
  .then(() => {
    console.log('\n✅ Fertig!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Fatal Error:', err.message);
    process.exit(1);
  });
