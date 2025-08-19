import AppDataSource from "./databasedfintion";
import AXGewaesserachse from "./objects/AX_Gewaesserachse";
import AXWasserlauf from "./objects/AX_Wasserlauf";
import WaterPath from "./objects/Waterpath";
import WaterVertex from "./objects/Watervertex";

let globalQueryRunner: ReturnType<typeof AppDataSource.createQueryRunner> | null = null;
let initializationPromise: Promise<void> | null = null;
let isInitializing = false;

export async function getQueryRunner() {
    await ensureDatabaseInitialized();
    if (!globalQueryRunner) {
        globalQueryRunner = AppDataSource.createQueryRunner();
    }
    return globalQueryRunner;
}

async function ensureDatabaseInitialized(): Promise<void> {
    if (AppDataSource.isInitialized) {
        return;
    }
    
    if (initializationPromise) {
        return initializationPromise;
    }
    
    return initializeDatabase();
}

export async function initializeDatabase(): Promise<void> {
    // If already initialized, return immediately
    if (AppDataSource.isInitialized) {
        console.log('✓ Database already initialized');
        return;
    }
    
    // If initialization is in progress, wait for it
    if (initializationPromise) {
        console.log('⏳ Database initialization already in progress, waiting...');
        return initializationPromise;
    }
    
    // If someone else is initializing, wait a bit and check again
    if (isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
        return ensureDatabaseInitialized();
    }
    
    // Start initialization
    isInitializing = true;
    initializationPromise = performInitialization();
    
    try {
        await initializationPromise;
    } finally {
        isInitializing = false;
        initializationPromise = null;
    }
}

async function performInitialization(): Promise<void> {
    try {
        console.log('Initializing database connection...');
        
        // Double-check if already initialized (race condition protection)
        if (AppDataSource.isInitialized) {
            console.log('✓ Database already initialized (race condition avoided)');
            return;
        }
        
        // Initialize the data source
        await AppDataSource.initialize();
        console.log('✓ Database initialized successfully');
        
        return;
    } catch (error) {
        console.error('✗ Database initialization failed:', error);
        
        // If initialization failed, ensure we clean up properly
        if (AppDataSource.isInitialized) {
            try {
                await AppDataSource.destroy();
            } catch (cleanupError) {
                console.error('Error during cleanup:', cleanupError);
            }
        }
        
        throw error;
    }
}

// Close database connection
export async function closeDatabase(): Promise<void> {
    try {
        if (globalQueryRunner) {
            await globalQueryRunner.release();
            globalQueryRunner = null;
        }
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            console.log('✓ Database connection closed successfully');
        }
    } catch (error) {
        console.error('✗ Error closing database connection:', error);
    }
}



export async function addWaterVertex(vertexData:Omit<WaterVertex, 'id'>): Promise<WaterVertex|null> {
    try {
        await ensureDatabaseInitialized();
        const waterVertexRepo = AppDataSource.getRepository(WaterVertex);
        const newVertex = waterVertexRepo.create(vertexData);
       
            
        return await waterVertexRepo.save(newVertex);
                  
    } catch (error) {
        return null
    }
}
export async function addWaterPath(vertexData:Omit<WaterPath, 'id'>): Promise<WaterPath|null> {
    try {
        await ensureDatabaseInitialized();
        const waterpathRepo = AppDataSource.getRepository(WaterPath);
        const newPath = waterpathRepo.create(vertexData);
      
        return await waterpathRepo.save(newPath);
                  
    } catch (error) {
       return null
    }
}


export async function addAXWasserlauf(vertexData: AXWasserlauf): Promise<AXWasserlauf|null> {
    try {
        await ensureDatabaseInitialized();
        const AXWasserlaufRepo = AppDataSource.getRepository(AXWasserlauf);
        const newVertex = AXWasserlaufRepo.create(vertexData);
        return await AXWasserlaufRepo.save(newVertex);
    } catch (error) {
        return null
    }
}


export async function addAXGewaesserachse(vertexData: AXGewaesserachse): Promise<AXGewaesserachse|null> {
    try {
        await ensureDatabaseInitialized();
        const AXGewaesserachseRepo = AppDataSource.getRepository(AXGewaesserachse);
        const newVertex = AXGewaesserachseRepo.create(vertexData);
        return await AXGewaesserachseRepo.save(newVertex);
    } catch (error) {
        return null
    }
}

