import type * as cesium from "@vcmap/cesium";
import backendSettings from '../settings.json';
const API_BACKEND_URL = backendSettings.API_BACKEND_URL;

// Manager für den Path Worker
export interface PathRequestData {
    n: number;
    e: number;
    s: number;
    w: number;
    l: number;
}

type PathResponseData = Array<cesium.Entity.ConstructorOptions>;

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


// Type für Entity-Optionen die vom Worker kommen
type EntityOptions = {
    id: string;
    polyline: {
        positions: Array<number>; 
    };
    properties: {
        waters: string;
        from: {x: number, y: number, z: number};
        to: {x: number, y: number, z: number};
    };
};

interface WorkerMessage {
    id: string;
    success: boolean;
    data?: Array<EntityOptions>;
    error?: string;
}

interface PendingRequest {
    resolve: (data: EntityOptions[]) => void;
    reject: (error: Error) => void;
}

export default class PathWorkerManager {
    private worker: Worker | null = null;
    private pendingRequests = new Map<string, PendingRequest>();
    private requestCounter = 0;
    private isDestroyed = false;

    constructor() {
        this.initializeWorker();
    }

    private initializeWorker(): void {
        try {
            this.worker = new Worker(new URL('./PathWorker.js', import.meta.url));
            this.worker.onmessage = this.handleWorkerMessage.bind(this);
             this.worker.postMessage({ type:"start",url:API_BACKEND_URL});
        } catch (error) {
            console.error('Failed to initialize PathWorker:', error);
            throw new Error('Failed to initialize PathWorker');
        }
    }

    private handleWorkerMessage(event: MessageEvent<WorkerMessage>): void {
        const response = event.data;
        if (!response.id) {
            console.warn('Received worker message without ID:', response);
            return;
        }

        const pending = this.pendingRequests.get(response.id);

        if (!pending) {
            console.warn('Received response for unknown request:', response.id);
            return;
        }        this.pendingRequests.delete(response.id);

        if (response.success && response.data) {
            // Konvertiere Entity-Optionen zu echten Cesium-Entities
            pending.resolve(response.data);        } else {
            pending.reject(new Error(response.error || 'Unknown worker error'));
        }
    }
    
   
     public async riserequest(tileid:string ): Promise<void> {    
        if(this.pendingRequests.has(tileid)){
              this.worker!.postMessage({
                    type:"rise",
                    id:tileid,
                });
        }
    
    }
    public async requestPaths(requestData: PathRequestData, tileid:string ): Promise<EntityOptions[]> {
        if (this.isDestroyed || !this.worker) {
            throw new Error('PathWorkerManager has been destroyed');
        }
        return new Promise((resolve, reject) => {
          
            this.pendingRequests.set(tileid, {
                resolve,
                reject
            });
            try {
                this.worker!.postMessage({
                    type:"add",
                    id:tileid,
                    ...requestData

                });


            } catch (error) {
                this.pendingRequests.delete(tileid);
            }
        });
    }

    public async removerequest(tileid:string ): Promise<void> {
        this.worker!.postMessage({
            type: "remove",
            id: tileid,
        });
        const pending = this.pendingRequests.get(tileid);
        if(pending){
            this.pendingRequests.delete(tileid)
            pending.reject(new Error('tile got rejetede'));
        }
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
