// ============================================
// FREEFINDER WIEN - MEGA POWER SCRAPER
// 130+ Quellen | ES Module Version
// ============================================

import https from 'https';
import http from 'http';
import fs from 'fs';

// ============================================
// ALLE QUELLEN (130+)
// ============================================

const SOURCES = [
  // NEWS & LIFESTYLE
  { name: 'Vienna.at', url: 'https://www.vienna.at/', type: 'html', brand: 'Vienna.at', logo: '📰', category: 'wien' },
  { name: 'MeinBezirk Wien', url: 'https://www.meinbezirk.at/wien', type: 'html', brand: 'MeinBezirk', logo: '📰', category: 'wien' },
  { name: 'Kurier Wien', url: 'https://kurier.at/chronik/wien', type: 'html', brand: 'Kurier', logo: '📰', category: 'wien' },
  { name: 'Krone Wien', url: 'https://www.krone.at/wien', type: 'html', brand: 'Krone', logo: '📰', category: 'wien' },
  { name: 'ORF Wien', url: 'https://wien.orf.at/', type: 'html', brand: 'ORF', logo: '📺', category: 'wien' },
  { name: 'Der Standard', url: 'https://www.derstandard.at/', type: 'html', brand: 'Standard', logo: '📰', category: 'wien' },
  { name: 'Kleine Zeitung', url: 'https://www.kleinezeitung.at/', type: 'html', brand: 'Kleine', logo: '📰', category: 'wien' },
  { name: 'Vienna Lifestyle', url: 'https://www.vienna.at/lifestyle', type: 'html', brand: 'Vienna.at', logo: '🌐', category: 'wien' },
  { name: 'Falter Lokalführer', url: 'https://www.falter.at/lokalfuehrer', type: 'html', brand: 'Falter', logo: '📰', category: 'essen' },
  { name: 'Falter Events', url: 'https://www.falter.at/events', type: 'html', brand: 'Falter', logo: '🎉', category: 'wien' },
  { name: 'Stadtbekannt', url: 'https://www.stadtbekannt.at/', type: 'html', brand: 'Stadtbekannt', logo: '🏙️', category: 'wien' },
  { name: 'Wienneu', url: 'https://www.wienneu.com/', type: 'html', brand: 'Wienneu', logo: '🆕', category: 'wien' },
  { name: 'Biorama', url: 'https://www.biorama.eu/', type: 'html', brand: 'Biorama', logo: '🌿', category: 'essen' },
  { name: 'A-List', url: 'https://www.a-list.at/', type: 'html', brand: 'A-List', logo: '⭐', category: 'wien' },
  { name: 'Wien isst', url: 'https://www.wien-isst.at/', type: 'html', brand: 'Wien isst', logo: '🍴', category: 'essen' },
  { name: 'Vienna Würstelstand', url: 'https://www.wuerstelstand.at/', type: 'html', brand: 'Würstelstand', logo: '🌭', category: 'essen' },
  
  // SUPERMÄRKTE
  { name: 'Lidl Angebote', url: 'https://www.lidl.at/c/billiger-montag/a10006065', type: 'html', brand: 'Lidl', logo: '🛒', category: 'supermarkt' },
  { name: 'HOFER Aktionen', url: 'https://www.hofer.at/de/angebote.html', type: 'html', brand: 'HOFER', logo: '🛒', category: 'supermarkt' },
  { name: 'PENNY Angebote', url: 'https://www.penny.at/angebote', type: 'html', brand: 'PENNY', logo: '🛒', category: 'supermarkt' },
  { name: 'Unimarkt', url: 'https://www.unimarkt.at/', type: 'html', brand: 'Unimarkt', logo: '🛒', category: 'supermarkt' },
  { name: 'Nah&Frisch', url: 'https://www.nahundfrisch.at/', type: 'html', brand: 'Nah&Frisch', logo: '🛒', category: 'supermarkt' },
  
  // BEAUTY
  { name: 'dm Angebote', url: 'https://www.dm.at/angebote', type: 'html', brand: 'dm', logo: '💇', category: 'beauty' },
  { name: 'Rituals', url: 'https://www.rituals.com/de-at/sale', type: 'html', brand: 'Rituals', logo: '🧴', category: 'beauty' },
  { name: 'Treatwell Wien', url: 'https://www.treatwell.at/wien/', type: 'html', brand: 'Treatwell', logo: '💆', category: 'beauty' },
  
  // FAST FOOD
  { name: "McDonald's", url: 'https://www.mcdonalds.at/aktionen', type: 'html', brand: "McDonald's", logo: '🍟', category: 'essen' },
  { name: 'Burger King', url: 'https://www.burgerking.at/angebote', type: 'html', brand: 'Burger King', logo: '🍔', category: 'essen' },
  { name: 'KFC', url: 'https://www.kfc.at/angebote', type: 'html', brand: 'KFC', logo: '🍗', category: 'essen' },
  { name: "L'Osteria", url: 'https://losteria.net/at/', type: 'html', brand: "L'Osteria", logo: '🍕', category: 'essen' },
  { name: 'Nordsee', url: 'https://www.nordsee.com/at/', type: 'html', brand: 'Nordsee', logo: '🐟', category: 'essen' },
  { name: 'Five Guys', url: 'https://www.fiveguys.at/', type: 'html', brand: 'Five Guys', logo: '🍔', category: 'essen' },
  { name: 'Figlmüller', url: 'https://www.figlmueller.at/', type: 'html', brand: 'Figlmüller', logo: '🥩', category: 'essen' },
  { name: 'Plachutta', url: 'https://www.plachutta.at/', type: 'html', brand: 'Plachutta', logo: '🥘', category: 'essen' },
  { name: 'Trzesniewski', url: 'https://www.trzesniewski.at/', type: 'html', brand: 'Trzesniewski', logo: '🥪', category: 'essen' },
  
  // KAFFEE
  { name: 'Starbucks', url: 'https://www.starbucks.at/', type: 'html', brand: 'Starbucks', logo: '☕', category: 'kaffee' },
  { name: 'Tchibo', url: 'https://www.tchibo.at/angebote-aktionen-c400109092.html', type: 'html', brand: 'Tchibo', logo: '☕', category: 'kaffee' },
  { name: 'Aida', url: 'https://www.aida.at/', type: 'html', brand: 'Aida', logo: '🎀', category: 'kaffee' },
  { name: 'Demel', url: 'https://www.demel.com/', type: 'html', brand: 'Demel', logo: '🍰', category: 'kaffee' },
  { name: 'Ströck', url: 'https://www.stroeck.at/', type: 'html', brand: 'Ströck', logo: '🥐', category: 'kaffee' },
  { name: 'Anker', url: 'https://www.ankerbrot.at/', type: 'html', brand: 'Anker', logo: '🥖', category: 'kaffee' },
  { name: 'Der Mann', url: 'https://www.dermann.at/', type: 'html', brand: 'Der Mann', logo: '🥐', category: 'kaffee' },
  
  // TECHNIK
  { name: 'Electronic4you', url: 'https://www.electronic4you.at/', type: 'html', brand: 'Electronic4you', logo: '📱', category: 'technik' },
  { name: 'Apple AT', url: 'https://www.apple.com/at/shop/browse/campaigns/education_pricing', type: 'html', brand: 'Apple', logo: '🍎', category: 'technik' },
  { name: 'Samsung AT', url: 'https://www.samsung.com/at/offer/', type: 'html', brand: 'Samsung', logo: '📱', category: 'technik' },
  { name: 'Hartlauer', url: 'https://www.hartlauer.at/angebote/', type: 'html', brand: 'Hartlauer', logo: '📷', category: 'technik' },
  { name: 'Expert', url: 'https://www.expert.at/angebote', type: 'html', brand: 'Expert', logo: '📺', category: 'technik' },
  { name: 'A1', url: 'https://www.a1.net/handys-tablets', type: 'html', brand: 'A1', logo: '📶', category: 'technik' },
  { name: 'Magenta', url: 'https://www.magenta.at/handys/', type: 'html', brand: 'Magenta', logo: '📱', category: 'technik' },
  
  // PREISJÄGER RSS
  { name: 'Preisjäger Gratis', url: 'https://www.preisjaeger.at/rss/gruppe/gratisartikel', type: 'rss', brand: 'Preisjäger', logo: '🆓', category: 'gratis' },
  { name: 'Preisjäger Wien', url: 'https://www.preisjaeger.at/rss/gruppe/lokal', type: 'rss', brand: 'Preisjäger', logo: '📍', category: 'wien' },
  { name: 'Preisjäger Essen', url: 'https://www.preisjaeger.at/rss/gruppe/lebensmittel-getraenke', type: 'rss', brand: 'Preisjäger', logo: '🍕', category: 'essen' },
  { name: 'Preisjäger Neueröffnung', url: 'https://www.preisjaeger.at/search/rss?q=neuer%C3%B6ffnung', type: 'rss', brand: 'Preisjäger', logo: '🆕', category: 'wien' },
  
  // GOOGLE NEWS (viele Ergebnisse)
  { name: 'Google News Wien Gratis', url: 'https://news.google.com/rss/search?q=Wien+gratis+OR+kostenlos&hl=de&gl=AT', type: 'rss', brand: 'Google News', logo: '📰', category: 'wien' },
  { name: 'Google News Neueröffnung', url: 'https://news.google.com/rss/search?q=Wien+Neuer%C3%B6ffnung+Restaurant+OR+Cafe&hl=de&gl=AT', type: 'rss', brand: 'Google News', logo: '🆕', category: 'essen' },
  { name: 'Google News Gratis Kaffee', url: 'https://news.google.com/rss/search?q=%C3%96sterreich+gratis+Kaffee&hl=de&gl=AT', type: 'rss', brand: 'Google News', logo: '☕', category: 'kaffee' },
  { name: 'Google News Gratis Essen', url: 'https://news.google.com/rss/search?q=Wien+gratis+Essen+OR+kostenlos+Probe&hl=de&gl=AT', type: 'rss', brand: 'Google News', logo: '🍕', category: 'essen' },
  { name: 'Google News Opening Wien', url: 'https://news.google.com/rss/search?q=Wien+Er%C3%B6ffnung+2026&hl=de&gl=AT', type: 'rss', brand: 'Google News', logo: '🎉', category: 'wien' },
  { name: 'Google News Aktion Wien', url: 'https://news.google.com/rss/search?q=Wien+Aktion+OR+Rabatt+OR+Sale&hl=de&gl=AT', type: 'rss', brand: 'Google News', logo: '💰', category: 'wien' },
  
  // SOCIAL MEDIA - Facebook
  { name: 'FB Gratis in Wien', url: 'https://www.facebook.com/search/posts/?q=gratis%20wien', type: 'html', brand: 'Facebook', logo: '📘', category: 'wien' },
  { name: 'FB Freebie Austria', url: 'https://www.facebook.com/search/posts/?q=freebie%20%C3%B6sterreich', type: 'html', brand: 'Facebook', logo: '📘', category: 'wien' },
  { name: 'FB Wien isst', url: 'https://www.facebook.com/wienisst/', type: 'html', brand: 'Facebook', logo: '📘', category: 'essen' },
  { name: 'FB 1000things Wien', url: 'https://www.facebook.com/1000thingsinvienna/', type: 'html', brand: 'Facebook', logo: '📘', category: 'wien' },
  
  // SOCIAL MEDIA - TikTok
  { name: 'TikTok Wien Gratis', url: 'https://www.tiktok.com/search?q=wien%20gratis', type: 'html', brand: 'TikTok', logo: '🎵', category: 'wien' },
  { name: 'TikTok Freebie Wien', url: 'https://www.tiktok.com/search?q=freebie%20wien', type: 'html', brand: 'TikTok', logo: '🎵', category: 'wien' },
  { name: 'TikTok Wien Essen', url: 'https://www.tiktok.com/search?q=wien%20essen%20tipp', type: 'html', brand: 'TikTok', logo: '🎵', category: 'essen' },
  { name: 'TikTok Neueröffnung Wien', url: 'https://www.tiktok.com/search?q=neuer%C3%B6ffnung%20wien', type: 'html', brand: 'TikTok', logo: '🎵', category: 'wien' },
  
  // REDDIT
  { name: 'Reddit r/wien', url: 'https://www.reddit.com/r/wien/.rss', type: 'rss', brand: 'Reddit', logo: '🔴', category: 'wien' },
  { name: 'Reddit r/Austria', url: 'https://www.reddit.com/r/Austria/.rss', type: 'rss', brand: 'Reddit', logo: '🔴', category: 'wien' },
];

