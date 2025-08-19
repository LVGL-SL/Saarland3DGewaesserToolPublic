// Web Worker für die Verwaltung von API-Anfragen mit maximal 10 gleichzeitigen Requests
interface PathRequest {
    id?: string;
    n?: number;
    e?: number;
    s?: number;
    w?: number;
    l?: number;
    exclud?:string[];
    type: string;
    url?:string;
}


interface PathResponse {
    id: string;
    success: boolean;
    data?: any;
    error?: string;
}

type ResponseData = { 
    name: string, 
    path: { 
        from: { 
            lat: number, 
            long: number, 
            ca3: { 
                x: number, 
                y: number, 
                z: number 
            } 
        }, 
        to: { 
            lat: number,
             long: number,
              ca3: {
                 x: number,
                  y: number, 
                  z: number 
                } 
            }, 
            hatDirektUnten?: string 
        }[], 
    }[]



const maxrequest = 9
let queue: PathRequest[] = [];
let inProgressCount = 0
let isrunnig = false
let pendingRun = false
let intervall :NodeJS.Timeout|null= null
let API_BACKEND_URL = "128.0.0.1:8082"






async function run() {
    
    while (inProgressCount < maxrequest && queue.length > 0) {
           
            let { id, n, e, s, w, l } = queue.pop() as PathRequest
            if (typeof id === "string" &&
                typeof n === "number" &&
                typeof e === "number" &&
                typeof s === "number" &&
                typeof w === "number" &&
                typeof l === "number"
            ) {
            try{
            const localstroedresponmse = await getResponse(id)
            if(localstroedresponmse){
                const result: PathResponse = {
                    id,
                    success: true,
                    data: localstroedresponmse
                };

                self.postMessage(result);
                continue; // Continue mit nächstem Element statt return
            }else{
                inProgressCount++
                getrequest(id, n, e, s, w, l).finally(() => { 
                    inProgressCount--; 
                })
            }

            }catch(error){
                console.error("Error processing request:", error);
                // Fehler-Response senden
                const result: PathResponse = {
                    id: id || 'unknown',
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error in run()'
                };
                self.postMessage(result);
            }

                
            }
            await new Promise(resolve => setTimeout(resolve, 10))

    }
    if( queue.length === 0){
    }
}



async function getrequest(id: string, n: number, e: number, s: number, w: number, l: number) {
    try {
        const response = await fetch(`http://${API_BACKEND_URL}/api/BDML/path`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                n,
                e,
                s,
                w,
                l
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }        const responseData = await response.json();
        const data = createEntityOptions(responseData.data) // Entity-Optionen erstellen
        const result: PathResponse = {
            id,
            success: true,
            data
        };
        await insertResponse(id,data)

        self.postMessage(result);
        return

    } catch (error) {

        const result: PathResponse = {
            id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };

        self.postMessage(result);
        return
    }

}

// Diese Funktion wurde zum Main Thread verschoben
// um Cesium-Dependencies zu vermeiden
function processRawData(data: ResponseData) {
    return data; // Rohe Daten ohne Cesium-Verarbeitung
}


function pathid(positions: Array<{x: number, y: number, z: number}>) {
    let id = "path:"
    for (let c of positions) {
        id += `${c.x}${c.y}${c.z}`
    }
    return id
}

function randomColorComponent() {
    const pre = 0.9 + 0.1 * Math.random() - 0.1 / 2
    const sub = Math.random()
    let arra = [pre, sub, 0];
    // Liste mischen (Fisher-Yates Shuffle)
    for (let i = arra.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arra[i], arra[j]] = [arra[j], arra[i]];
    }
    return arra;
}

// Erstelle Entity-Optionen ohne echte Cesium-Instanzen
function createEntityOptions(data: ResponseData) {
    const paths: Array<any> = [];
    for (let water of data) {        
        for (let path of water.path) {
            const { from, to } = path;
            
            // Erstelle Cesium-Konstruktor-Optionen ohne echte Cesium-Instanzen
            const positions = [ from.long,from.lat, to.long ,to.lat];

            const entityOptions = {
                id: pathid([from.ca3,to.ca3]),
                polyline: {
                    positions: positions,
                },
                properties: {
                    "waters": water.name,
                    "from": from.ca3,
                    "to": to.ca3,
                }
            };

            paths.push(entityOptions);
        }
    }
    
    return paths;
}





