import * as cesium from "@vcmap/cesium";
import backendSettings from '../../settings.json';
const API_BACKEND_URL = backendSettings.API_BACKEND_URL;


// Manager für den Path Worker
export interface PathRequestData {
   start:cesium.Cartographic
   end:cesium.Cartographic
}




// Type für Entity-Optionen die vom Worker kommen
type WGS84 = {
   lat:number,
   long:number,
   alt:number
};

interface WorkerMessage {
    id: string;
    success: boolean;
    data?: Array<WGS84>;
    start?:WGS84;
    error?: string;
}

export interface ResolveData {
    data: cesium.Cartographic[];
    start: cesium.Cartographic;
}

interface PendingRequest {
    resolve: (data: ResolveData) => void;
    reject: (error: Error) => void;
}

export default class HeightProfileWorkerManager {
    private worker: Worker | null = null;
    private pendingRequests = new Map<string, PendingRequest>();
    private isDestroyed = false;

    constructor() {
        this.initializeWorker();
    }

    private initializeWorker(): void {
        try {
            this.worker = new Worker(new URL('./HeightProfileWorker.js', import.meta.url));
            this.worker.onmessage = this.handleWorkerMessage.bind(this);
             this.worker.postMessage({ type:"start", url:API_BACKEND_URL});
        } catch (error) {
            console.error('Failed to initialize PathWorker:', error);
            throw new Error('Failed to initialize PathWorker');
        }
    }

    private handleWorkerMessage(event: MessageEvent<WorkerMessage>): void {

        const response = event.data;
        console.log('dede daten reponce:',  event.data);
        if (!response.id) {
            console.warn('Received worker message without ID:', response);
            return;
        }

        const pending = this.pendingRequests.get(response.id);

        if (!pending) {
            console.warn('Received response for unknown request:', response.id);
            return;
        }        this.pendingRequests.delete(response.id);

        
        if (response.success && response.data&&response.start) {
            const cartographics = response.data.map((v)=>{return Cesium.Cartographic.fromDegrees(v.long,v.lat,v.alt)})
                const start = Cesium.Cartographic.fromDegrees(response.start.long,response.start.lat,response.start.alt)
            pending.resolve({data:cartographics,start});    

        } 
        else {
            pending.reject(new Error(response.error || 'Unknown worker error'));
        }
    }
    
    public async requestPaths(start:cesium.Cartographic, end:cesium.Cartographic): Promise<ResolveData> {
        console.log("dede daten anfrage zu worker", start,end)
        if (this.isDestroyed || !this.worker) {
            throw new Error('PathWorkerManager has been destroyed');
        }

        return new Promise((resolve, reject) => {
            const id = Date.now().toString();
            this.pendingRequests.set(id, {
                resolve,
                reject
            });
            try {
                this.worker!.postMessage({
                    type:"add",
                    id,
                    start:{
                        lat: Cesium.Math.toDegrees(start.latitude),
                        long: Cesium.Math.toDegrees(start.longitude),
                        alt: start.height
                    },
                    end:{
                        lat: Cesium.Math.toDegrees(end.latitude),
                        long: Cesium.Math.toDegrees(end.longitude),
                        alt: end.height
                    }

                });


            } catch (error) {
                this.pendingRequests.delete(id);
            }
        });
    }

    public async removeallrequest(exclud:string[]): Promise<void> {
        this.worker!.postMessage({
            type: "removeall",
            exclud
        });
        // Entferne alle Requests, die NICHT in exclud sind
        for (const id of Array.from(this.pendingRequests.keys())) {
            if (!exclud.includes(id)) {
            this.pendingRequests.get(id)?.reject(new Error('tile got rejetede'));
            this.pendingRequests.delete(id);
            }
        }
        
    }




    public destroy(): void {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed = true;
        

        // Worker beenden
        if (this.worker) {
            try {
                this.worker.postMessage({ type:"stop"});
                this.worker.terminate();
            } catch (error) {
                console.warn('Failed to terminate worker:', error);
            }
            this.worker = null;
        }
    }
}