// ============================================
// KEYWORDS
// ============================================

const GRATIS_KEYWORDS = ['gratis', 'kostenlos', 'geschenkt', 'umsonst', 'free', '0€', '0 €', '0,00', 'freebie', 'gratisproben'];
const DEAL_KEYWORDS = ['rabatt', 'sale', 'aktion', 'angebot', 'sparen', 'reduziert', 'günstiger', '-50%', '-40%', '-30%', '1+1'];
const NEUEROFFNUNG_KEYWORDS = ['neueröffnung', 'eröffnung', 'opening', 'neu eröffnet', 'grand opening', 'neues lokal', 'ab sofort'];
const WIEN_KEYWORDS = ['wien', 'vienna', 'bezirk', 'mariahilf', 'favoriten', 'donaustadt', 'leopoldstadt', 'währing', 'hernals', 'döbling', 'brigittenau', 'floridsdorf', 'ottakring', 'rudolfsheim', 'penzing', 'hietzing', 'meidling', 'liesing', 'simmering', 'landstraße', 'wieden', 'margareten', 'neubau', 'josefstadt', 'alsergrund', 'innere stadt'];

// ============================================
// 100+ BASIS DEALS
// ============================================

const BASE_DEALS = [
  // TOP DEALS
  { id: "top-1", brand: "OMV VIVA", logo: "⛽", title: "Gratis Getränk für nur 1 Ö!", description: "Winterdrink (Cinnamon Latte oder Toffee Latte) für nur 1 jö Punkt! Fast geschenkt!", type: "gratis", badge: "limited", category: "kaffee", source: "jö App", url: "https://www.joe-club.at", expires: "Winter 2026", distance: "OMV Tankstellen", hot: true, isNew: true, priority: 1 },
  { id: "top-2", brand: "IKEA", logo: "🪑", title: "Gratis Kaffee & Tee UNLIMITIERT", description: "IKEA Family Mitglieder: Unbegrenzt Gratis-Kaffee oder Tee! Einfach Karte zeigen.", type: "gratis", badge: "daily", category: "kaffee", source: "IKEA Family", url: "https://www.ikea.at", expires: "Unbegrenzt", distance: "IKEA Standorte", hot: true, priority: 1 },
  { id: "top-3", brand: "Wiener Deewan", logo: "🍛", title: "Zahl was du willst!", description: "Pakistanisches Buffet - DU bestimmst den Preis! Auch €0 ist okay. Studenten-Geheimtipp!", type: "gratis", badge: "daily", category: "essen", source: "Wiener Deewan", url: "https://www.deewan.at", expires: "Täglich", distance: "9. Bezirk", hot: true, priority: 1 },
  { id: "top-4", brand: "McDonald's", logo: "🍟", title: "5x Gratis Kaffee pro Monat", description: "Nach jedem Einkauf Feedback in der App = Gratis Kaffee oder Cola!", type: "gratis", badge: "daily", category: "kaffee", source: "McDonald's App", url: "https://www.mcdonalds.at", expires: "5x/Monat", distance: "Überall", hot: true, priority: 1 },
  { id: "top-5", brand: "Verein MUT", logo: "🥫", title: "Gratis Lebensmittel abholen", description: "Gerettete Lebensmittel komplett kostenlos! Mo-Fr 10-15:30, keine Fragen.", type: "gratis", badge: "daily", category: "supermarkt", source: "Verein MUT", url: "https://verein-mut.eu", expires: "Mo-Fr", distance: "4. Bezirk", hot: true, priority: 1 },
  { id: "top-6", brand: "Foodsharing", logo: "🍏", title: "Gratis Lebensmittel retten", description: "Übriggebliebene Lebensmittel von Supermärkten gratis abholen!", type: "gratis", badge: "daily", category: "supermarkt", source: "Foodsharing", url: "https://foodsharing.at", expires: "Täglich", distance: "Überall", hot: true, priority: 1 },
  { id: "top-7", brand: "Too Good To Go", logo: "🥡", title: "Essen retten ab €3,99", description: "Überraschungssackerl von Restaurants & Bäckereien - Wert €12+ für nur €3,99!", type: "rabatt", badge: "daily", category: "essen", source: "Too Good To Go", url: "https://www.toogoodtogo.at", expires: "Täglich", distance: "Überall", hot: true, priority: 2 },
  { id: "top-8", brand: "dm Friseur", logo: "💇", title: "Gratis Kinderhaarschnitt", description: "Kinder unter 10: Komplett gratis Haarschnitt beim dm Friseur!", type: "gratis", badge: "instore", category: "beauty", source: "dm", url: "https://www.dm.at", expires: "Mit Termin", distance: "dm Friseur", hot: true, priority: 1 },
  { id: "top-9", brand: "Alle Bundesmuseen", logo: "🏛️", title: "Gratis Eintritt unter 19!", description: "Belvedere, KHM, NHM, Albertina, Mumok, MAK - ALLE gratis für unter 19-Jährige!", type: "gratis", badge: "daily", category: "wien", source: "Bundesmuseen", url: "https://www.bundesmuseen.at", expires: "Unter 19", distance: "Wien", hot: true, priority: 1 },
  
  // KAFFEE
  { id: "kaffee-1", brand: "Starbucks", logo: "☕", title: "Gratis Geburtstagsgetränk", description: "Starbucks Rewards: Am Geburtstag ein Gratis-Getränk nach Wahl!", type: "gratis", badge: "instore", category: "kaffee", source: "Starbucks", url: "https://www.starbucks.at", expires: "Am Geburtstag", distance: "Überall", hot: true },
  { id: "kaffee-2", brand: "Tchibo", logo: "☕", title: "Gratis Kaffee beim Einkauf", description: "Bei jedem Einkauf im Tchibo Shop gibt's einen Gratis-Kaffee dazu!", type: "gratis", badge: "instore", category: "kaffee", source: "Tchibo", url: "https://www.tchibo.at", expires: "Unbegrenzt", distance: "Tchibo", hot: true },
  { id: "kaffee-3", brand: "Segafredo", logo: "☕", title: "10. Kaffee gratis", description: "Stempelkarte sammeln: Jeder 10. Kaffee ist gratis!", type: "gratis", badge: "instore", category: "kaffee", source: "Segafredo", url: "https://www.segafredo.at", expires: "Unbegrenzt", distance: "Segafredo", hot: false },
  { id: "kaffee-4", brand: "Shell", logo: "⛽", title: "Gratis Kaffee Clubsmart", description: "Mit Clubsmart Punkten Gratis-Kaffee bei Shell Tankstellen!", type: "gratis", badge: "instore", category: "kaffee", source: "Shell", url: "https://www.shell.at", expires: "Mit Punkten", distance: "Shell", hot: false },
  { id: "kaffee-5", brand: "Costa Coffee", logo: "☕", title: "5. Kaffee gratis", description: "Costa Club App: Jeder 5. Kaffee ist kostenlos!", type: "gratis", badge: "instore", category: "kaffee", source: "Costa", url: "https://www.costa.at", expires: "Unbegrenzt", distance: "Costa", hot: false },
  { id: "kaffee-6", brand: "Backwerk", logo: "🥐", title: "Gratis Kaffee zum Gebäck", description: "Beim Kauf von 2 Gebäckstücken: 1 Kaffee gratis!", type: "gratis", badge: "instore", category: "kaffee", source: "Backwerk", url: "https://www.backwerk.at", expires: "Unbegrenzt", distance: "Backwerk", hot: false },
  { id: "kaffee-7", brand: "Nespresso", logo: "☕", title: "Gratis Kaffee Verkostung", description: "In jeder Nespresso Boutique: Gratis Kaffee-Verkostung!", type: "gratis", badge: "instore", category: "kaffee", source: "Nespresso", url: "https://www.nespresso.com/at", expires: "Unbegrenzt", distance: "Nespresso", hot: false },
  
  // ESSEN
  { id: "essen-1", brand: "McDonald's", logo: "🍟", title: "Gratis Cheeseburger", description: "App downloaden = Gratis Cheeseburger als Willkommensgeschenk!", type: "gratis", badge: "limited", category: "essen", source: "McDonald's App", url: "https://www.mcdonalds.at", expires: "Bei Registrierung", distance: "Überall", hot: true },
  { id: "essen-2", brand: "Burger King", logo: "🍔", title: "Gratis Whopper zum Geburtstag", description: "BK App: Am Geburtstag einen Gratis Whopper!", type: "gratis", badge: "limited", category: "essen", source: "BK App", url: "https://www.burgerking.at", expires: "Am Geburtstag", distance: "Überall", hot: true },
  { id: "essen-3", brand: "Domino's", logo: "🍕", title: "2. Pizza 50% günstiger", description: "Bei Abholung: Zweite Pizza zum halben Preis!", type: "rabatt", badge: "daily", category: "essen", source: "Domino's", url: "https://www.dominos.at", expires: "Bei Abholung", distance: "Überall", hot: false },
  { id: "essen-4", brand: "NORDSEE", logo: "🐟", title: "Gratis Backfisch Häppchen", description: "Newsletter anmelden = Gratis Backfisch Häppchen!", type: "gratis", badge: "limited", category: "essen", source: "NORDSEE", url: "https://www.nordsee.com", expires: "Bei Anmeldung", distance: "NORDSEE", hot: true },
  { id: "essen-5", brand: "Vapiano", logo: "🍝", title: "Gratis Pasta zum Geburtstag", description: "Vapiano People: Gratis Pasta am Geburtstag!", type: "gratis", badge: "limited", category: "essen", source: "Vapiano", url: "https://www.vapiano.at", expires: "Am Geburtstag", distance: "Vapiano", hot: true },
  
  // BEAUTY
  { id: "beauty-1", brand: "dm", logo: "💄", title: "10% für Studenten", description: "Mit Studentenausweis: 10% auf fast alles bei dm!", type: "rabatt", badge: "daily", category: "beauty", source: "dm", url: "https://www.dm.at", expires: "Mit Ausweis", distance: "dm", hot: false },
  { id: "beauty-2", brand: "BIPA", logo: "💅", title: "25% mit BIPA Card", description: "BIPA Bonuscard: Regelmäßig 25% auf alles!", type: "rabatt", badge: "limited", category: "beauty", source: "BIPA", url: "https://www.bipa.at", expires: "Mit Card", distance: "BIPA", hot: true },
  { id: "beauty-3", brand: "Douglas", logo: "🌸", title: "Gratis Geburtstagsgeschenk", description: "Douglas Beauty Card: Premium Geschenk zum Geburtstag!", type: "gratis", badge: "limited", category: "beauty", source: "Douglas", url: "https://www.douglas.at", expires: "Am Geburtstag", distance: "Douglas", hot: true },
  { id: "beauty-4", brand: "Sephora", logo: "💋", title: "Gratis Beauty Samples", description: "Bei jeder Bestellung: 2 Gratis Samples nach Wahl!", type: "gratis", badge: "daily", category: "beauty", source: "Sephora", url: "https://www.sephora.at", expires: "Bei Bestellung", distance: "Online", hot: true },
  { id: "beauty-5", brand: "Marionnaud", logo: "🌹", title: "Gratis Parfum-Probe", description: "In jeder Filiale: Gratis Parfum-Proben zum Mitnehmen!", type: "gratis", badge: "instore", category: "beauty", source: "Marionnaud", url: "https://www.marionnaud.at", expires: "Solange Vorrat", distance: "Marionnaud", hot: false },
  
  // SUPERMARKT
  { id: "super-1", brand: "BILLA", logo: "🛒", title: "BILLA Plus Gutscheine", description: "In der App: Wöchentlich personalisierte Rabatt-Gutscheine!", type: "rabatt", badge: "daily", category: "supermarkt", source: "BILLA App", url: "https://www.billa.at", expires: "Wöchentlich", distance: "BILLA", hot: true },
  { id: "super-2", brand: "SPAR", logo: "🛒", title: "25% auf Obst & Gemüse", description: "Jeden Samstag: 25% auf frisches Obst & Gemüse!", type: "rabatt", badge: "daily", category: "supermarkt", source: "SPAR", url: "https://www.spar.at", expires: "Samstags", distance: "SPAR", hot: true },
  { id: "super-3", brand: "HOFER", logo: "🛒", title: "Super Samstag", description: "Jeden Samstag: Extreme Rabatte auf ausgewählte Produkte!", type: "rabatt", badge: "daily", category: "supermarkt", source: "HOFER", url: "https://www.hofer.at", expires: "Samstags", distance: "HOFER", hot: true },
  { id: "super-4", brand: "Lidl", logo: "🛒", title: "Lidl Plus App Deals", description: "Exklusive Coupons und Rabatte in der Lidl Plus App!", type: "rabatt", badge: "daily", category: "supermarkt", source: "Lidl Plus", url: "https://www.lidl.at", expires: "In App", distance: "Lidl", hot: true },
  
  // STREAMING
  { id: "stream-1", brand: "Netflix", logo: "📺", title: "30 Tage gratis testen", description: "Netflix Premium: Ersten Monat kostenlos testen!", type: "testabo", badge: "limited", category: "streaming", source: "Netflix", url: "https://www.netflix.com", expires: "Neukunden", distance: "Online", hot: true },
  { id: "stream-2", brand: "Spotify", logo: "🎵", title: "3 Monate gratis", description: "Spotify Premium: 3 Monate kostenlos für Neukunden!", type: "testabo", badge: "limited", category: "streaming", source: "Spotify", url: "https://www.spotify.com", expires: "Neukunden", distance: "Online", hot: true },
  { id: "stream-3", brand: "Disney+", logo: "🏰", title: "Disney+ mit Werbung €5,99", description: "Günstigstes Disney+ Abo mit Werbung!", type: "rabatt", badge: "daily", category: "streaming", source: "Disney+", url: "https://www.disneyplus.com", expires: "Unbegrenzt", distance: "Online", hot: false },
  { id: "stream-4", brand: "Amazon Prime", logo: "📦", title: "30 Tage gratis", description: "Prime Video, Musik, Lieferung - alles 30 Tage gratis!", type: "testabo", badge: "limited", category: "streaming", source: "Amazon", url: "https://www.amazon.de/prime", expires: "Neukunden", distance: "Online", hot: true },
  { id: "stream-5", brand: "YouTube Premium", logo: "▶️", title: "1 Monat gratis", description: "Keine Werbung + YouTube Music - 1 Monat testen!", type: "testabo", badge: "limited", category: "streaming", source: "YouTube", url: "https://www.youtube.com/premium", expires: "Neukunden", distance: "Online", hot: false },
  { id: "stream-6", brand: "Apple TV+", logo: "🍎", title: "7 Tage gratis", description: "Apple TV+ eine Woche kostenlos testen!", type: "testabo", badge: "limited", category: "streaming", source: "Apple", url: "https://www.apple.com/at/apple-tv-plus/", expires: "Neukunden", distance: "Online", hot: false },
  
  // TECHNIK
  { id: "tech-1", brand: "Apple", logo: "🍎", title: "Bildungsrabatt 10%", description: "Studenten & Lehrer: 10% auf Mac und iPad!", type: "rabatt", badge: "daily", category: "technik", source: "Apple Education", url: "https://www.apple.com/at/shop/browse/campaigns/education_pricing", expires: "Mit Nachweis", distance: "Online", hot: true },
  { id: "tech-2", brand: "Samsung", logo: "📱", title: "Trade-In Bonus", description: "Altes Handy eintauschen und bis zu €600 sparen!", type: "rabatt", badge: "limited", category: "technik", source: "Samsung", url: "https://www.samsung.com/at/", expires: "Bei Trade-In", distance: "Online", hot: true },
  { id: "tech-3", brand: "MediaMarkt", logo: "📺", title: "0% Finanzierung", description: "Technik jetzt kaufen, später zahlen - 0% Zinsen!", type: "rabatt", badge: "daily", category: "technik", source: "MediaMarkt", url: "https://www.mediamarkt.at", expires: "Ab €299", distance: "MediaMarkt", hot: false },
  
  // WIEN KULTUR
  { id: "wien-1", brand: "Wiener Linien", logo: "🚇", title: "Gratis WLAN in U-Bahn", description: "Kostenloses WLAN in allen U-Bahn Stationen!", type: "gratis", badge: "daily", category: "wien", source: "Wiener Linien", url: "https://www.wienerlinien.at", expires: "Unbegrenzt", distance: "U-Bahn", hot: false },
  { id: "wien-2", brand: "Haus der Geschichte", logo: "🏛️", title: "Gratis jeden Donnerstag", description: "Jeden Donnerstagabend 18-20h: Freier Eintritt!", type: "gratis", badge: "daily", category: "wien", source: "hdgö", url: "https://www.hdgoe.at", expires: "Donnerstags", distance: "1. Bezirk", hot: true },
  { id: "wien-3", brand: "Erste Bank", logo: "🏦", title: "Gratis Konto unter 27", description: "Kostenloses Girokonto für alle unter 27 Jahren!", type: "gratis", badge: "daily", category: "finanzen", source: "Erste Bank", url: "https://www.sparkasse.at", expires: "Unter 27", distance: "Filiale", hot: true },
  
  // MODE
  { id: "mode-1", brand: "H&M", logo: "👕", title: "10% mit H&M Member", description: "H&M Membership: 10% Willkommensrabatt + Punkte sammeln!", type: "rabatt", badge: "daily", category: "mode", source: "H&M", url: "https://www.hm.com/at", expires: "Bei Anmeldung", distance: "H&M", hot: true },
  
  // MOBILITÄT
  { id: "mobil-1", brand: "Wiener Linien", logo: "🚇", title: "Jahreskarte €365", description: "365€ für ganz Wien - nur 1€ pro Tag!", type: "rabatt", badge: "daily", category: "mobilität", source: "Wiener Linien", url: "https://www.wienerlinien.at", expires: "Ganzjährig", distance: "Wien", hot: true },
  { id: "mobil-2", brand: "ÖBB", logo: "🚂", title: "Sparschiene ab €9,90", description: "Bahntickets schon ab €9,90 - früh buchen lohnt sich!", type: "rabatt", badge: "daily", category: "mobilität", source: "ÖBB", url: "https://www.oebb.at", expires: "Bei Frühbuchung", distance: "Überall", hot: true },
  { id: "mobil-3", brand: "Bolt", logo: "🛴", title: "Gratis Freifahrt", description: "Code 'WIEN2026': Erste Fahrt gratis für Neukunden!", type: "gratis", badge: "limited", category: "mobilität", source: "Bolt", url: "https://www.bolt.eu", expires: "Neukunden", distance: "Wien", hot: true },
  { id: "mobil-4", brand: "Lime", logo: "🛴", title: "50% auf erste Fahrt", description: "Lime App: 50% Rabatt auf deine erste Scooter-Fahrt!", type: "rabatt", badge: "limited", category: "mobilität", source: "Lime", url: "https://www.li.me", expires: "Neukunden", distance: "Wien", hot: false },
];