// Message Handler für Worker
self.onmessage = async function (event: MessageEvent<PathRequest>) {
    const {type} = event.data
    
    if(type==="start"){
        if(!intervall){
            clearTable()
             .then(()=>{
                intervall=setInterval(()=>{
                    run()
                }, 1000);
             })
             .catch((error) => {
                console.error("❌ Error clearing table:", error)
             });
             if(event.data.url){
                API_BACKEND_URL = event.data.url
             }
        } else {
        }
    }
    else if(type==="stop"){
        if(intervall){
           clearInterval(intervall)
           intervall = null
        }
    }
    else if(type==="add"){
        queue.push(event.data)
    }
    else if(type==="rise"){
        const index = queue.findLastIndex((v)=>v.id===event.data.id)
        if(index!==-1){
            queue.push(queue.splice(index, 1)[0]);
        }
        
    }
    else if(type==="remove"){
        const index = queue.findLastIndex((v) => v.id === event.data.id);
        if (index !== -1) {
            queue.splice(index, 1);
        } else {
        }
    }else if(type==="removeall"){
        const exclud = event.data.exclud ?? [];
        queue = queue.filter((v) => v.id && exclud.includes(v.id));
    } else {
        console.warn("❓ Unknown message type:", type)
    }
};

// IndexedDB Zugriffskonstanten und Funktionen
const DB_NAME = 'PathWorkerDB';
const STORE_NAME = 'responses';
const DB_VERSION  = 1;
const Clearonstart  = true;
const maximumEntries  = 500;
const maximumLifetime = 86400000; /*1h in ms, so 24 * 60 * 60 * 1000 = 86400000*/

// IndexedDB öffnen
function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}



// Funktion zum Löschen der gesamten Tabelle
async function clearTable(): Promise<void> {
    if(Clearonstart){
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    
    return new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        
        // Clear operation wird erst nach dem Setzen der Event Handler aufgerufen
        tx.objectStore(STORE_NAME).clear();
    });
}}

// Funktion zum Einfügen eines Eintrags, Löschen des ältesten bei >100
async function insertResponse(id: string, response: any): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const now = Date.now();
   

    // Einfügen
    await store.put({id, response, lastAccess: now });

    // Prüfen auf >100 Elemente
    const countRequest = store.count();
    await new Promise(resolve => countRequest.onsuccess = resolve);
    if (countRequest.result > maximumEntries) {
        // Ältestes Element löschen
        const getAllRequest = store.getAll();
        await new Promise(resolve => getAllRequest.onsuccess = resolve);
        const all = getAllRequest.result as any[];
        all.sort((a, b) => a.lastAccess - b.lastAccess);
        if (all.length > 0) {
            await store.delete(all[0].id);
        }    }
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// Funktion zum Abrufen eines Eintrags, Aktualisieren der Zeit, Löschen wenn >24h
async function getResponse(id: string): Promise<any | null> {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
        tx.onerror = () => reject(tx.error);
        
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = () => {
            const all = getAllRequest.result as any[];
            const entry = all.find(e => e.id === id);
            
            if (!entry) {
                resolve(null);
                return;
            }
            
            const now = Date.now();
            if (now - entry.lastAccess > maximumLifetime) {
                const deleteRequest = store.delete(entry.key);
                deleteRequest.onsuccess = () => resolve(null);
                deleteRequest.onerror = () => reject(deleteRequest.error);
                return;
            }
            
            // Zeit aktualisieren
            entry.lastAccess = now;
            const putRequest = store.put(entry);
            putRequest.onsuccess = () => resolve(entry.response ?? null);
            putRequest.onerror = () => reject(putRequest.error);
        };
        getAllRequest.onerror = () => reject(getAllRequest.error);
    });
}


