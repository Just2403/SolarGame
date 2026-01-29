# 🌞 SolarGame - Erneuerbare Energien Simulator

Ein interaktives Browser-Spiel, in dem du eine nachhaltige Energiewirtschaft aufbaust und verwaltest. Baue Solaranlagen, Windkraftanlagen und Felder, um Energie und Weizen zu produzieren und damit Gewinne zu erzielen!

---

## 📁 Projektstruktur

```
SolarGame/
├── solar.html          # Haupt-HTML Datei - Startet das Spiel
├── solarcss.css        # Stylesheet für UI und Spieldesign
├── solarjs.js          # Spiel-Logik und Spielmechaniken
├── README.md           # Diese Datei
└── test.html, test2.html # Testdateien
```

### Datei-Beschreibungen:

- **solar.html** - Die Haupt-Spieldatei mit kompletter UI
  - Game-Container mit Farm-Bereich und UI-Panel
  - Gebäude-Übersicht und Upgrade-System
  - Verkaufs- und Finanzierungssystem
  - Achievements und Statistiken

- **solarcss.css** - Umfassendes Stylesheet
  - Responsive Design für Farm-Bereich und UI-Panel
  - Animationen für Tageszyklen und Wetter
  - Gebäude-Designs (Solar, Wind, Felder, Batterien, etc.)
  - UI-Komponenten und Progress-Bars

- **solarjs.js** - Kernspiellogik (~1500 Zeilen)
  - Spielzustand-Management
  - Energie-Produktions- und Verbrauchsystem
  - Tageszyklen und Wetterereignisse
  - Feld-Wachstum und Erntesystem
  - Drag & Drop für Gebäude-Platzierung
  - Kreditvergabe und Wartungssystem
  - Achievements und Statistiken
  - LocalStorage für Spielstand-Speicherung

---

## 🎮 Spiel-Inhalte

### Gebäude & Ressourcen

#### Energie-Produktion
- **PV-Anlage** (500€) - Produziert Solarenergie (Tag/Dämmerung/Dämmerung)
- **Windkraftanlage** (600€) - Produziert Windenergie (besonders nachts)
- **Batteriespeicher** (10€) - Speichert überschüssige Energie
- **Silo** (400€) - Lagert geernteten Weizen
- **Wasserturm** (500€) - Bonus für Silo-Kapazität

#### Zusätzliche Gebäude
- **Stall** (300€) - Erzeugt passives Einkommen
- **Feld** (200€) - Produziert Weizen, der geerntet und verkauft werden kann
- **Wasserpumpe** (250€) - Beschleunigt Feld-Wachstum
- **Werkstatt** (800€) - Generiert passives Einkommen basierend auf Anzahl der Gebäude

### Ressourcen-Management
- **Geld** - Hauptwährung zum Bauen und Upgraden
- **Energie** - Wird produziert (Tag) und verbraucht (Verbraucher)
- **Weizen** - Wächst auf Feldern, kann geerntet und verkauft werden
- **Kredite** - Optional: 1000€ mit 5% Zinsen über 7 Tage

### Spiel-Mechaniken

#### Tageszyklen (2 Minuten = 1 Spieltag)
- **Nacht** (00:00 - 06:00) - Keine Solarenergie, mehr Windkraft
- **Dämmerung** (06:00 - 08:00) - Halbe Solarleistung
- **Tag** (08:00 - 20:00) - Volle Solarleistung
- **Dämmerung** (20:00 - 22:00) - Halbe Solarleistung

#### Jahreszeiten (alle 30 Tage)
- **Frühling**: +Solarenergie, +Wachstum
- **Sommer**: Maximale Solarenergie
- **Herbst**: -Solarenergie, +Wind
- **Winter**: Minimale Solarenergie, maximale Windenergie

#### Wetterereignisse (20% Chance pro Tag)
- **Sonnig** - Normale Bedingungen
- **Bewölkt** - Reduzierte Solarleistung
- **Windig** - Erhöhte Windkraftleistung