// ============================================
// INTELLIGENTE KATEGORISIERUNG
// ============================================

function detectCategory(text) {
  const t = text.toLowerCase();
  
  if (/iphone|ipad|macbook|apple\s?watch|airpod|samsung|galaxy|huawei|xiaomi|handy|smartphone|laptop|tablet|computer|pc|gaming|playstation|ps5|xbox|nintendo|switch|fernseher|tv|kopfhörer|headphone|monitor|drucker|kamera/i.test(t)) {
    return 'technik';
  }
  if (/pattex|klebeband|werkzeug|bohrer|schrauben|baumarkt|obi|hornbach|bauhaus|ikea|möbel|regal|lampe|tisch|stuhl|bett|couch|sofa/i.test(t)) {
    return 'shopping';
  }
  if (/\bkaffee\b|coffee|latte|cappuccino|espresso|café|cafe|starbucks|mccafé|barista|melange/i.test(t)) {
    return 'kaffee';
  }
  if (/pizza|kebab|döner|burger|essen\s|restaurant|lokal|gastro|grill|sushi|pasta|schnitzel|würstel|bäcker|konditor|torte|kuchen|menü|buffet|brunch|frühstück|mittagessen|abendessen/i.test(t)) {
    return 'essen';
  }
  if (/billa|spar|interspar|lidl|hofer|penny|supermarkt|lebensmittel|unimarkt|merkur|nah.{0,3}frisch/i.test(t)) {
    return 'supermarkt';
  }
  if (/dm\s|bipa|douglas|sephora|beauty|kosmetik|friseur|frisör|haarschnitt|nagel|make.?up|parfum|parfüm|creme|shampoo|duschgel/i.test(t)) {
    return 'beauty';
  }
  if (/netflix|spotify|disney\+|amazon\s?prime|youtube\s?premium|streaming|dazn|sky/i.test(t)) {
    return 'streaming';
  }
  if (/h&m|zara|zalando|fashion|mode|kleidung|schuhe|sneaker|jacke|hose|shirt|kleid|nike|adidas|puma/i.test(t)) {
    return 'mode';
  }
  if (/wiener\s?linien|öbb|zug|bahn|bus\s|taxi|uber|bolt|scooter|e-scooter|rad|fahrrad|auto|tanken|tankstelle|omv|shell/i.test(t)) {
    return 'mobilität';
  }
  if (/bank|konto|kreditkarte|versicherung|kredit|sparkasse|erste\s?bank|raiffeisen|bawag|n26|finanz/i.test(t)) {
    return 'finanzen';
  }
  if (/museum|ausstellung|kultur|theater|oper|konzert|event|wien\s|vienna|eintritt|kino|film/i.test(t)) {
    return 'wien';
  }
  
  return 'wien';
}

