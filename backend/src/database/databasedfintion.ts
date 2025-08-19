import { DataSource } from 'typeorm';
import path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';

import WaterVertex from "./objects/Watervertex";
import AXGewaesserachse from './objects/AX_Gewaesserachse';
import AXWasserlauf from './objects/AX_Wasserlauf';
import WaterPath from './objects/Waterpath';
// Load environment variables
dotenv.config();

// Database path configuration
const DATABASE_DIR = path.join(process.cwd(), 'data', 'DataBase');
const DATABASE_PATH = path.join(DATABASE_DIR, 'database.sqlite');

// Ensure database directory exists
if (!fs.existsSync(DATABASE_DIR)) {
    fs.mkdirSync(DATABASE_DIR, { recursive: true });
    console.log(`Created database directory: ${DATABASE_DIR}`);
}


// TypeORM DataSource configuration
const AppDataSource = new DataSource({
    type: 'sqlite',
    database: DATABASE_PATH,
    entities: [
        WaterVertex,
        WaterPath,
        AXGewaesserachse,
        AXWasserlauf
    ],
    synchronize: true, // Auto-create/update database schema
    logging: false,
    migrations: [],
    subscribers: [],
    // Pool settings to manage connections properly
    maxQueryExecutionTime: 30000,
    dropSchema: false,
    // SQLite specific settings to avoid transaction conflicts
    extra: {
        // WAL mode for better concurrency
        pragma: {
            journal_mode: 'WAL',
            synchronous: 'NORMAL',
            temp_store: 'MEMORY',
            mmap_size: 268435456, // 256MB
            cache_size: -64000, // 64MB
            foreign_keys: 'ON'
        }
    }
});

export default AppDataSource