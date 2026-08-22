# Essenzielle Komplexität – 10-Min-Präsentation (Deutsch)

**Kontext:** 10 Minuten, freies Thema, **Deutsch**. Fokus liegt auf **Kommunikation und Struktur**,
nicht auf Fachtiefe.

**Deck:** `presentation-essential-complexity.html` (dunkles Theme). Steuerung: **← →** blättern · **N** Sprecher-Notizen ·
**L** Sprache (DE/EN) · **F** Vollbild. Zweisprachig – DE ist Standard, `L` schaltet Slides *und* Notizen
auf Englisch (Comic-Captions sind ohnehin Englisch). Standardmässig auf DE präsentieren.

**Thema:** *Essenzielle Komplexität erfassen – der Anspruch bleibt, der Weg wird mit KI einfacher.*

**Kern-These (der rote Faden):** Ein gutes Modell beschreibt ein Problem in seiner **essenziellen
Komplexität** – nicht mehr. Dieser Anspruch ist konstant. Was sich ändert, sind die **Kosten**: Früher
brauchte man UML, SysML oder eine eigene DSL, um diese Präzision zu erreichen. Heute versteht KI
natürliche Sprache – mit dem richtigen **Meta-Modell** beschreibt man die Fakten als **Markdown** und
erreicht dieselbe Präzision mit viel weniger Reibung. Und dieselbe Struktur macht KI erst kompetent.

**Konkretes Beispiel (Beweis):** das **Mental Model**, das Robert bei LIKE MAGIC gebaut hat
(Fakten als Markdown, strukturiert durch ein Meta-Modell).

**Grundhaltung (wichtig für die CTO→hands-on-Frage):** als *Builder* erzählen, nicht als „Visionär".
Eine Überzeugung, nach der ich handle und um die herum ich immer noch designe – bodenständig, konkret.
Der UML/SysML/DSL-Punkt zeigt zugleich: ich habe das jahrelang „von Hand" gemacht (Glaubwürdigkeit).

**Kein Namedropping** (Robert kennt den Autor der Vorlage persönlich, gleiches Denken – nicht nötig).

---

## Sprecher-Notizen pro Slide (≈9:35, Deck-Taste **N**)

> Basis = die Notizen im Deck (`data-notes`). **Fett = was ich spreche**,
> *kursiv = Regie/Instruktion an mich selbst*. „…" = wörtliche Sätze (Öffnung/Pointe auswendig).

### 00 · Titel – Der rote Faden von Robert Blust
*Der Titel liegt an, während ich begrüsse und mich kurz vorstelle. Ich nenne meinen Namen und das Thema, dann gehe ich mit → zur ersten Folie.*

### 01 · Mein roter Faden  (1:00)
*Persönlicher Einstieg – wer ich bin, mein roter Faden.* **Drei Bereiche prägen meine Laufbahn: Softwareentwicklung, Methodik und IT-/Enterprise-Architektur; mal lag mein Fokus mehr auf dem einen, mal auf dem anderen – so kenne ich alle drei. Mein Ziel ist immer die durchgängige Spur: von der Business-Architektur bis zur Entwicklung, mit voller Traceability.** *Diese Spannung lasse ich offen – das Ziel war lange teuer und schwer zu erreichen. Die Auflösung (UML/SysML/DSL nötig, Code ≠ Realität → mit KI möglich) spare ich mir bewusst für Slide 3/7/8 auf. Hier verrate ich die Pointe noch NICHT.*

### 02 · Der Anspruch  (1:10)  ← intellektueller Kern
*Mein eigentlicher Anspruch – der Kern des Vortrags.* **„Ein gutes Modell beschreibt ein Problem in seiner essenziellen Komplexität – nicht mehr, nicht weniger." Das Wesentliche erfassen, das Unwichtige weglassen – das ist die eigentliche Kunst.** *Persönlich betonen:* **Das ist mein Anspruch an jedes Modell, seit rund 15 Jahren.**

