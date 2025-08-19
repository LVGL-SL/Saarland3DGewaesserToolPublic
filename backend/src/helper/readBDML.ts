import dotenv from "dotenv"
import * as fs from 'fs';
import * as path from 'path';
import {getXMLFile, validateDMLStructure} from "./BDMLvailidater"
import { readdatafromBDML } from "../database/bdml";

const cliProgress = require('cli-progress');

dotenv.config()
export async function createDataBasefromBDML():Promise<string[]>{
    const DEFAULTPATH = "data/BDLM/"
    const importFolder = process.env.BDLM_FOLDERNAME
    const folderPath = path.join(DEFAULTPATH, importFolder ?? '');
    
    try {
        // Prüfen ob der Ordner existiert
        if (!fs.existsSync(folderPath)) {
            console.error(`Ordner nicht gefunden: ${folderPath}`);
            return [];
        }
        
        // Alle Dateien im Ordner lesen
        const files = fs.readdirSync(folderPath);
        
        // Nur XML-Dateien filtern
        const xmlFiles = files.filter(file => 
            path.extname(file).toLowerCase() === '.xml'
        );
        
        // Vollständige Pfade erstellen
        const xmlFilePaths = xmlFiles.map(file => 
            path.join(folderPath, file)
        );        console.log("xmlFilePaths.length:", xmlFilePaths.length);
          // Take only the last 5 files for processing
        const filesToProcess = xmlFilePaths//.slice(4).splice(0,1);
        console.log("Processing last 10 files:", filesToProcess.length);
        
        // Dateigrößen ermitteln
        let absoluteFileSizes=0
        const xmlFileSizes = filesToProcess.map(filePath => {
            const stats = fs.statSync(filePath);
            absoluteFileSizes+=stats.size
            return stats.size;
        });
        console.log("Total file size to process:", bytesToString(absoluteFileSizes));
        console.log(`Processing BDML data from ${folderPath}`)
        const progressBar = new cliProgress.SingleBar({
            format: '{bar}| {percentage}% | {proceedBytes}/{totalBytes} | {files} files processed | ETA: {eta_formatted}',
            
        }, cliProgress.Presets.shades_classic);let processedFileSizes = 0;
        let errormessages =[] as string[]
        const l = filesToProcess.length
        console.log("Starting BDML validation and database import process...");
        progressBar.start(absoluteFileSizes+1, 0,{proceedBytes:bytesToString(0),totalBytes:bytesToString(absoluteFileSizes),files:`0/${l}`});
        const bdmlFilePath: string[] = [];
        for (let i = 0; i < filesToProcess.length; i++) {
            const v = filesToProcess[i];
            const currentFileSize = xmlFileSizes[i];

            progressBar.update(processedFileSizes + 1, {
                files: `${i}/${l},${getfilename(v)}`,
                proceedBytes: bytesToString(processedFileSizes)
            });

            const isValidBDML = await getdatafrom(v);

            processedFileSizes += currentFileSize;
           

            if (isValidBDML === "") {
                bdmlFilePath.push(v);
            } else {
                errormessages.push(isValidBDML);
            }
        }
        progressBar.stop();
          if(errormessages.length>0){
            console.log("=".repeat(80))
            console.log(`⚠️  WARNING: Failed to load ${errormessages.length} ${errormessages.length>1?"files":"file"}`)
            console.log("=".repeat(80))
            errormessages.map((errorMsg, index) => {
                const formattedMsg = errorMsg.replace(/\n/g, '\n     ')
                console.warn(`  ${index + 1}. ${formattedMsg}\n`)
            })
            console.log("=".repeat(80))
        }
        
    } catch (error) {
        console.error('Fehler beim Lesen der XML-Dateien:', error);
        throw error; // Fehler weitergeben, damit main korrekt wartet
    }
    
    return []
}   

function bytesToString(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let i = 0;
    let value = bytes;
    while (value >= 1024 && i < units.length - 1) {
        value /= 1024;
        i++;
    }
    return `${value.toFixed(2)} ${units[i]}`;
}



async function getdatafrom(filePath:string):Promise<string>{
    try{
        const filedata = getXMLFile(filePath)
        validateDMLStructure(filedata,filePath)
        await readdatafromBDML(filedata,filePath)

      
        return ""
    }
    catch(error){
        if(error instanceof Error){
            return `${error.message ? error.message : `Fail to process file ${filePath}:\n "unknown reason"`}`
        }
        return  `Fail to Read file ${filePath}:\n "unknown reason"`

       
    }
}

function getfilename(filenamewithpathandextetion: string): string {
    const base = path.basename(filenamewithpathandextetion);
    if (base.length <= 8) {
        return base;
    }
    return "..." + base.substring(base.length - 8);
}