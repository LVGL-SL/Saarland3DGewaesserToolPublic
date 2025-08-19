// Web Worker für die Verwaltung von API-Anfragen mit maximal 10 gleichzeitigen Requests
interface PathRequest {
    id?: string;
    start?: WGS84;
    end?: WGS84;
    exclud?: string[];
    type: string;
    url?:string;
}
interface WGS84 { lat: number, long: number, alt: number }

interface PathResponse {
    id: string;
    success: boolean;
    data?: any;
    start?:any;
    error?: string;
    url?:string;
}


class HeightProfileWorker {
    queue: PathRequest[] = [];
    inProgressCount = 0;
    static maxRequest = 10;
    intervall: NodeJS.Timeout | null = null;
    url:string

    constructor(url:string) {
        this.intervall = setInterval(() => {
            this.run()
        }, 1000);
        this.url =url
    }

    destroy() {
        if (this.intervall) {
            clearInterval(this.intervall)
            this.intervall = null
        }
    }

    async run() {
        while (this.inProgressCount < HeightProfileWorker.maxRequest && this.queue.length > 0) {
            const { id, start, end } = this.queue.pop() as PathRequest;
            if (
                typeof id === "string" &&
                start && end &&
                typeof start.lat === "number" &&
                typeof start.long === "number" &&
                typeof start.alt === "number" &&
                typeof end.lat === "number" &&
                typeof end.long === "number" &&
                typeof end.alt === "number"
            ) {
                try {
                    this.inProgressCount++;
                    this.getRequest(id, start, end).finally(() => {
                        this.inProgressCount--;
                    });
                } catch (error) {
                    const result: PathResponse = {
                        id: id || 'unknown',
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error in run()'
                    };
                    self.postMessage(result);
                }
            }
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        if (this.queue.length === 0) {
            // idle
        }
    }

    async getRequest(id: string, start: WGS84, end: WGS84) {
        try {
            const response = await fetch(`http://${this.url}/api/dgm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ start, end }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json();
            const result: PathResponse = {
                id,
                success: true,
                data: responseData.data,
                start:responseData.start
            };
            console.log("dede PathResponse", result)
            self.postMessage(result);
        } catch (error) {
            const result: PathResponse = {
                id,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
            self.postMessage(result);
        }
    }
}

let heightProfileWorker: HeightProfileWorker | null = null




// Message Handler für Worker
self.onmessage = async function (event: MessageEvent<PathRequest>) {
    const { type } = event.data

    if (type === "start") {
        if (!heightProfileWorker) {
            if(event.data.url)
                {heightProfileWorker = new HeightProfileWorker(event.data.url);}
            else{
                heightProfileWorker = new HeightProfileWorker("128.0.0.1:8082");  
            }
        }
    }
    else if (type === "stop") {
        if (heightProfileWorker) {
            heightProfileWorker.destroy()
            heightProfileWorker = null
        }
    }
    else if (type === "add") {
        if (heightProfileWorker) {
            heightProfileWorker.queue.push(event.data)
        }
    }
    else if (type === "removeall") {
        if (heightProfileWorker) {
            heightProfileWorker.queue = []
        } else {
            console.warn("❓ Unknown message type:", type)
        }
    }
};

