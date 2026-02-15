// ============================================
// FREEFINDER WIEN - INSTAGRAM DEAL SCRAPER v2
// Findet echte Freebies & Schnäppchen in Wien
// Qualitätsstandard: Wie Base-Deals (konkret, klar, nützlich)
// ============================================

import https from 'https';
import fs from 'fs';

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN || '';

if (!APIFY_API_TOKEN) {
  console.log('⚠️  APIFY_API_TOKEN nicht gesetzt - Instagram Scraper übersprungen');
  console.log('💡 So richtest du es ein:');
  console.log('   1. Gratis-Account auf https://apify.com erstellen');
  console.log('   2. Settings → Integrations → API Token kopieren');
  console.log('   3. GitHub → Repo Settings → Secrets → New:');
  console.log('      Name: APIFY_API_TOKEN');
  console.log('      Value: [dein-token]');
  process.exit(0);
}

// ============================================
// CONFIG
// ============================================

const CONFIG = {
  maxDealsPerRun: 15,       // Mehr Deals da 2 Quellen (Hashtags + Accounts)
  minScore: 50,
  reviewMinScore: 35,
  maxAgeDays: 7,             // 7 Tage (täglich scrapen = reicht locker)
  maxHashtags: 25,
  postsPerHashtag: 30,       // 30 statt 50 (täglich statt 4x/Woche → gleiches Gesamtvolumen)
  dealExpiryDays: 10,        // Deals 10 Tage behalten
  maxDealsPerBrand: 2,       // Max 2 Deals pro Brand pro Run
};

// ============================================
// KEYWORD MATCHING - Word Boundary statt Substring!
//
// Problem v2: "eis" matched in "Preis", "Reise", etc.
// Fix: Kurze Keywords (≤5 Zeichen) brauchen Word Boundaries
// ============================================

const SHORT_KEYWORD_CACHE = new Map();

function matchesKeyword(text, keyword) {
  // Längere Keywords: substring reicht
  if (keyword.length > 5) {
    return text.includes(keyword);
  }
  // Kurze Keywords: Word Boundary nötig!
  if (!SHORT_KEYWORD_CACHE.has(keyword)) {
    // \b funktioniert nicht gut mit Umlauten, daher manuell:
    // Keyword muss von Nicht-Buchstaben umgeben sein (oder am Anfang/Ende stehen)
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    SHORT_KEYWORD_CACHE.set(keyword, new RegExp(`(?:^|[\\s,.!?;:()\\-/"'#@€$+])${escaped}(?:$|[\\s,.!?;:()\\-/"'#@€$+])`, 'i'));
  }
  return SHORT_KEYWORD_CACHE.get(keyword).test(text);
}

function matchKeywords(text, keywords) {
  return keywords.filter(k => matchesKeyword(text, k));
}

// ============================================
// HASHTAGS - Optimiert für echte Wien-Deals
// ============================================

const HASHTAGS = [
  // === TIER 1: Direkte Gratis/Eröffnungs-Hashtags ===
  'gratiswien',              // ✅ bestätigt - direkter Wien+Gratis Treffer
  'neueröffnung',            // ✅ bestätigt - Gratis-Aktionen bei Openings
  'eröffnung',               // ✅ bestätigt
  // === TIER 2: Deal-Hashtags ===
  'aktionwien',              // ✅ bestätigt
  'kostenlos',               // ✅ bestätigt (Wien-Filter in Caption)
  'gratisprobe',             // ✅ bestätigt
  'geschenk',                // ✅ bestätigt
  'produkttest',             // ✅ bestätigt
  'freebie',                 // ✅ bestätigt
  // === TIER 3: Wien-Food (was kleine Läden wirklich nutzen) ===
  'dönerwien',               // ✅ bestätigt
  'kebapwien',               // ✅ bestätigt
  'kebabwien',               // ✅ Alternative Schreibweise!
  'döner',                   // ✅ Minimax: "sehr aktiv"
  'kebap',                   // ✅ bestätigt
  'kaffeewien',              // ✅ Kaffee-Deals Wien
  'pizzawien',               // ✅ Pizza-Shops Eröffnungen
  'streetfoodwien',          // ✅ Kleine Läden nutzen das
  'wienessen',               // ✅ Wien Food allgemein
  // === TIER 4: Türkisch (Wien-Kebab-Szene) ===
  'açılış',                  // = Neueröffnung auf Türkisch
];

// ============================================
// ACCOUNTS - Verifizierte Wien Deal/Freebie-Accounts
// Jeder Account wurde manuell überprüft!
// ============================================

const ACCOUNTS = [
  // ✅ VERIFIZIERTE Deal/Giveaway-Accounts
  'foodiewien',            // 39.7K - "Deals & Erlebnisse", Deal-Fokus!
  'foodiliciousvienna',    // 58K - "weekly Giveaways"
  'hungrygirlsvienna',     // 48.6K - "weekly giveaways"
  'tastyfood.vienna',      // 54.8K - "giveaways & more"
  'fabfoodvienna',         // 11.1K - "giveaways, Rabattcodes"
  'vorteilsclub.wien',     // 13K - Offizielle Stadt Wien Rabatte 20-50%
  // ⚠️ Gelegentlich Deals/Gratis-Tipps
  '1000thingsinvienna',    // 296K - manchmal Gratis-Tipps
  'stadtbekannt.at',       // 14K - Wien-Magazin, gelegentlich Gratis
  'wienmuseum',            // Gratis-Eintritt Infos
  'preisjaeger.at',        // 4.1K - Deal-Plattform, manchmal Freebies
  'vaborviennaopenair',    // Gratis Open-Air Events (saisonal)
];

// Accounts die immer Wien-relevant sind (kein Wien-Keyword in Caption nötig)
const WIEN_TRUSTED_ACCOUNTS = new Set([
  'foodiewien', 'foodiliciousvienna', 'hungrygirlsvienna',
  'tastyfood.vienna', 'fabfoodvienna', 'vorteilsclub.wien',
  '1000thingsinvienna', 'stadtbekannt.at', 'wienmuseum',
  'preisjaeger.at', 'vaborviennaopenair',
]);

// ============================================
// KEYWORD-LISTEN
// ============================================

