# 🎁 FreeFinder Wien

**Die beste App für Gratis-Deals, Freebies & Rabatte in Wien!**

Live: [ataalla24-ux.github.io/deal-finder](https://ataalla24-ux.github.io/deal-finder/)

---

## ✨ Features

- 🔄 **Automatisch aktualisiert** alle 30 Minuten
- 📡 **130+ Quellen** werden gescraped
- 🔥 **Firecrawl Integration** für Premium-Seiten
- 📱 **PWA** - Als App installierbar
- 🔍 **Suche & Filter** nach Kategorie

---

## 🚀 Schnellstart

### 1. Repository erstellen

1. Geh zu [github.com/new](https://github.com/new)
2. Name: `deal-finder`
3. ✅ Public
4. Klick **Create repository**

### 2. Dateien hochladen

1. Klick **uploading an existing file**
2. Ziehe ALLE Dateien aus diesem ZIP rein
3. Klick **Commit changes**

### 3. GitHub Pages aktivieren

1. **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** / **/(root)**
4. Klick **Save**

### 4. Firecrawl API Key hinzufügen

1. **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**
3. Name: `FIRECRAWL_API_KEY`
4. Value: *dein API Key von firecrawl.dev*

---

## 📁 Dateistruktur

```
deal-finder/
├── docs/                    # Website (GitHub Pages)
│   ├── index.html          # Hauptseite
│   ├── deals.json          # Deal-Daten
│   ├── manifest.json       # PWA Manifest
│   ├── sw.js               # Service Worker
│   └── icon-192.svg        # App Icon
├── scraper/
│   ├── power-scraper.js    # Haupt-Scraper (130 Quellen)
│   └── firecrawl-scraper.js # Premium-Scraper (14 Seiten)
├── .github/workflows/
│   ├── scrape.yml          # Läuft alle 30 Min
│   └── firecrawl.yml       # Läuft 1x täglich
├── package.json
└── README.md
```

---

## ⏱️ Automatische Updates

| Workflow | Intervall | Credits |
|----------|-----------|---------|
| Mega Scraper | Alle 30 Min | Kostenlos |
| Firecrawl | 1x täglich (7:00) | ~14/Tag |

---

## 🔥 Firecrawl Premium-Seiten

Diese Seiten werden mit Firecrawl gescraped:

| Seite | Kategorie |
|-------|-----------|
| BILLA | Supermarkt |
| SPAR | Supermarkt |
| INTERSPAR | Supermarkt |
| MediaMarkt | Technik |
| Saturn | Technik |
| Douglas | Beauty |
| BIPA | Beauty |
| Müller | Beauty |
| H&M | Mode |
| Zalando | Mode |
| Dominos | Essen |
| Subway | Essen |
| Notino | Beauty |
| Cyberport | Technik |

**Credits:** 14/Tag × 30 = 420/Monat (Limit: 500)

---

## 📊 Kategorien

- 🍔 Essen
- ☕ Kaffee
- 🛒 Supermarkt
- 💇 Beauty
- 🏛️ Wien (Kultur)
- 📱 Technik
- 🛍️ Shopping
- 📺 Streaming
- 🚌 Mobilität
- 💳 Finanzen
- 👕 Mode

---

## 🛠️ Manuell testen

```bash
# Scraper lokal ausführen
node scraper/power-scraper.js

# Firecrawl testen (API Key nötig)
FIRECRAWL_API_KEY=fc-xxx node scraper/firecrawl-scraper.js
```

---

## 📱 Als App installieren

1. Öffne die Website auf dem Handy
2. **Teilen** → **Zum Home-Bildschirm**
3. Fertig! 🎉

---

## 🤝 Beitragen

Pull Requests willkommen! Besonders:
- Neue Deal-Quellen
- Bug Fixes
- UI Verbesserungen

---

## 📜 Lizenz

MIT License

---

Made with ❤️ in Wien
