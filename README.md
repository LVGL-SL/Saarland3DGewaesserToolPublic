# Gewässertool
Das Gewässertool ist ein Prototyp-Plugin für VCMap 4.2 (WEGA 3D). Dieses Projekt wurde im Rahmen einer Bachelorarbeit beim LVGL entwickelt und diente primär der Untersuchung, wie Gewässerdaten interaktiv visualisiert werden können. Es handelt sich um keine fertige Software. Durch diesen Prototyp konnten mögliche Nutzergruppen und ihre Bedürfnisse ermittelt, sowie ein mögliches Bedienkonzept ausgetestet werden.

## Installation

> **Für die Ausführung dieses Projekts wird VCMap 4.2 benötigt, dies ist nicht im Projekt enthalten!**

### Frontend
Im Frontend-Ordner ist zunächst `npm install` auszuführen. In der Datei `pages.json` muss der Pfad zur VCMap 4.2 gesetzt werden. Folglich muss PATH entsprechend angepasst werden:
```json
"serve": "vcmplugin serve --vcm PATH -e ./build/index.js"
```
Für eine korrekte Darstellung wird ein Geländemodell benötigt.

### Backend
Im Backend-Ordner `./backend` ist ebenfalls `npm install` auszuführen. Zudem werden im Backend zusätzliche Daten benötigt. Im DGM-Ordner `./backend/data/DGM` wird ein Unterordner mit GeoTiff-Dateien eines digitalen Geländemodells benötigt. Im BDLM-Ordner `./backend/data/BDLM` muss ein Unterordner erstellt werden, welcher die XML-Dateien eines Basis-DLM Version 7.1 enthält. Nachdem die Daten beigefügt wurden, muss der Pfad in der `.env`-Datei gesetzt werden. 

Vor dem ersten Start muss die Software muss der Datenbestand aufbereiten werden. Daher muss im Backend-Ordner `npm run init` ausgeführt werden. Dieser Vorgang kann einige Zeit in Anspruch nehmen.

## Daten
Für den Betrieb dieses Projekts wird eine VCMap 4.2-Instanz mit einem Geländemodell benötigt. Für eine optimale Darstellung empfiehlt sich die Verwendung von DGM 1. Dabei sollten im Backend und Frontend dasselbe DGM verwendet werden. Die entsprechenden DGM- und Basis-DLM-Daten sind deutschlandweit verfügbar. Die Daten vom Saarland stehen im [Geoshop Saarland - Open Data](https://www.shop.lvgl.saarland.de/index.php?option=com_content&view=article&id=18) öffentlich zur Verfügung.

Zur Erstellung des Landschaftsmodells für das Frontend kann das Tool [`cesium-terrain-builder`](https://github.com/geo-data/cesium-terrain-builder) verwendet werden.

## Start
Backend und Frontend werden jeweils separat mit `npm run start` gestartet. Für Live-Updates kann alternativ `npm run dev` verwendet werden, in folge starten sich die Server bei Änungen im Code automatich neu. 