### 03 · Früher schwer – heute einfacher  (1:35)  ← der Dreh- und Angelpunkt
*Mein Dreh- und Angelpunkt.* **Früher war es schwer, ein Problem in essenzieller Komplexität zu beschreiben – man brauchte UML, SysML oder eine eigene DSL. Mächtig, aber schwer, spezialisiert, teuer.** *Ich betone, dass ich das real gemacht habe – kanonische Datenmodelle bei der UBS, eigene DSLs bei 3AP und LIKE MAGIC.* **Heute: KI versteht natürliche Sprache. Mit dem richtigen Meta-Modell beschreibe ich die Fakten als Markdown – und erreiche dieselbe Präzision mit viel weniger Reibung.** *Kurze Pause vor „dieselbe Klarheit, weniger Reibung".*

### 04 · Mein Ansatz  (0:45)  ← Breite zeigen, kurz
*Überblick – ich zeige die Breite, ohne zu dozieren.* **„Genau das habe ich bei LIKE MAGIC gebaut: unser Geschäftswissen als lebende Wissensbasis – die Fakten als Markdown, strukturiert durch ein Meta-Modell."** *Ich benenne die vier Bereiche kurz* **(Domänen und Begriffe · Rollen/Teams/Prozesse · Architektur-Entscheide und Regeln · KPIs)** *und betone: versioniert wie Code, maschinenlesbar, EINE Quelle der Wahrheit. Kurz halten – das konkrete Beispiel kommt gleich.*

### 05 · Ein Beispiel – Domäne Finance  (1:15)  ← Herzstück, konkret
*Ich mache es konkret* **– ein echtes Modell aus einem meiner Projekte: die Domäne Finance.** *Ich lese nicht alle Begriffe vor – ich greife EINEN heraus:* **Folio – das Finanzkonto einer Reservation, hängt an Debitor, sammelt OrderItems und Payments, mündet in eine PdfInvoice.** *Meine Pointe:* **jeder Begriff auf einen Satz gebracht – nicht mehr, nicht weniger.** *Payment/Debitor/Invoice sprechen das Payment-Publikum direkt an.*

### 06 · Der Nutzen  (1:10)  ← das überzeugt Entwickler
*Der eigentliche Nutzen – das überzeugt Entwickler.* **Weil es EINE Referenz gibt, lassen sich die Bereiche gegeneinander validieren: Requirements verwenden nur Begriffe aus dem Glossar – eine Sprache, keine Synonyme. Die Implementierung prüfe ich gegen Glossar UND Architektur-Entscheide (ADRs). Und: neue Begriffe müssen erst ins Glossar, sonst kein Merge – so bleibt die Sprache sauber.** *Mein Kernsatz:* **Widersprüche fallen auf, weil es eine Referenz gibt – Konsistenz über den ganzen Lebenszyklus.** *Überleitung: genau diese Prüfung kann heute die KI übernehmen.*

### 07 · Warum es jetzt zählt  (1:00)  ← EIN Punkt
*Meine Pointe – kurze Pause davor. EIN Punkt, klar:* **„Ein Modell wie dieses gibt der KI den richtigen Kontext – es verkleinert den Raum, in dem sie raten muss."** *Wichtig: nicht „ohne Halluzinationen" behaupten – Kontext reduziert das Raten, eliminiert es nicht.* **Je sauberer die Struktur, desto besser der Kontext. In der Praxis nutze ich das Mental Model als Kontextschicht für KI-Assistenten.** *Meine These:* **Nicht die KI ersetzt die Fachleute – sie macht ihr explizites Wissen wertvoller denn je.** *Optional, nur auf Nachfrage: derselbe Effekt via RAG (der KI die relevanten Fakten mitgeben). Auto-Validierung spreche ich hier NICHT an – die gehört auf Slide 6.*

