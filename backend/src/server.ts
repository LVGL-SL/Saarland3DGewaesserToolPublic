import express from 'express';
import expressWebsockets from 'express-ws'
import cors from 'cors';
import dotenv from "dotenv";
import path from 'path';
import fs from 'fs';
import { getHeightofPosition, getHeightprofile, getLowestPointOnProfile } from './helper/HieghtprofileHelper';
import * as gdal from 'gdal-async';
import { ladeTestXmlAusBasisDLM, findObjectByKey } from './helper/xmltoobjekt';
import { initializeDatabase } from './database/hanlder';
import AppDataSource from './database/databasedfintion';
import WaterVertex from './database/objects/Watervertex';
import { Between } from 'typeorm';
import WaterPath from './database/objects/Waterpath';
import AXGewaesserachse from './database/objects/AX_Gewaesserachse';
import AXWasserlauf from './database/objects/AX_Wasserlauf';



dotenv.config()

// Create Express app
const app = express();
const PORT = process.env.PORT || 8082;
const ALLOWDORIGINS = JSON.parse(process.env.CORS_ALLOW ?? "[]")
console.log(ALLOWDORIGINS, process.env.CORS_ALLOW)

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    console.log("request from: ", origin)
    if (!origin || ALLOWDORIGINS.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error("CORS LOCKED"))
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: true
}));
app.use(express.json());

// Basic routes
app.get('/', (req, res) => {
  console.log('Root endpoint accessed');
  res.status(404).sendFile('./index.html', { root: __dirname });
});


// DGM (Digital Elevation Model) data endpoint (POST, expects JSON body)
app.post('/api/dgm', async (req, res) => {
  const { start, end } = req.body;



  if (start && end &&
    typeof start.lat === "number" &&
    typeof start.long === "number" &&
    typeof start.alt === "number" &&
    typeof end.lat === "number" &&
    typeof end.long === "number" &&
    typeof end.alt === "number"
  ){
    try {
      const A = { x: start.lat, y: start.long, z:  start.alt }
      const B = { x: end.lat, y: end.long, z: 0 }

      const maxdistance = 1000;
      const band = 1;
      if (vrtDataset) {
        const v = await getLowestPointOnProfile("data/DGM/mosaic.vrt", A, B, 5, band);
        const vwgs = { lat: v.x, long: v.y, alt: v.z ?? 0 }
        const heightProfile = await getHeightprofile("data/DGM/mosaic.vrt", v, B, maxdistance, band);
        const wgs = heightProfile.map((v) => { return { lat: v.x, long: v.y, alt: v.z ?? 0 } })
        
        res.json({ data: wgs,start: vwgs}); // Remove spread operator
        return;
      }

      console.log('VRT dataset not available');
      res.status(503).json({ error: "VRT dataset not available" });
    } catch (err: any) {
      console.error('DGM endpoint error:', err);
      res.status(400).json({ error: "Invalid 'start' or 'end' parameter", details: err.message });
    }
  }
  else {
    console.log('Missing start or end parameters');
    console.log(start , end ,
    typeof start.lat === "number" ,
    typeof start.long === "number" ,
    typeof start.alt === "number" ,
    typeof end.lat === "number" ,
    typeof end.long === "number" ,
    typeof end.alt === "number")
    res.status(400).json({ error: "Missing 'start' or 'end' in request body" });
    return;
  }
});
app.post('/api/dgm/point', async (req, res) => {
  console.log('DGM endpoint called with:', req.body);
  const {point } = req.body;



  if (point &&
    typeof point.lat === "number" &&
    typeof point.long === "number" &&
    typeof point.alt === "number"
  ){
    try {
      const A = { x: point.lat, y: point.long, z: 0 }
      

      const maxdistance = 1000;
      const band = 1;
      if (vrtDataset) {
        console.log('Processing height profile request...');
        const v = await getHeightofPosition("data/DGM/mosaic.vrt", A, band);
        const wgs = { lat: v.x, long: v.y, alt: v.z ?? 0 }
        res.json({ data: [wgs] }); // Remove spread operator
        return;
      }

      console.log('VRT dataset not available');
      res.status(503).json({ error: "VRT dataset not available" });
    } catch (err: any) {
      console.error('DGM endpoint error:', err);
      res.status(400).json({ error: "Invalid 'start' or 'end' parameter", details: err.message });
    }
  }
  else {
    console.log('Missing wgs84cordiant parameters');

    res.status(400).json({ error: "Missing 'start' or 'end' in request body" });
    return;
  }
});

