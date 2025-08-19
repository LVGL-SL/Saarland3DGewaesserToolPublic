import AppDataSource from './databasedfintion';
import WaterVertex from './objects/Watervertex';
import WaterPath from './objects/Waterpath';



export class PathAnalysis {
    
    /**
     * Analysiert Pfade von Vertex ID 50 ausgehend
     * @returns Zwei Listen: Pfadsegmente und istTeilVon-Beziehungen
     */
    async analyzePathsFromVertex50(): Promise<any> {
        // Stelle sicher, dass DataSource initialisiert ist
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const waterVertexRepo = AppDataSource.getRepository(WaterVertex);
        const waterPathRepo = AppDataSource.getRepository(WaterPath);

        // Lade Vertex mit ID 50
        const startVertex = await waterVertexRepo.findOne({
            where: { id: 51 }
        });

        if (!startVertex) {
            console.log('Vertex mit ID 50 nicht gefunden');
            return {
                pathSegments: [],
                istTeilVonRelations: []
            };
        }

        // Lade alle Pfade die von Vertex 50 ausgehen oder dort enden
        const tolist = await waterPathRepo.find({
            where: [
                { fromX: startVertex.x,fromY: startVertex.y },
               
            ],
            
        });
        const fromlist = await waterPathRepo.find({
            where: [
                {toX:startVertex.x,toY:startVertex.y}
            ],
        }) ;

         const tolistg = tolist.map((v)=>{return{toX:v.toX,toY:v.toY,istTeilVon:v.istTeilVon}})
         const fromlistg = fromlist.map((v)=>{return{fromX:v.fromX,fromY:v.fromY,istTeilVon:v.istTeilVon}})

        return {
            ...startVertex,
            fromlistg,
            tolistg,
        };
    }

    /**
 * Prüft auf doppelte Pfade mit gleichen Koordinaten aber unterschiedlichen istTeilVon Werten
 */
async checkForDuplicatePathsWithDifferentIstTeilVon(): Promise<any[]> {
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const waterPathRepo = AppDataSource.getRepository(WaterPath);
    
    // Alle Pfade laden
    const allPaths = await waterPathRepo.find();
    
    // Gruppierung nach Koordinaten
    const coordinateGroups = new Map<string, WaterPath[]>();
    
    for (const path of allPaths) {
        const coordKey = `${path.fromX},${path.fromY},${path.toX},${path.toY}`;
        
        if (!coordinateGroups.has(coordKey)) {
            coordinateGroups.set(coordKey, []);
        }
        coordinateGroups.get(coordKey)!.push(path);
    }
    
    // Nur Gruppen mit mehr als einem Pfad prüfen
    const duplicates: any[] = [];
    
    for (const [coordKey, paths] of coordinateGroups) {
        if (paths.length > 1) {
            // Prüfen ob unterschiedliche istTeilVon Werte vorhanden sind
            const istTeilVonValues = new Set(paths.map(p => p.istTeilVon));
            
            if (istTeilVonValues.size > 1) {
                duplicates.push({
                    coordinates: coordKey,
                    count: paths.length,
                    istTeilVonValues: Array.from(istTeilVonValues),
                    paths: paths.map(p => ({
                        id: p.id,
                        fromX: p.fromX,
                        fromY: p.fromY,
                        toX: p.toX,
                        toY: p.toY,
                        istTeilVon: p.istTeilVon
                    }))
                });
            }
        }
    }
    
    return duplicates;
}

async printAnalysisResults(): Promise<void> {
    try {
        const objekt50 = await this.analyzePathsFromVertex50();
        console.log('=== PFAD-ANALYSE FÜR VERTEX 50 ===\n');
        console.log('1. PFADSEGMENTE (von A nach B):');
        console.log(objekt50);
        
        console.log('\n=== DOPPELTE PFADE MIT UNTERSCHIEDLICHEN ISTEILVON ===\n');
        const duplicates = await this.checkForDuplicatePathsWithDifferentIstTeilVon();
        
        if (duplicates.length > 0) {
            console.log(`Gefunden: ${duplicates.length} doppelte Pfad-Koordinaten mit unterschiedlichen istTeilVon Werten:`);
            duplicates.forEach((duplicate, index) => {
                console.log(`\n${index + 1}. Koordinaten: ${duplicate.coordinates}`);
                console.log(`   Anzahl Pfade: ${duplicate.count}`);
                console.log(`   istTeilVon Werte: ${duplicate.istTeilVonValues.join(', ')}`);
                console.log(`   Pfade:`, duplicate.paths);
            });
        } else {
            console.log('Keine doppelten Pfade mit unterschiedlichen istTeilVon Werten gefunden.');
        }
        
    } catch (error) {
        console.error('Fehler bei der Pfad-Analyse:', error);
    }
}

}
const tst = new PathAnalysis()
tst.printAnalysisResults()