### 08 · Wohin es geht – Spec-Driven Development  (0:45)  ← Zoom-out auf die Branche
*Ich zoome auf die Branche raus.* **Jahrelang galt Vormodellieren als zu teuer und zu langsam – Agile verzichtete bewusst darauf. Mit KI ist das Erfassen von Spezifikationen schnell und bezahlbar geworden. Also dreht das Pendel zurück: Spec-Driven Development wird wieder machbar.** *Kurz und selbstbewusst:* **Was ich seit 15 Jahren mache, wird gerade zur Industrierichtung.**

### 09 · Takeaway  (0:55)
*Mein Takeaway.* **„Der Anspruch bleibt derselbe wie vor 15 Jahren – die essenzielle Komplexität erfassen, nicht mehr. Neu ist: der Weg dorthin steht heute allen offen, und das Ergebnis zahlt doppelt – für Menschen und für KI."** *Bodenständiger Schluss:* **„Deshalb baue ich bis heute so – nah am Code, aber mit dem Modell im Kopf. Danke."** *Optional: Gerne zeige ich das Mental Model gleich im Detail.*

**---**

## Timing-Check
| # | Slide | Zeit |
|---|---|---|
| 1 | Haken – mein roter Faden (persönlich) | 1:00 |
| 2 | Anspruch – essenzielle Komplexität | 1:10 |
| 3 | Früher schwer → heute einfacher (UML/SysML/DSL → KI + Markdown) | 1:35 |
| 4 | Mein Ansatz – Mental Model, Breite (2×2) | 0:45 |
| 5 | Beispiel Finance – Diagramm + Glossar | 1:15 |
| 6 | Der Nutzen – Validierung gegen ein Modell | 1:10 |
| 7 | Warum JETZT – KI-Pointe (EIN Punkt: Modell = ehrlicher Kontext) | 1:00 |
| 8 | Wohin es geht – Spec-Driven Development | 0:45 |
| 9 | Takeaway | 0:55 |
| – | **Summe** | **~9:35** |

> 9 Slides sind am Limit für 10 Min. Beim Proben Zeit stoppen. Wenn's knapp wird: Slide 8
> (Spec-Driven) in einem Satz sagen und direkt zum Takeaway – oder Slide 4 (Breite) sehr kurz halten.

## Delivery-Tipps (darauf achten sie)
- **Eine Idee pro Slide, kaum Text.** Bilder/Struktur statt Bulletlisten. Du erzählst, die Folie stützt.
- **Öffnungssatz und Pointe auswendig** – der Rest frei. So wirkst du sicher, nicht abgelesen.
- **Pausen setzen**, besonders vor dem Slide-3-Verdict und der KI-Pointe (Slide 7). Stille macht den Punkt.
- **Fachjargon sparsam:** „Mental Model" einmal klar als benanntes Artefakt einführen (Slide 4); „RAG" nur
  als optionaler Nebensatz auf Nachfrage; „Traceability / Spec-Driven" sind im CH-Enterprise-Umfeld ok.
- **Konkret bleiben** – ein durchgehendes Beispiel (Mental Model), nicht drei. Das ist der häufigste
  Fehler bei diesem Thema: zu abstrakt.
- **Tempo:** 10 Minuten sind kurz. Lieber 5 klare Slides ruhig als 8 gehetzt. Einmal laut proben und Zeit stoppen.
- **Haltung:** Begeisterung zeigen (das ist deine Stärke hier), aber als Macher, nicht als Theoretiker.

## Wenn Nachfragen kommen (Q&A-Munition)
- „Ist das nicht nur Doku?" → Nein: versioniert wie Code, maschinenlesbar, eine Quelle der Wahrheit,
  aktiv als KI-Kontext genutzt – Doku verstaubt, das hier wird benutzt.
- „Aufwand vs. Nutzen?" → Inkrementell entstanden, entlang echter Arbeit; zahlt bei Onboarding,
  Entscheidungen und jetzt KI-Qualität zurück.
- „Bezug zu Payments / regulierten Domänen?" → Regulierte Domänen leben von präziser Fachsprache (kanonische Datenmodelle,
  Business-Glossare) – genau da ist explizites Wissen Gold wert.