// DGM (Digital Elevation Model) data endpoint
app.get('/api/dgm/test', async (req, res) => {

  const start = { x: 49.4872222, y: 7.029166666666667, z: 0 };
  const end = { x: 49.4872222, y: 7.03248047679668, z: 0 };
  const maxdistance = 1000;
  const band = 1;
  if (vrtDataset) {
    const heightProfile = await getHeightprofile("data/DGM/mosaic.vrt", start, end, maxdistance, band);
    const wgs = heightProfile.map((v) => { return { lat: v.x, long: v.y, alt: v.z ?? 0 } })

    res.json({ data: wgs });
    return
  }


  res.status(503).json(null);
  return;


});
app.post('/api/BDML', async (req, res) => {
  console.log('BDML endpoint called with:', req.body);
  const { n, e, s, w, l }: { n: number, e: number, s: number, w: number, l: number } = req.body;

  if (!n && !e && !s && !w && !l &&
    typeof n !== "number" &&
    typeof e !== "number" &&
    typeof s !== "number" &&
    typeof w !== "number" &&
    typeof l !== "number"
  ) {
    console.log('Missing start or end parameters');
    res.status(400).json({ error: "Missing 'start' or 'end' in request body" });
    return;
  } try {
    await initializeDatabase();

    const repo = AppDataSource.getRepository(WaterVertex);
    // Hole alle passenden WaterVertex, aber nur jede 10. ID (sofern IDs fortlaufend sind)
    const allRaw = await repo.find({
      where: {
        x: Between(Math.min(n, s), Math.max(n, s)),
        y: Between(Math.min(e, w), Math.max(e, w))
      },
      take: 100,
      order: { id: 'ASC' }
    });
    // Filtere nur jeden 10ten Eintrag heraus
    const all = allRaw//.filter((_, idx) => idx % 10 === 0);

    res.json({ data: all }); // Remove spread operator
    return;
    // console.log('VRT dataset not available');
    // res.status(503).json({ error: "VRT dataset not available" });
  } catch (err: any) {
    console.error('DGM endpoint error:', err);
    res.status(400).json({ error: "Invalid 'start' or 'end' parameter", details: err.message });
  }
});

app.post('/api/BDML/path', async (req, res) => {
  console.log('BDML path endpoint called with:', req.body);
  const { n, e, s, w, l }: { n: number, e: number, s: number, w: number, l: number } = req.body;

  if (!n && !e && !s && !w && !l &&
    typeof n !== "number" &&
    typeof e !== "number" &&
    typeof s !== "number" &&
    typeof w !== "number" &&
    typeof l !== "number"
  ) {
    console.log('Missing start or end parameters');
    res.status(400).json({ error: "Missing 'start' or 'end' in request body" });
    return;
  } try {
    if (!AppDataSource.isInitialized) { await initializeDatabase(); }

    // Optimierung 1: Direkte Join-Abfrage statt mehreren separaten Abfragen
    const pathsdata = AppDataSource.getRepository(WaterPath);
    const query = pathsdata.createQueryBuilder('path')
      .leftJoinAndSelect(AXGewaesserachse, 'achse', 'achse.gmlid = path.istteilvon')
      .leftJoinAndSelect(AXWasserlauf, 'lauf', 'lauf.gmlid = achse.istteilvon')
      .leftJoinAndSelect(WaterVertex, 'formPoint', 'formPoint.x = path.fromx AND formPoint.y = path.fromy')
      .leftJoinAndSelect(WaterVertex, 'toPoint', 'toPoint.x = path.tox AND toPoint.y = path.toy')
      .where('(path.fromx BETWEEN :minX AND :maxX AND path.fromy BETWEEN :minY AND :maxY)')
      .orWhere('(path.tox BETWEEN :minX AND :maxX AND path.toy BETWEEN :minY AND :maxY)')
      .setParameters({
        minX: Math.min(n, s),
        maxX: Math.max(n, s),
        minY: Math.min(e, w),
        maxY: Math.max(e, w)
      });

    // Optimierung 2: Nur benötigte Felder auswählen
    query.select([
      'path.id',
      'path.fromx',
      'path.fromy',
      'path.tox',
      'path.toy',
      'path.istteilvon',
      'achse.hatdirektunten',
      'achse.istteilvon',
      'lauf.gewaesserkennzahl',
      'lauf.name',
      'formPoint.ecef',
      'toPoint.ecef'
    ]);


    const paths = await query.getRawMany();

    // const AXGewaesserachsedata = AppDataSource.getRepository(AXGewaesserachse);
    // const AXWasserlaufdata = AppDataSource.getRepository(AXWasserlauf);    
    const watersMap = new Map<number, { name: string, path: { from: { lat: number, long: number, ca3: { x: number, y: number, z: number } }, to: { lat: number, long: number, ca3: { x: number, y: number, z: number } }, hatdirektunten?: string, id: number }[] }>()

    // Optimierung 3: Verwende die bereits gejointe Daten
    for (let row of paths) {
      // Parse formPoint_ecef and toPoint_ecef from JSON string to object
      let frompoint = null;
      let topoint = null;
      try {
        frompoint = row.formPoint_ecef ? JSON.parse(row.formPoint_ecef) : null;
      } catch (e) {
        frompoint = null;
      }
      try {
        topoint = row.toPoint_ecef ? JSON.parse(row.toPoint_ecef) : null;
      } catch (e) {
        topoint = null;
      }
      if (row.lauf_gewaesserkennzahl && row.lauf_name) {
        if (watersMap.has(row.lauf_gewaesserkennzahl)) {
          const water = watersMap.get(row.lauf_gewaesserkennzahl)
          if (water) {
            water.path.push({
              from: {
                lat: row.path_fromx,
                long: row.path_fromy,
                ca3: { ...frompoint }
              },
              to: {
                lat: row.path_tox,
                long: row.path_toy,
                ca3: { ...topoint }
              },
              hatdirektunten: row.achse_hatdirektunten,
              id: row.path_id
            });
          }
        } else {
          watersMap.set(row.lauf_gewaesserkennzahl, {
            name: row.lauf_name,
            path: [{
              from: {
                lat: row.path_fromx,
                long: row.path_fromy,
                ca3: { ...frompoint }
              },
              to: {
                lat: row.path_tox,
                long: row.path_toy,
                ca3: { ...topoint }
              },
              hatdirektunten: row.achse_hatdirektunten,
              id: row.path_id
            }]
          });
        }
      }
    }
    const list = Array.from(watersMap.values());

    res.json({ data: list }); // Remove spread operator
    return;
    // console.log('VRT dataset not available');
    // res.status(503).json({ error: "VRT dataset not available" });
  } catch (err: any) {
    console.error('BDML path endpoint error:', err);
    res.status(400).json({ error: "Invalid 'start' or 'end' parameter", details: err.message });
  }
});