const GRATIS_KEYWORDS = [
  'gratis', 'kostenlos', 'free', 'geschenkt', 'umsonst',
  'verschenken', 'freebie', 'for free', 'auf uns', 'aufs haus',
  'wir laden ein', 'einladung', 'wir spendieren', 'spendieren',
  'geht auf uns', 'on the house',
  '0€', '0 €', 'null euro', 'freier eintritt', 'eintritt frei',
  'gratisprobe', 'produkttest',
  // Englische Keywords
  'free stuff', 'free sample',
  // Türkische Keywords (Wien-Kebab-Szene!)
  'bedava',                  // = gratis
  'ücretsiz',                // = kostenlos
  'ikram',                   // = "geht auf uns" / Einladung
  'hediye',                  // = Geschenk
];

// Gewinnspiele sind KEINE Gratis-Deals - separat behandeln!
// User will "gratis Döner" sehen, nicht "tagge 3 Freunde und gewinne vielleicht"
const GEWINNSPIEL_KEYWORDS = [
  'gewinnspiel', 'verlosung', 'giveaway', 'zu gewinnen',
  'win this', 'wir verlosen', 'teilnahmebedingungen',
];

// FAKE-GRATIS: Klingt gratis, aber man muss was kaufen!
const FAKE_GRATIS_KEYWORDS = [
  'gratis dazu', 'dazu gratis', 'gratis zu jed', 'gratis bei kauf',
  'gratis bei bestellung', 'gratis ab bestellwert', 'gratis ab €',
  'gratis ab einem', 'gratis wenn du', 'gratis beim kauf',
  'gratis lieferung', 'gratis versand', 'free delivery', 'free shipping',
  'free with purchase', 'free with any', 'free when you buy',
  'bei jeder bestellung', 'zu jedem hauptgericht', 'zu jeder pizza',
  'zu jedem menü', 'ab einem einkauf', 'ab bestellwert',
  'ab einem bestellwert', 'mindestbestellwert',
  'ab €', 'ab 10€', 'ab 15€', 'ab 20€', 'ab 25€', 'ab 30€',
  'bei abnahme von', 'beim kauf von', 'wenn du bestellst',
];

const PREIS_KEYWORDS = [
  '€1', '€2', '€3', '€4', '€5',
  '1€', '2€', '3€', '4€', '5€',
  '1,50', '1,90', '2,50', '2,90', '3,50', '3,90', '4,50', '4,90',
  'nur €', 'ab €1', 'ab €2', 'ab €3',
  'um 1', 'um 2', 'um 3',
  'für 1', 'für 2', 'für 3',
  'ab 1,', 'ab 2,', 'ab 3,',
  // Minimax: "statt X€" = Rabatt-Indikator
  'statt €',
];

const AKTION_KEYWORDS = [
  '1+1', '2 für 1', 'buy one get one', 'bogo',
  '50%', '60%', '70%', '80%', '-50%', '-60%', '-70%',
  'halber preis', 'hälfte', 'half price',
  'happy hour', 'mittagsmenü', 'lunch deal', 'lunch special',
  'eröffnungsangebot', 'neueröffnung',
  'aktion', 'nur heute', 'nur solange', 'begrenzt',
  'schnäppchen', 'vorrat reicht',
  // Türkische Keywords (Wien-Kebab-Szene!)
  'açılış',                  // = Neueröffnung
  'kampanya',                // = Aktion/Kampagne
  'indirim',                 // = Rabatt
];

const FOOD_KEYWORDS = [
  'kebab', 'kebap', 'döner', 'doner', 'pizza', 'burger',
  'kaffee', 'coffee', 'eis', 'ice cream', 'gelato',
  'wrap', 'falafel', 'getränk', 'drink', 'ayran',
  'menü', 'menu', 'essen', 'food', 'meal',
  'kuchen', 'torte', 'croissant', 'brot', 'sandwich',
  'sushi', 'ramen', 'nudel', 'pasta', 'pommes', 'fries',
  'smoothie', 'juice', 'saft', 'tee', 'tea',
  'schnitzel', 'wurst', 'hot dog', 'hotdog',
  'cookie', 'donut', 'muffin', 'waffle', 'waffel',
  'bowl', 'salat', 'salad', 'suppe', 'soup',
  'bier', 'beer', 'cocktail', 'spritzer',
  'bubble tea', 'boba', 'frozen yogurt', 'froyo',
  'popcorn', 'nachos', 'tacos', 'burrito',
  'milchshake', 'milkshake', 'latte', 'cappuccino',
  'espresso', 'frühstück', 'breakfast', 'brunch',
  'margherita', 'marinara', 'calzone', 'focaccia',
  'hummus', 'shawarma', 'poke', 'açai', 'acai',
  'bagel', 'pretzel', 'brezel',
  // Türkische Food-Keywords (Wien-Kebab-Szene!)
  'lahmacun', 'pide', 'dürüm', 'adana', 'iskender',
  'çorba', 'börek', 'baklava', 'künefe', 'lokma',
  'tantuni', 'köfte', 'kofte', 'simit', 'çay',
];

const NON_FOOD_KEYWORDS = [
  // Fitness & Beauty
  'haarschnitt', 'haircut', 'friseur', 'barber',
  'training', 'probetraining', 'fitness', 'yoga',
  'massage', 'beauty', 'kosmetik', 'maniküre',
  // Proben & Samples
  'probe', 'sample', 'goodie bag', 'goodiebag',
  'produktprobe', 'gratisproben', 'testen', 'produkttest',
  'geschenk', 'gift', 'merch', 't-shirt', 'goodies',
  // Events & Kultur
  'festival', 'konzert', 'concert', 'open air', 'openair',
  'ausstellung', 'exhibition', 'museum', 'galerie', 'gallery',
  'lesung', 'vortrag', 'führung', 'tour', 'stadtführung',
  'kino', 'cinema', 'film', 'screening',
  'theater', 'performance', 'show',
  'flohmarkt', 'markt', 'market', 'bazar',
  // Workshops & Kurse
  'workshop', 'kurs', 'class', 'seminar',
  'schnupperkurs', 'probelektion', 'schnuppern',
  // Kinder & Familie
  'kinderfest', 'spielplatz', 'basteln', 'kinderworkshop',
  'familientag', 'kindertag', 'spielefest',
  // Sport & Outdoor
  'lauftreff', 'wanderung', 'radtour', 'outdoor',
  'sportfest', 'turnier', 'open training',
  // Tattoo & Piercing
  'tattoo', 'piercing',
];

