import * as gdal from 'gdal-async'
import dotenv from"dotenv"
import * as fs from 'fs';
import * as path from 'path';
dotenv.config()
/**
 * Erstellt ein VRT (virtuelles Raster) aus mehreren GeoTIFF-Dateien.
 * @param inputFiles Array der Eingabe-Dateipfade (GeoTIFFs)
 * @param outputVRT Pfad zur Ausgabedatei (VRT)
 * @param args optionale Argumente für buildVRT (z.B. ['-separate'])
 */
export async function buildVRT(inputFiles: string[], outputVRT: string, args?: string[],options?:gdal.UtilOptions) {
    return new Promise<void>((resolve, reject) => {
        gdal.buildVRT(
            outputVRT,
            inputFiles,
            args,
            options,
        );
    });
}

export function creatVRT(){
    const DEFAULTPATH = "data/DGM"
    const VRTFILENAME = "mosaic.vrt"
    const importFolder = process.env.DGM_FOLDERNAME
    const folderPath = path.join(DEFAULTPATH, importFolder ?? '');

    const vrtPath = path.join(DEFAULTPATH, VRTFILENAME);
    if (fs.existsSync(vrtPath)) {
        console.log(`Die Datei ${vrtPath} existiert bereits.`);
        return
    } 
    
    const files = fs.readdirSync(folderPath)
        .filter(file =>
            file.toLowerCase().endsWith('.tif') &&
            fs.statSync(path.join(folderPath, file)).isFile()
        )
        .map(file => path.join(folderPath, file));

    
    const validFiles: string[] = [];
    const invalidFiles: string[] = [];

    for (const file of files) {
        try {
            const ds = gdal.open(file);
            if (ds.driver.description === 'GTiff') {
                validFiles.push(file);
            } else {
                invalidFiles.push(file);
            }
            ds.close();
        } catch (err) {
            invalidFiles.push(file);
        }
    }

    if (invalidFiles.length > 0) {
        console.warn('Warnung: Die folgenden Dateien sind keine gültigen GeoTIFFs oder konnten nicht geöffnet werden:');
        invalidFiles.map(f => console.warn(f));
    }

    buildVRT(validFiles, vrtPath)
        .then(() => {
            console.log(`VRT-Datei erfolgreich erstellt: ${vrtPath}`);
        })
        .catch((err) => {
            console.error('Fehler beim Erstellen der VRT-Datei:', err);
        });
    // validFiles enthält jetzt nur gültige GeoTIFF-Dateien

}