### Upgrades
Alle Gebäude mit Upgrade-Potenzial können auf Stufe 1-3 aufgewertet werden:
- **Solar & Wind**: Höhere Stromproduktion
- **Batterien**: Größere Speicherkapazität, bessere Effizienz
- **Silos**: Mehr Lagerplatz für Weizen

### Dynamische Marktpreise
- **Energiepreis** - Abhängig von Angebot und Nachfrage (0,50€ - 2,00€)
- **Weizenpreis** - Basierend auf verfügbarer Menge (0,30€ - 0,80€)

### Zusätzliche Features
- **Wartungssystem** - Gebäude benötigen periodische Wartung
- **Achievements** - 6 freischaltbare Erfolge
- **Statistiken** - Track: Gesamtgewinn, Gesamtenergie, Tag
- **Autoaufkauf** - Automatisches Kaufen von Energie bei Bedarf
- **Spielstand-Speicherung** - LocalStorage für Fortschritt

---

## 🚀 Wie man spielt

### Installation & Start
1. Lade alle Dateien in einen Ordner
2. Öffne `solar.html` in einem modernen Browser (Chrome, Firefox, Edge)
3. Das Spiel startet automatisch mit einem Tutorial

### Grundlagen
1. **Bauen**: Wähle ein Gebäude aus dem Menü (rechts)
2. **Platzieren**: Bewege die Maus über die Farm, klicke zum Bauen
3. **Verdienen**: 
   - Verkaufe überschüssige Energie
   - Ernte Weizen und verkaufe ihn
   - Bauernhof-Gebäude erzeugen passives Einkommen

### Tipps zum Gewinnen
- **Früh bauen**: Starte mit 1-2 Solaranlagen
- **Speichern nicht vergessen**: Batterien sind wichtig für Nacht-Produktion
- **Diversifizieren**: Mix aus Solar, Wind und Speicher
- **Felder nutzen**: Weizen-Verkauf ist zusätzliches Einkommen
- **Upgrades**: Höhere Levelstufen sind profitabler
- **Wartung**: Vorbeugen ist besser als Reparatur
- **Kredite nutzen**: Bei Bedarf für schnelleres Wachstum

### Ziele
- Erreiche ein hohes Nettovermögen
- Schalte alle 6 Achievements frei
- Baue die perfekte Energiefarm auf
- Maximiere deine täglichen Einkünfte

---

## 🎯 Features

✅ Realistische Energie-Simulation  
✅ Dynamisches Wetter- und Jahreszeiten-System  
✅ Tages- und Nachtzyklen mit visuellen Effekten  
✅ Drag & Drop für einfache Gebäude-Verwaltung  
✅ Upgrade-System für Leistungssteigerung  
✅ Marktpreise basierend auf Angebot/Nachfrage  
✅ Passives Einkommen  
✅ Kreditvergabe mit Zinsen  
✅ Wartungs-Management  
✅ Achievement-System  
✅ Vollständige Spielstand-Speicherung  
✅ Responsive Design  

---

## 💻 Technologie

- **HTML5** - Struktur und DOM
- **CSS3** - Styling, Animationen, Flexbox
- **Vanilla JavaScript** - Spiel-Engine ohne externe Libraries
- **LocalStorage** - Persistente Spielstand-Speicherung

---

## 📊 Spielbalancing

Das Spiel ist so balanciert, dass:
- Early-Game: Solaranlagen sind der beste Einstieg
- Mid-Game: Diversifizierung wird wichtig
- Late-Game: Optimierung und Upgrades sind der Fokus
- Credible Challenge: Kredite und Wartung halten das Spiel interessant

---

## 🐛 Bekannte Einschränkungen

- Optimiert für Desktop-Browser
- Mobile Unterstützung vorhanden aber nicht vollständig getestet
- Maximale Gebäude-Performance bei ~50 Objekten

---

## 📝 Lizenzen & Credits

Ein Projekt für nachhaltige Energieerzeugung-Simulation.  
Entwickelt mit HTML5, CSS3 und Vanilla JavaScript.

---

**Viel Spaß beim Spielen! 🌱⚡**