app.get('/api/BDML/test', async (req, res) => {
  console.log('BDML test endpoint called');
  await initializeDatabase();
  const pathsdata = AppDataSource.getRepository(WaterPath);
  const paths = await pathsdata.find({ take: 1000, order: { id: 'ASC' } });
  const AXGewaesserachsedata = AppDataSource.getRepository(AXGewaesserachse);
  const AXWasserlaufdata = AppDataSource.getRepository(AXWasserlauf);

  const pathwhitinfo = new Map<string, { name: string, path: any[] }>()
  for (let path of paths) {
    const gwässerdata = await AXGewaesserachsedata.findOne({ where: { gmlid: path.istteilvon } });
    if (gwässerdata) {
      const wasserlauf = await AXWasserlaufdata.findOne({ where: { gmlid: gwässerdata.istteilvon } })
      if (wasserlauf) {
        if (pathwhitinfo.has(wasserlauf.name)) {

          const water = pathwhitinfo.get(wasserlauf.name)
          if (water) {
            water.path.push({ from: [path.fromx, path.fromy], to: [path.tox, path.toy], hatdirektunten: gwässerdata.hatdirektunten })
          }
        }
        else {
          pathwhitinfo.set(wasserlauf.name, { name: wasserlauf.name, path: [{ from: [path.fromx, path.fromy], to: [path.tox, path.toy], hatdirektunten: gwässerdata.hatdirektunten }] })
        }
      }

    }

  }
  const list = Array.from(pathwhitinfo.values());
  // Sende alle Daten in einem großen Paket
  res.json({ data: list });
  console.log('Finished sending WaterVertex data as one big packet');
});

// Globale VRT Dataset-Variable
let vrtDataset: gdal.Dataset | null = null;

// VRT beim Serverstart laden
const vrtFilePath = "data/DGM/mosaic.vrt";
gdal.openAsync(vrtFilePath)
  .then(dataset => {
    if (!dataset || !dataset.driver || dataset.driver.description !== "VRT") {
      throw new Error("The provided file is not a VRT dataset.");
    }
    vrtDataset = dataset;
    console.log("VRT Dataset erfolgreich geladen.");
  })
  .catch(err => {
    console.error("Fehler beim Laden des VRT Datasets:", err);
  });


// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.redirect('/');

});

// Start server
app.listen(PORT, () => {
  console.log(`🌊 Saarland 3D Gewässer Plugin Backend Server running on port ${PORT}`);
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 API status: http://localhost:${PORT}//api/BDML/test`);
});

export default app;