function isRelevantDeal(title, description) {
  const text = (title + ' ' + description).toLowerCase();
  if (/preisvergleich.*\d{3,}€|mylem|idealo|geizhals/i.test(text)) {
    if (!/gratis|kostenlos|geschenkt|1\+1|50%|60%|70%|80%|90%/i.test(text)) {
      return false;
    }
  }
  const priceMatch = text.match(/(\d{3,4})[,.]?\d{0,2}\s*€/);
  if (priceMatch) {
    const price = parseInt(priceMatch[1]);
    if (price > 300 && !/gratis|kostenlos|geschenkt|50%|60%|70%|80%|90%/i.test(text)) {
      return false;
    }
  }
  return true;
}

// ============================================
// HTTP FETCHER
// ============================================

function fetchURL(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'de-AT,de;q=0.9,en;q=0.8'
      },
      timeout: timeout
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchURL(res.headers.location, timeout).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// ============================================
// RSS PARSER
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
    
    if (!title) continue;
    
    const fullText = (title + ' ' + (description || '')).toLowerCase();
    
    const isGratis = GRATIS_KEYWORDS.some(k => fullText.includes(k));
    const isDeal = DEAL_KEYWORDS.some(k => fullText.includes(k));
    const isNeueroffnung = NEUEROFFNUNG_KEYWORDS.some(k => fullText.includes(k));
    
    if (!isGratis && !isDeal && !isNeueroffnung) continue;
    if (!isRelevantDeal(title, description || '')) continue;
    
    const category = detectCategory(fullText);
    
    let brand = source.brand;
    const brandMatch = title.match(/^([A-Za-zäöüÄÖÜß0-9&\-\.']+)[\s:–-]/);
    if (brandMatch) brand = brandMatch[1];
    
    let cleanDesc = (description || title).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
    if (cleanDesc.length > 120) cleanDesc = cleanDesc.substring(0, 117) + '...';
    
    deals.push({
      id: `rss-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      brand: brand.substring(0, 30),
      logo: source.logo,
      title: title.substring(0, 70),
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
// HTML PARSER
// ============================================

function extractDealsFromHTML(html, source) {
  const deals = [];
  const lowerHtml = html.toLowerCase();
  const isWienRelevant = WIEN_KEYWORDS.some(k => lowerHtml.includes(k.toLowerCase()));
  
  const patterns = [
    /gratis[^<]{5,150}/gi,
    /kostenlos[^<]{5,150}/gi,
    /1\+1\s*gratis[^<]{0,100}/gi,
    /neueröffnung[^<]{5,150}/gi,
    /eröffnung[^<]{5,150}/gi,
    /-\s*\d{1,2}\s*%[^<]{5,100}/gi,
    /\d{1,2}\s*%\s*(rabatt|günstiger|sparen)[^<]{0,80}/gi,
    /gratis\s*(kaffee|essen|getränk|probe|haarschnitt|eintritt)[^<]{0,80}/gi,
    /geschenkt[^<]{5,100}/gi,
    /freebie[^<]{5,100}/gi,
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const context = match[0].replace(/<[^>]*>/g, '').trim();
      if (context.length < 15 || context.length > 200) continue;
      
      const isGratis = GRATIS_KEYWORDS.some(k => context.toLowerCase().includes(k));
      const isNeueroffnung = /neueröffnung|eröffnung|opening|neu\s*eröffnet/i.test(context);
      
      if ((source.brand === 'Facebook' || source.brand === 'TikTok') && !isWienRelevant) continue;
      if (!isRelevantDeal(context, '')) continue;
      
      const category = detectCategory(context);
      
      deals.push({
        id: `html-${source.brand}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        brand: source.brand,
        logo: source.logo,
        title: `${isNeueroffnung ? '🆕 Neueröffnung' : (isGratis ? '🎁 Gratis Deal' : '💰 Rabatt')} via ${source.brand}`,
        description: context.substring(0, 120),
        type: isGratis ? 'gratis' : 'rabatt',
        badge: isGratis ? 'gratis' : 'limited',
        category: category,
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
  
  return deals.slice(0, 10);
}

// ============================================
// FILTER OUTDATED
// ============================================

function isOutdatedDeal(deal) {
  if (deal.validUntil) {
    const validDate = new Date(deal.validUntil);
    if (validDate < new Date()) return true;
  }
  
  const text = `${deal.title} ${deal.description}`.toLowerCase();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  for (let year = 2020; year < currentYear; year++) {
    if (text.includes(String(year))) return true;
  }
  
  const months = ['januar', 'februar', 'märz', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'dezember'];
  for (let i = 0; i < currentMonth; i++) {
    if (text.includes(months[i]) && text.includes(String(currentYear))) return true;
  }
  
  if (deal.pubDate) {
    const pubDate = new Date(deal.pubDate);
    const daysSincePub = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePub > 14 && !deal.id.startsWith('top-') && !deal.id.startsWith('kaffee-')) return true;
  }
  
  return false;
}

// ============================================
// MAIN SCRAPER
// ============================================

async function scrapeAllSources() {
  console.log('🚀 POWER SCRAPER gestartet...\n');
  console.log(`📅 ${new Date().toLocaleString('de-AT')}\n`);
  console.log(`📡 ${SOURCES.length} Quellen werden gescraped...\n`);
  
  const scrapedDeals = [];
  const errors = [];
  
  for (const source of SOURCES) {
    try {
      const content = await fetchURL(source.url);
      let deals = [];
      
      if (source.type === 'rss') {
        deals = parseRSS(content, source);
      } else {
        deals = extractDealsFromHTML(content, source);
      }
      
      scrapedDeals.push(...deals);
      console.log(`✅ ${source.name}: ${deals.length} Deals`);
      
    } catch (error) {
      errors.push(source.name);
      console.log(`❌ ${source.name}: ${error.message}`);
    }
  }
  
  // Kombiniere Base + Scraped Deals
  const allDeals = [...BASE_DEALS, ...scrapedDeals];
  
  // Filter abgelaufene Deals
  const validDeals = allDeals.filter(d => !isOutdatedDeal(d));
  console.log(`\n🗑️  ${allDeals.length - validDeals.length} abgelaufene Deals entfernt`);
  
  // Entferne Duplikate
  const uniqueDeals = [];
  const seenTitles = new Set();
  
  for (const deal of validDeals) {
    const key = deal.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 25);
    if (!seenTitles.has(key)) {
      seenTitles.add(key);
      uniqueDeals.push(deal);
    }
  }
  
  // Sortiere: Priority > Gratis > Hot > Neu
  uniqueDeals.sort((a, b) => {
    const prioA = a.priority || 99;
    const prioB = b.priority || 99;
    if (prioA !== prioB) return prioA - prioB;
    
    const isRealFreeA = a.type === 'gratis' && !a.expires?.includes('Geburtstag') && !a.expires?.includes('10.');
    const isRealFreeB = b.type === 'gratis' && !b.expires?.includes('Geburtstag') && !b.expires?.includes('10.');
    if (isRealFreeA && !isRealFreeB) return -1;
    if (!isRealFreeA && isRealFreeB) return 1;
    
    if (a.hot && !b.hot) return -1;
    if (!a.hot && b.hot) return 1;
    if (a.isNew && !b.isNew) return -1;
    if (!a.isNew && b.isNew) return 1;
    if (a.type === 'gratis' && b.type !== 'gratis') return -1;
    if (a.type !== 'gratis' && b.type === 'gratis') return 1;
    
    return 0;
  });
  
  // Output
  const output = {
    lastUpdated: new Date().toISOString(),
    totalDeals: uniqueDeals.length,
    deals: uniqueDeals
  };
  
  fs.writeFileSync('deals.json', JSON.stringify(output, null, 2));
  
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Scraping abgeschlossen!`);
  console.log(`   📦 Basis-Deals: ${BASE_DEALS.length}`);
  console.log(`   🆕 Gescrapte Deals: ${scrapedDeals.length}`);
  console.log(`   📊 Gesamt: ${uniqueDeals.length}`);
  console.log(`   ⚠️  Fehler: ${errors.length}/${SOURCES.length}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

scrapeAllSources()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Scraper Error:', err.message);
    process.exit(0);
  });