const WIEN_KEYWORDS = [
  'wien', 'vienna', 'vienne',
  '1010', '1020', '1030', '1040', '1050', '1060', '1070', '1080', '1090',
  '1100', '1110', '1120', '1130', '1140', '1150', '1160', '1170', '1180', '1190',
  '1200', '1210', '1220', '1230',
  'favoriten', 'ottakring', 'hernals', 'döbling', 'floridsdorf',
  'donaustadt', 'leopoldstadt', 'landstraße', 'wieden', 'margareten',
  'mariahilf', 'neubau', 'josefstadt', 'alsergrund', 'meidling',
  'hietzing', 'penzing', 'rudolfsheim', 'liesing', 'innere stadt',
  'prater', 'naschmarkt', 'stephansplatz', 'mariahilfer',
  'schwedenplatz', 'karlsplatz', 'westbahnhof', 'hauptbahnhof',
  'donaukanal', 'ringstraße', 'gürtel', 'simmering', 'brigittenau', 'währing',
];

const SPAM_KEYWORDS = [
  // Engagement-Bait (die nervigen "tagge 3 Freunde" Posts)
  'tagge 3', 'tag 3', 'markiere 3', 'tagge deine',
  'markiere deine', 'tag your', 'tag a friend',
  'markiere einen freund', 'tagge einen freund',
  'kommentiere mit', 'like & kommentiere',
  'folge uns und', 'follow und tag',
  // MLM/Scam
  'dm for', 'dm für', 'passive income', 'network marketing',
  'mlm', 'crypto', 'nft', 'invest', 'abnehmen', 'diät', 'weight loss',
  'follow for follow', 'f4f', 'like for like', 'l4l',
  'onlyfans', 'link in bio kaufen', 'shop now', 'swipe up',
  'affiliate', 'provision', 'nebenjob', 'homeoffice job',
  'dm me', 'dm uns', 'schreib uns eine dm',
];

const EXPIRED_KEYWORDS = [
  'war gestern', 'ist vorbei', 'leider ausverkauft', 'leider vorbei',
  'bereits vergriffen', 'sold out', 'ausverkauft', 'nicht mehr verfügbar',
  'abgelaufen', 'expired', 'letzte woche', 'letzten monat',
];

// ============================================
// IMAGE TEXT EXTRACTION (Instagram Alt-Text)
// ============================================
// Instagram generiert automatisch Alt-Text mit Bildbeschreibung.
// Wenn Text auf dem Bild steht, enthält alt: "text that says '...'"
// Das nutzen wir als kostenloses OCR - besser als Tesseract!

function extractImageText(post) {
  const alt = post.alt || post.accessibilityCaption || '';
  if (!alt) return '';

  // Instagram-Format: "May be an image of text that says 'GRATIS DÖNER zur Eröffnung!'"
  // Auch: "text that says '...'" oder "text that says \"...\""
  const textMatches = [];

  // Pattern 1: text that says '...'
  const singleQuote = alt.match(/text that says\s*['']([^'']+)['']/gi);
  if (singleQuote) {
    singleQuote.forEach(m => {
      const inner = m.match(/['']([^'']+)['']/);
      if (inner) textMatches.push(inner[1]);
    });
  }

  // Pattern 2: text that says "..."
  const doubleQuote = alt.match(/text that says\s*[""]([^""]+)[""][^""]*/gi);
  if (doubleQuote) {
    doubleQuote.forEach(m => {
      const inner = m.match(/[""]([^""]+)[""]/);
      if (inner) textMatches.push(inner[1]);
    });
  }

  // Pattern 3: Sometimes without quotes, just "text that says XYZ"
  if (textMatches.length === 0) {
    const noQuote = alt.match(/text that says\s+([^.,]+)/i);
    if (noQuote) textMatches.push(noQuote[1]);
  }

  return textMatches.join(' ').trim();
}

// ============================================
// DEAL VALIDIERUNG (Streng!)
// ============================================

