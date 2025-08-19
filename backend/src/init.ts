import { createDataBasefromBDML } from './helper/readBDML';
import { creatVRT } from "./helper/VrtSetupHelper"
import { closeDatabase, initializeDatabase } from "./database/hanlder";
import AppDataSource from "./database/databasedfintion";


async function main() {
    try {
        await creatVRT();
        await initializeDatabase();
        await createDataBasefromBDML();
    } catch (error) {
        console.error('Fehler im Hauptprozess:', error);
    } finally {
        await closeDatabase();
        console.log(AppDataSource.isInitialized);
    }
}

main();