function validateDeal(post) {
  const caption = (post.caption || '').toLowerCase();
  const location = (post.locationName || '').toLowerCase();
  const imageText = extractImageText(post).toLowerCase();
  // Combine caption + image text for keyword matching
  const searchText = imageText ? caption + ' ' + imageText : caption;
  const allText = searchText + ' ' + location;

  if (SPAM_KEYWORDS.some(k => matchesKeyword(caption, k)))
    return { valid: false, reason: 'spam' };

  if (EXPIRED_KEYWORDS.some(k => matchesKeyword(caption, k)))
    return { valid: false, reason: 'expired' };

  const hashtagCount = (caption.match(/#/g) || []).length;
  if (hashtagCount > CONFIG.maxHashtags)
    return { valid: false, reason: 'too_many_hashtags' };

  if (post.timestamp) {
    const daysDiff = (Date.now() - new Date(post.timestamp).getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > CONFIG.maxAgeDays)
      return { valid: false, reason: 'too_old' };
  }

  if (caption.length < 30 && !imageText)
    return { valid: false, reason: 'too_short' };

  // CHECK 1: Deal-Typ (suche in Caption UND Bildtext!)
  const gratisMatches = matchKeywords(searchText, GRATIS_KEYWORDS);
  const preisMatches = matchKeywords(searchText, PREIS_KEYWORDS);
  const aktionMatches = matchKeywords(searchText, AKTION_KEYWORDS);
  const gewinnspielMatches = matchKeywords(searchText, GEWINNSPIEL_KEYWORDS);
  const isGratis = gratisMatches.length > 0;
  const hasGoodPrice = preisMatches.length > 0;
  const hasAktion = aktionMatches.length > 0;
  const isGewinnspiel = gewinnspielMatches.length > 0;

  // Track ob Deal nur durch Bildtext gefunden wurde
  const captionOnly = matchKeywords(caption, [...GRATIS_KEYWORDS, ...PREIS_KEYWORDS, ...AKTION_KEYWORDS, ...GEWINNSPIEL_KEYWORDS]);
  const foundViaImageText = captionOnly.length === 0 && (isGratis || hasGoodPrice || hasAktion || isGewinnspiel);

  // ⚠️ FAKE-GRATIS CHECK: "gratis dazu", "gratis bei Kauf" = NICHT echt gratis!
  const fakeGratisMatches = matchKeywords(searchText, FAKE_GRATIS_KEYWORDS);
  const isFakeGratis = fakeGratisMatches.length > 0;

  // Wenn "gratis" nur fake-gratis ist, downgrade zu Aktion
  const isTrulyGratis = isGratis && !isFakeGratis && !isGewinnspiel; // Gewinnspiel ≠ Gratis!
  const isConditionalGratis = isGratis && isFakeGratis;

  if (!isGratis && !hasGoodPrice && !hasAktion && !isGewinnspiel)
    return { valid: false, reason: 'no_deal_type' };

  // CHECK 2: Produkt (suche auch in Bildtext!)
  const foodMatches = matchKeywords(searchText, FOOD_KEYWORDS);
  const nonFoodMatches = matchKeywords(searchText, NON_FOOD_KEYWORDS);
  const hasFood = foodMatches.length > 0;
  const hasNonFood = nonFoodMatches.length > 0;

  if (!hasFood && !hasNonFood)
    return { valid: false, reason: 'no_product' };

  // CHECK 3: Wien
  // CHECK 3: Wien - trusted accounts überspringen den Check
  const isTrustedWienAccount = WIEN_TRUSTED_ACCOUNTS.has((post.ownerUsername || '').toLowerCase());
  if (!isTrustedWienAccount && !WIEN_KEYWORDS.some(k => matchesKeyword(allText, k)))
    return { valid: false, reason: 'not_vienna' };

  // QUALITY SCORE - Echt gratis wird stark bevorzugt!
  let score = 0;

  // Deal-Klarheit (max 40) - ECHT GRATIS = höchster Score
  if (isTrulyGratis) score += 35;          // Echt kostenlos = Jackpot
  else if (isConditionalGratis) score += 15; // "Gratis dazu" = nur ein Rabatt
  else if (hasGoodPrice) score += 20;
  else if (hasAktion) score += 18;
  else if (isGewinnspiel) score += 10;      // Gewinnspiel = niedrigster Deal-Score (Lotterie, nicht sicher)
  if (gratisMatches.length + preisMatches.length + aktionMatches.length >= 2) score += 5;

  if (hasFood) score += 15;
  if (hasNonFood) score += 10;
  if (foodMatches.length >= 2) score += 5;

  if (location && WIEN_KEYWORDS.some(k => matchesKeyword(location, k))) score += 15;
  if (isTrustedWienAccount) score += 10;  // Trusted Wien-Account Bonus
  if (allText.match(/1[0-2][0-9]0\s*wien/i)) score += 5;

  const likes = post.likesCount || 0;
  if (likes > 200) score += 15;
  else if (likes > 100) score += 12;
  else if (likes > 50) score += 8;
  else if (likes > 20) score += 5;

  if (searchText.match(/\d{4}\s*wien/i)) score += 5;
  if (searchText.match(/\d{1,2}[.:]\d{2}\s*(uhr|h\b)/i)) score += 5;

  // 🆕 FRESHNESS BONUS - Deals von heute/gestern sind wertvoller!
  if (post.timestamp) {
    const hoursAgo = (Date.now() - new Date(post.timestamp).getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 12) score += 15;        // Unter 12h = super frisch
    else if (hoursAgo < 24) score += 12;    // Heute
    else if (hoursAgo < 48) score += 8;     // Gestern
    else if (hoursAgo < 72) score += 4;     // 2-3 Tage
    // Älter = kein Bonus
  }

  const textWithoutHashtags = caption.replace(/#\w+/g, '').trim();
  if (textWithoutHashtags.length < 40 && !imageText) score -= 15;

  return {
    valid: score >= CONFIG.minScore,
    review: score >= CONFIG.reviewMinScore && score < CONFIG.minScore,
    score, isGratis: isTrulyGratis, isConditionalGratis, isGewinnspiel,
    hasGoodPrice, hasAktion, hasFood, hasNonFood,
    foodMatches, nonFoodMatches, foundViaImageText,
    imageText: imageText || null,
    reason: score >= CONFIG.minScore ? 'approved' : (score >= CONFIG.reviewMinScore ? 'review' : 'low_score'),
  };
}

// ============================================
// TITEL-GENERIERUNG (Base-Deal-Standard!)
// Format: "GRATIS [Produkt]" / "[Preis] [Produkt]"
// ============================================

function findBestProduct(lower) {
  const products = [
    ['margherita', 'Margherita'], ['marinara', 'Marinara'], ['calzone', 'Calzone'],
    ['kebab', 'Kebab'], ['kebap', 'Kebap'], ['döner', 'Döner'],
    ['schnitzel', 'Schnitzel'], ['burger', 'Burger'], ['pizza', 'Pizza'],
    ['sushi', 'Sushi'], ['ramen', 'Ramen'], ['falafel', 'Falafel'],
    ['cappuccino', 'Cappuccino'], ['latte', 'Latte'], ['espresso', 'Espresso'],
    ['kaffee', 'Kaffee'], ['coffee', 'Kaffee'],
    ['croissant', 'Croissant'], ['bagel', 'Bagel'],
    ['smoothie', 'Smoothie'], ['bubble tea', 'Bubble Tea'], ['boba', 'Bubble Tea'],
    ['frozen yogurt', 'Frozen Yogurt'],
    ['eis', 'Eis'], ['gelato', 'Gelato'],
    ['cocktail', 'Cocktail'], ['spritzer', 'Spritzer'],
    ['bier', 'Bier'],
    ['wrap', 'Wrap'], ['burrito', 'Burrito'], ['tacos', 'Tacos'],
    ['frühstück', 'Frühstück'], ['brunch', 'Brunch'],
    ['bowl', 'Bowl'], ['salat', 'Salat'],
    ['sandwich', 'Sandwich'], ['suppe', 'Suppe'],
    ['kuchen', 'Kuchen'], ['torte', 'Torte'],
    ['donut', 'Donut'], ['muffin', 'Muffin'], ['waffel', 'Waffel'],
    ['pommes', 'Pommes'], ['hot dog', 'Hot Dog'],
    ['haarschnitt', 'Haarschnitt'], ['probetraining', 'Probetraining'],
    ['massage', 'Massage'], ['yoga', 'Yoga-Stunde'], ['workshop', 'Workshop'],
    // Events & Kultur
    ['festival', 'Festival'], ['konzert', 'Konzert'], ['concert', 'Konzert'],
    ['open air', 'Open-Air Event'], ['openair', 'Open-Air Event'],
    ['ausstellung', 'Ausstellung'], ['exhibition', 'Ausstellung'],
    ['museum', 'Museum'], ['galerie', 'Galerie'],
    ['lesung', 'Lesung'], ['vortrag', 'Vortrag'],
    ['führung', 'Führung'], ['stadtführung', 'Stadtführung'],
    ['kino', 'Kino'], ['screening', 'Filmvorführung'],
    ['theater', 'Theater'], ['flohmarkt', 'Flohmarkt'],
    // Kinder
    ['kinderfest', 'Kinderfest'], ['spielefest', 'Spielefest'],
    ['basteln', 'Bastel-Workshop'], ['kinderworkshop', 'Kinderworkshop'],
    // Sport
    ['lauftreff', 'Lauftreff'], ['wanderung', 'Wanderung'],
    ['radtour', 'Radtour'], ['sportfest', 'Sportfest'],
    // Proben
    ['produkttest', 'Produkttest'], ['schnupperkurs', 'Schnupperkurs'],
  ];

  for (const [kw, label] of products) {
    if (matchesKeyword(lower, kw)) return label;
  }
  return 'Essen';
}

function generateTitle(post, validation) {
  const caption = post.caption || '';
  const imageText = extractImageText(post).toLowerCase();
  const lower = caption.toLowerCase() + (imageText ? ' ' + imageText : '');
  const product = findBestProduct(lower);

  // ECHT GRATIS - bekommt "GRATIS" Prefix
  if (validation.isGratis) {
    if (lower.includes('neueröffnung') || lower.includes('eröffnung') || lower.includes('opening'))
      return `GRATIS ${product} - Neueröffnung`;
    if (lower.includes('geburtstag') || lower.includes('birthday'))
      return `GRATIS ${product} am Geburtstag`;
    if (lower.includes('1+1') || lower.includes('2 für 1'))
      return `GRATIS ${product} - 1+1 Aktion`;
    if (lower.includes('spendieren') || lower.includes('auf uns') || lower.includes('aufs haus'))
      return `GRATIS ${product} aufs Haus`;
    if (lower.includes('eintritt frei') || lower.includes('freier eintritt'))
      return `GRATIS Eintritt - ${product}`;
    if (lower.includes('festival') || lower.includes('open air'))
      return `GRATIS ${product}`;
    return `GRATIS ${product}`;
  }

  // FAKE GRATIS - "Zugabe bei Kauf", nicht "GRATIS"
  if (validation.isConditionalGratis) {
    return `${product} gratis dazu (bei Kauf)`;
  }

  // GEWINNSPIEL - klar als Verlosung kennzeichnen
  if (validation.isGewinnspiel) {
    return `🎰 ${product} zu gewinnen (Gewinnspiel)`;
  }

  if (validation.hasAktion) {
    if (lower.includes('1+1')) return `1+1 ${product} GRATIS`;
    if (lower.includes('happy hour')) return `Happy Hour: ${product} reduziert`;
    const pctMatch = lower.match(/(-?\d{2,3})%/);
    if (pctMatch) return `${pctMatch[0]} auf ${product}`;
    if (lower.includes('halber preis')) return `${product} zum halben Preis`;
    if (lower.includes('eröffnung')) return `Eröffnungsangebot: ${product}`;
    return `${product} Aktion`;
  }

  if (validation.hasGoodPrice) {
    const priceMatch = caption.match(/(\d+[.,]?\d*)\s*€|€\s*(\d+[.,]?\d*)/);
    if (priceMatch) {
      const price = priceMatch[1] || priceMatch[2];
      return `${product} um nur ${price}€`;
    }
    const umMatch = caption.match(/(um|für|nur|ab)\s+(\d+[.,]?\d*)\s*(euro|€)/i);
    if (umMatch) return `${product} ${umMatch[1]} ${umMatch[2]}€`;
    return `${product} zum Sonderpreis`;
  }

  return `${product} Deal`;
}

// ============================================
// BRAND-EXTRAKTION
// ============================================

function extractBrand(post) {
  if (post.ownerFullName && post.ownerFullName.length > 1) {
    return cleanBrand(post.ownerFullName);
  }
  if (post.ownerUsername) {
    return cleanBrand(
      post.ownerUsername.replace(/[._]/g, ' ').replace(/\b(wien|vienna|official|at)\b/gi, '').trim()
    );
  }
  if (post.locationName) return cleanBrand(post.locationName);
  return 'Instagram Deal';
}

function cleanBrand(name) {
  return name.replace(/\b\w/g, c => c.toUpperCase()).replace(/\s+/g, ' ').trim().substring(0, 25);
}

// ============================================
// BESCHREIBUNG (Base-Deal-Standard)
// ============================================

function generateDescription(post, validation, title) {
  const caption = post.caption || '';
  const brand = extractBrand(post);
  const location = post.locationName || '';
  const imageText = extractImageText(post);

  // Combine caption and image text for finding the best description
  let textSource = caption;
  if (imageText && validation.foundViaImageText) {
    textSource = imageText + '. ' + caption;
  }

  let clean = textSource.replace(/#\w+/g, '').replace(/@\w+/g, '').replace(/\n+/g, '. ').replace(/\s+/g, ' ').trim();
  const sentences = clean.split(/[.!?\n]/).map(s => s.trim()).filter(s => s.length > 15 && s.length < 200);

  let bestSentence = '';
  let bestScore = 0;

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    let sc = 0;
    if ([...GRATIS_KEYWORDS, ...PREIS_KEYWORDS, ...AKTION_KEYWORDS].some(k => matchesKeyword(lower, k))) sc += 3;
    if ([...FOOD_KEYWORDS, ...NON_FOOD_KEYWORDS].some(k => matchesKeyword(lower, k))) sc += 2;
    if (lower.match(/\d{4}\s*wien/i)) sc += 2;
    if (lower.match(/(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|täglich)/i)) sc += 1;
    if (sentence.length > 20 && !title.toLowerCase().includes(sentence.toLowerCase().substring(0, 15))) sc += 1;
    if (sc > bestScore) { bestScore = sc; bestSentence = sentence; }
  }

  let desc = (bestSentence && bestScore >= 3) ? bestSentence : sentences.slice(0, 2).join('. ');

  if (location && !desc.toLowerCase().includes(location.toLowerCase().substring(0, 10))) {
    desc += ` | ${location}`;
  }

  if (desc.length > 130) desc = desc.substring(0, 127) + '...';

  return desc || `Deal von ${brand} in Wien. Mehr Info auf Instagram.`;
}

// ============================================
// ADRESSE EXTRAHIEREN
// ============================================

function extractLocation(post) {
  const caption = (post.caption || '').toLowerCase();
  const location = post.locationName || '';

  const plzMatch = caption.match(/(1[0-2]\d0)\s*wien/i);
  if (plzMatch) return `${plzMatch[1]} Wien`;

  const addrMatch = caption.match(/(\d+)\.\s*bezirk/i);
  if (addrMatch) return `${addrMatch[1]}. Bezirk Wien`;

  const bezirke = {
    'innere stadt': '1010', leopoldstadt: '1020', 'landstraße': '1030',
    wieden: '1040', margareten: '1050', mariahilf: '1060', neubau: '1070',
    josefstadt: '1080', alsergrund: '1090', favoriten: '1100', simmering: '1110',
    meidling: '1120', hietzing: '1130', penzing: '1140', rudolfsheim: '1150',
    ottakring: '1160', hernals: '1170', 'währing': '1180', 'döbling': '1190',
    brigittenau: '1200', floridsdorf: '1210', donaustadt: '1220', liesing: '1230',
  };

  const allText = caption + ' ' + location.toLowerCase();
  for (const [name, plz] of Object.entries(bezirke)) {
    if (allText.includes(name)) return `${plz} Wien`;
  }

  if (location) return location;
  return 'Wien';
}

// ============================================
// KATEGORIE & LOGO
// ============================================

function categorize(caption, validation) {
  const lower = caption.toLowerCase();

  const coffeeWords = ['kaffee', 'coffee', 'latte', 'cappuccino', 'espresso', 'café', 'cafe'];
  if (coffeeWords.some(k => matchesKeyword(lower, k)) && !matchesKeyword(lower, 'pizza') && !matchesKeyword(lower, 'burger'))
    return { category: 'kaffee', logo: '☕' };

  if (matchesKeyword(lower, 'kebab') || matchesKeyword(lower, 'kebap') || matchesKeyword(lower, 'döner')) return { category: 'essen', logo: '🥙' };
  if (matchesKeyword(lower, 'pizza') || matchesKeyword(lower, 'margherita')) return { category: 'essen', logo: '🍕' };
  if (matchesKeyword(lower, 'burger')) return { category: 'essen', logo: '🍔' };
  if (matchesKeyword(lower, 'sushi')) return { category: 'essen', logo: '🍣' };
  if (matchesKeyword(lower, 'eis') || matchesKeyword(lower, 'gelato')) return { category: 'essen', logo: '🍦' };
  if (matchesKeyword(lower, 'bubble tea') || matchesKeyword(lower, 'boba')) return { category: 'essen', logo: '🧋' };
  if (lower.includes('frühstück') || matchesKeyword(lower, 'brunch')) return { category: 'essen', logo: '🥐' };
  if (matchesKeyword(lower, 'bowl') || matchesKeyword(lower, 'salat')) return { category: 'essen', logo: '🥗' };
  if (matchesKeyword(lower, 'cocktail') || matchesKeyword(lower, 'bier') || matchesKeyword(lower, 'spritzer')) return { category: 'essen', logo: '🍺' };
  if (lower.includes('schnitzel')) return { category: 'essen', logo: '🍽️' };
  if (matchesKeyword(lower, 'training') || matchesKeyword(lower, 'fitness') || matchesKeyword(lower, 'yoga')) return { category: 'fitness', logo: '💪' };
  if (lower.includes('friseur') || matchesKeyword(lower, 'barber') || lower.includes('haarschnitt')) return { category: 'beauty', logo: '💈' };
  if (matchesKeyword(lower, 'beauty') || lower.includes('kosmetik')) return { category: 'beauty', logo: '💄' };
  // Events & Kultur
  if (lower.includes('festival') || matchesKeyword(lower, 'open air') || lower.includes('openair')) return { category: 'events', logo: '🎪' };
  if (lower.includes('konzert') || matchesKeyword(lower, 'concert') || lower.includes('live musik')) return { category: 'events', logo: '🎵' };
  if (matchesKeyword(lower, 'museum') || lower.includes('ausstellung') || lower.includes('galerie')) return { category: 'kultur', logo: '🏛️' };
  if (matchesKeyword(lower, 'kino') || matchesKeyword(lower, 'film') || lower.includes('screening')) return { category: 'kultur', logo: '🎬' };
  if (lower.includes('theater') || matchesKeyword(lower, 'lesung') || lower.includes('vortrag')) return { category: 'kultur', logo: '🎭' };
  if (lower.includes('führung') || matchesKeyword(lower, 'tour') || lower.includes('stadtführung')) return { category: 'kultur', logo: '🚶' };
  if (lower.includes('flohmarkt') || matchesKeyword(lower, 'markt') || matchesKeyword(lower, 'bazar')) return { category: 'shopping', logo: '🛍️' };
  // Kinder & Familie
  if (lower.includes('kinder') || lower.includes('familie') || lower.includes('spielefest') || matchesKeyword(lower, 'basteln')) return { category: 'familie', logo: '👨‍👩‍👧‍👦' };
  // Sport & Outdoor
  if (lower.includes('lauftreff') || lower.includes('wanderung') || lower.includes('radtour') || lower.includes('sportfest')) return { category: 'sport', logo: '🏃' };
  // Proben & Samples
  if (lower.includes('produkttest') || matchesKeyword(lower, 'probe') || matchesKeyword(lower, 'sample') || matchesKeyword(lower, 'goodie')) return { category: 'proben', logo: '🎁' };

  if (validation.hasFood) return { category: 'essen', logo: '🍽️' };
  return { category: 'shopping', logo: '🎁' };
}

// ============================================
// DEAL-OBJEKT ERSTELLEN
// ============================================

function createDeal(post, validation) {
  const caption = post.caption || '';
  const brand = extractBrand(post);
  const title = generateTitle(post, validation);
  const description = generateDescription(post, validation, title);
  const location = extractLocation(post);
  const { category, logo } = categorize(caption, validation);
  const likes = post.likesCount || 0;

  return {
    id: `ig-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    brand, logo, title, description,
    type: validation.isGratis ? 'gratis' : (validation.isGewinnspiel ? 'gewinnspiel' : (validation.isConditionalGratis ? 'rabatt' : 'rabatt')),
    category,
    source: `Instagram @${post.ownerUsername || 'unknown'}`,
    url: post.url || `https://www.instagram.com/p/${post.shortCode || ''}`,
    expires: validation.isGewinnspiel ? 'Teilnahme nötig' : 'Begrenzt',
    distance: location,
    hot: validation.isGratis && likes > 50,
    isNew: true, isInstagramDeal: true,
    priority: validation.isGratis ? 2 : (validation.isGewinnspiel ? 4 : 3),
    votes: Math.min(Math.round(likes / 10), 50),
    qualityScore: validation.score,
    pubDate: post.timestamp || new Date().toISOString(),
    _foundViaImageText: validation.foundViaImageText || false,
  };
}

// ============================================
// DUPLIKAT-CHECK (Streng!)
// ============================================

function isDuplicate(deal, existingDeals) {
  const normalize = s => s.toLowerCase().replace(/[^a-zäöüß0-9]/g, '').substring(0, 20);

  for (const existing of existingDeals) {
    // Gleiche URL = definitiv Duplikat
    if (existing.url && deal.url && existing.url === deal.url)
      return true;
    // Gleicher IG-User + ähnlicher Titel (selber Post in anderem Format)
    if (existing.isInstagramDeal && existing.source === deal.source &&
        normalize(existing.title) === normalize(deal.title))
      return true;
    // Brand schon in Base-Deals (handkuratiert > scraped)
    if (!existing.isInstagramDeal && existing.brand.toLowerCase() === deal.brand.toLowerCase())
      return true;
  }
  return false;
}

// ============================================
// APIFY API
// ============================================

function apifyRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.apify.com', port: 443, path, method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${APIFY_API_TOKEN}` },
    };
    if (body) options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON Parse Error: ${data.substring(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('Timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runApifyHashtagScraper(hashtags) {
  console.log('📸 Phase 1: Hashtag-Scraping...');
  console.log(`   Hashtags: ${hashtags.map(h => '#' + h).join(', ')}`);

  const actorId = 'apify~instagram-hashtag-scraper';
  const input = { hashtags, resultsPerHashtag: CONFIG.postsPerHashtag, searchType: 'posts' };

  try {
    console.log('   ⏳ Starte Scraper Run...');
    const runResult = await apifyRequest(
      `/v2/acts/${actorId}/runs?token=${APIFY_API_TOKEN}`, 'POST', input
    );

    if (!runResult.data || !runResult.data.id) {
      console.log('   ❌ Konnte Scraper nicht starten:', JSON.stringify(runResult).substring(0, 200));
      return [];
    }

    const runId = runResult.data.id;
    console.log(`   ✅ Run gestartet: ${runId}`);

    let status = 'RUNNING';
    let attempts = 0;
    while (status === 'RUNNING' || status === 'READY') {
      attempts++;
      if (attempts > 18) { console.log('   ⏰ Timeout - Abbruch'); break; }
      await new Promise(r => setTimeout(r, 10000));
      const runInfo = await apifyRequest(`/v2/acts/${actorId}/runs/${runId}?token=${APIFY_API_TOKEN}`);
      status = runInfo.data?.status || 'UNKNOWN';
      console.log(`   ⏳ Status: ${status} (${attempts}/18)`);
    }

    if (status !== 'SUCCEEDED') { console.log(`   ❌ Run: ${status}`); return []; }

    const datasetId = runResult.data.defaultDatasetId;
    console.log(`   📦 Lade Ergebnisse...`);
    const results = await apifyRequest(`/v2/datasets/${datasetId}/items?token=${APIFY_API_TOKEN}&limit=500`);

    if (Array.isArray(results)) { console.log(`   ✅ ${results.length} Posts von Hashtags geladen`); return results; }
    console.log('   ⚠️  Unerwartetes Format');
    return [];
  } catch (error) {
    console.log(`   ❌ Hashtag-Scraper Fehler: ${error.message}`);
    return [];
  }
}

async function runApifyAccountScraper(accounts) {
  console.log('\n👤 Phase 2: Account-Scraping...');
  console.log(`   Accounts: ${accounts.map(a => '@' + a).join(', ')}`);

  // Use instagram-post-scraper to get recent posts from specific accounts
  const actorId = 'apify~instagram-post-scraper';
  const input = {
    username: accounts,
    resultsLimit: 5,  // Nur die 5 neuesten Posts pro Account
  };

  try {
    console.log('   ⏳ Starte Account-Scraper...');
    const runResult = await apifyRequest(
      `/v2/acts/${actorId}/runs?token=${APIFY_API_TOKEN}`, 'POST', input
    );

    if (!runResult.data || !runResult.data.id) {
      console.log('   ❌ Konnte Account-Scraper nicht starten:', JSON.stringify(runResult).substring(0, 200));
      return [];
    }

    const runId = runResult.data.id;
    console.log(`   ✅ Run gestartet: ${runId}`);

    let status = 'RUNNING';
    let attempts = 0;
    while (status === 'RUNNING' || status === 'READY') {
      attempts++;
      if (attempts > 24) { console.log('   ⏰ Timeout - Abbruch'); break; }
      await new Promise(r => setTimeout(r, 10000));
      const runInfo = await apifyRequest(`/v2/acts/${actorId}/runs/${runId}?token=${APIFY_API_TOKEN}`);
      status = runInfo.data?.status || 'UNKNOWN';
      console.log(`   ⏳ Status: ${status} (${attempts}/24)`);
    }

    if (status !== 'SUCCEEDED') { console.log(`   ❌ Run: ${status}`); return []; }

    const datasetId = runResult.data.defaultDatasetId;
    console.log(`   📦 Lade Account-Posts...`);
    const results = await apifyRequest(`/v2/datasets/${datasetId}/items?token=${APIFY_API_TOKEN}&limit=500`);

    if (Array.isArray(results)) { console.log(`   ✅ ${results.length} Posts von Accounts geladen`); return results; }
    console.log('   ⚠️  Unerwartetes Format');
    return [];
  } catch (error) {
    console.log(`   ❌ Account-Scraper Fehler: ${error.message}`);
    return [];
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📸 INSTAGRAM DEAL SCRAPER v2 gestartet');
  console.log(`📅 ${new Date().toLocaleString('de-AT')}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const dealsPath = 'docs/deals.json';
  if (fs.existsSync(dealsPath)) {
    fs.copyFileSync(dealsPath, 'docs/deals.backup.json');
    console.log('💾 Backup erstellt\n');
  }

  // Phase 1: Hashtag-Scraping
  const hashtagPosts = await runApifyHashtagScraper(HASHTAGS);
  
  // Phase 2: Account-Scraping
  const accountPosts = await runApifyAccountScraper(ACCOUNTS);
  
  // Zusammenführen und deduplizieren nach Post-URL
  const seenUrls = new Set();
  const allPosts = [];
  for (const post of [...accountPosts, ...hashtagPosts]) { // Accounts zuerst (höhere Priorität)
    const url = post.url || post.shortCode || '';
    if (url && seenUrls.has(url)) continue;
    if (url) seenUrls.add(url);
    allPosts.push(post);
  }
  
  console.log(`\n📊 Gesamt: ${allPosts.length} unique Posts (${hashtagPosts.length} Hashtags + ${accountPosts.length} Accounts)`);

  if (allPosts.length === 0) { console.log('\n⚠️  Keine Posts - beende'); process.exit(0); }

  console.log(`\n🔍 Validiere ${allPosts.length} Posts...\n`);

  const posts = allPosts;

  const approvedDeals = [];
  const reviewDeals = [];
  const rejected = {};
  const brandCount = {};  // Max 1 Deal pro Brand!

  for (const post of posts) {
    const result = validateDeal(post);
    if (result.valid) {
      const deal = createDeal(post, result);
      
      // Per-Brand-Limit: Max 1 Deal pro Instagram-Account
      const brandKey = deal.brand.toLowerCase();
      if ((brandCount[brandKey] || 0) >= CONFIG.maxDealsPerBrand) {
        rejected['brand_limit'] = (rejected['brand_limit'] || 0) + 1;
        continue;
      }
      brandCount[brandKey] = (brandCount[brandKey] || 0) + 1;
      
      approvedDeals.push(deal);
      const freeTag = result.isGratis ? '🆓 ECHT GRATIS' : (result.isGewinnspiel ? '🎰 GEWINNSPIEL' : (result.isConditionalGratis ? '⚠️ Gratis bei Kauf' : '💰 Rabatt'));
      const imgTag = result.foundViaImageText ? ' 🖼️ VIA BILDTEXT' : '';
      console.log(`   ✅ ${deal.logo} ${deal.title} [Score: ${result.score}] ${freeTag}${imgTag}`);
      console.log(`      → ${deal.brand} | ${deal.distance}`);
    } else if (result.review) {
      reviewDeals.push(createDeal(post, result));
    } else {
      rejected[result.reason] = (rejected[result.reason] || 0) + 1;
    }
  }

  const totalRejected = Object.values(rejected).reduce((a, b) => a + b, 0);
  const imageTextDeals = approvedDeals.filter(d => d._foundViaImageText).length;
  console.log('\n📊 ERGEBNIS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   📥 Posts:       ${posts.length}`);
  console.log(`   ✅ Approved:    ${approvedDeals.length}`);
  if (imageTextDeals > 0) console.log(`   🖼️ Via Bildtext: ${imageTextDeals}`);
  console.log(`   📝 Review:      ${reviewDeals.length}`);
  console.log(`   ❌ Abgelehnt:   ${totalRejected}`);
  for (const [reason, count] of Object.entries(rejected).sort((a, b) => b[1] - a[1])) {
    console.log(`      → ${reason}: ${count}`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (approvedDeals.length > 0 && fs.existsSync(dealsPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(dealsPath, 'utf8'));

      // Abgelaufene IG-Deals entfernen
      const expiryDate = new Date(Date.now() - CONFIG.dealExpiryDays * 24 * 60 * 60 * 1000);
      const before = existing.deals.length;
      existing.deals = existing.deals.filter(d => {
        if (!d.isInstagramDeal) return true;
        return new Date(d.pubDate || 0) > expiryDate;
      });
      const expired = before - existing.deals.length;
      if (expired > 0) console.log(`🗑️  ${expired} abgelaufene IG-Deals entfernt`);

      // Einfügen mit Duplikat-Check
      let added = 0;
      const sorted = approvedDeals.sort((a, b) => b.qualityScore - a.qualityScore).slice(0, CONFIG.maxDealsPerRun);

      for (const deal of sorted) {
        if (!isDuplicate(deal, existing.deals)) {
          existing.deals.push(deal);
          added++;
          console.log(`   ➕ ${deal.logo} ${deal.title}`);
        } else {
          console.log(`   ⏭️  Duplikat: ${deal.title}`);
        }
      }

      // Sortieren: Priority > Gratis > Frisch > Hot
      existing.deals.sort((a, b) => {
        if ((a.priority || 99) !== (b.priority || 99)) return (a.priority || 99) - (b.priority || 99);
        if (a.type === 'gratis' && b.type !== 'gratis') return -1;
        if (a.type !== 'gratis' && b.type === 'gratis') return 1;
        if (a.type === 'gewinnspiel' && b.type !== 'gewinnspiel') return 1; // Gewinnspiele nach hinten
        if (a.type !== 'gewinnspiel' && b.type === 'gewinnspiel') return -1;
        // Neuere IG-Deals zuerst
        if (a.isInstagramDeal && b.isInstagramDeal) {
          return new Date(b.pubDate || 0) - new Date(a.pubDate || 0);
        }
        if (a.hot && !b.hot) return -1;
        if (!a.hot && b.hot) return 1;
        return 0;
      });

      existing.totalDeals = existing.deals.length;
      existing.lastUpdated = new Date().toISOString();
      fs.writeFileSync(dealsPath, JSON.stringify(existing, null, 2));

      console.log(`\n✅ ${added} neue Instagram-Deals eingefügt`);
      console.log(`📊 Deals total: ${existing.totalDeals}`);
    } catch (e) {
      console.log(`\n❌ Merge fehlgeschlagen: ${e.message}`);
      if (fs.existsSync('docs/deals.backup.json')) {
        fs.copyFileSync('docs/deals.backup.json', dealsPath);
        console.log('🔄 Backup wiederhergestellt');
      }
    }
  } else {
    console.log('📭 Keine neuen Deals - deals.json unverändert');
  }

  if (reviewDeals.length > 0) {
    fs.writeFileSync('docs/deals-review.json', JSON.stringify({
      lastUpdated: new Date().toISOString(),
      info: 'Score 35-49: manuelle Prüfung nötig',
      deals: reviewDeals,
    }, null, 2));
    console.log(`📋 ${reviewDeals.length} Deals in Review-Queue`);
  }

  if (fs.existsSync('docs/deals.backup.json')) fs.unlinkSync('docs/deals.backup.json');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Instagram Scraper v2 fertig!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal Error:', err.message);
    if (fs.existsSync('docs/deals.backup.json') && fs.existsSync('docs/deals.json')) {
      fs.copyFileSync('docs/deals.backup.json', 'docs/deals.json');
      console.log('🔄 Backup wiederhergestellt');
    }
    process.exit(0);
  });
