import gdal, { vectorTranslate } from "gdal-async"
import { generate1MeterWaypointsHaversine, generate1MeterWaypointsVincenty } from "./WaypointHelper";
import { Console } from "console";
"./helper/GeoDistanceHelper_commented";

export async function getHeightofPosition(
    vrtFilePath: string,
    point: gdal.xyz,
    band: number = 1,
    fast: boolean = false
) {
    try {
        const dataset = await gdal.openAsync(vrtFilePath);
        if (!dataset || !dataset.driver || dataset.driver.description !== "VRT") {
            throw new Error("The provided file is not a VRT dataset.");
        }
        // Nutze extractHeightDataFromCoordinates mit nur einem Punkt
        const [result] = await extractHeightDataFromCoordinates(dataset, [point], band);
        return result as {x:number,y:number,z:number}; // { x, y, z }
    } catch (error) {
        console.error(`Höhe konnte nicht extrahiert werden: ${error instanceof Error ? error.message : error}`);
        return { x: point.x, y: point.y, z: 0 };
    }
}
export async function getLowestPointOnProfile(
    vrtFilePath: string,
    startWGS84: gdal.xyz,
    endWG84: gdal.xyz,
    maxDistance: number,
    band: number = 1,
    fast: boolean = false
): Promise<gdal.xyz> {
    try {
        const dataset = await gdal.openAsync(vrtFilePath);
        if (!dataset || !dataset.driver || dataset.driver.description !== "VRT") {
            throw new Error("The provided file is not a VRT dataset.");
        }

        let waypoints: gdal.xyz[];
        if (fast) {
            waypoints = generate1MeterWaypointsHaversine(startWGS84, endWG84, maxDistance);
        } else {
            waypoints = generate1MeterWaypointsVincenty(startWGS84, endWG84, maxDistance, 0.5);
        }

        const elevationProfile = await extractHeightDataFromCoordinates(dataset, waypoints, band);

        // Filtere alle ungültigen Punkte heraus (z === 0, NaN, null oder undefined)
        const validProfile = elevationProfile.filter(
            (point) =>
                point &&
                typeof point.z === "number" &&
                !isNaN(point.z) &&
                point.z !== 0
        );

        // Suche die tiefste Stelle (kleinster z-Wert)
        let minPoint = validProfile[0];
        for (const point of validProfile) {
            if (point && typeof point.z === "number" && point.z < minPoint.z) {
                minPoint = point;
            }
        }

        // Falls kein valider Punkt gefunden wurde, gib Startpunkt mit z=0 zurück
        if (!minPoint || typeof minPoint.z !== "number" || isNaN(minPoint.z)) {
            return { x: startWGS84.x, y: startWGS84.y, z: 0 };
        }

        // Wenn Start-Höhe kleiner als tiefste gefundene Höhe, gib Startpunkt zurück
        if (typeof startWGS84.z === "number" && startWGS84.z < minPoint.z) {
            return startWGS84;
        }

        return minPoint;
    } catch (error) {
        console.error(`Lowest point could not be determined: ${error instanceof Error ? error.message : error}`);
        return { x: startWGS84.x, y: startWGS84.y, z:0};
    }
}

export async function getHeightprofile(
    vrtFilePath: string,
    startWGS84: gdal.xyz,
    endWG84: gdal.xyz,
    maxDistance: number,
    band: number = 1,
    fast: boolean = false
) {
    try {
        const dataset = await gdal.openAsync(vrtFilePath)
        if (!dataset || !dataset.driver || dataset.driver.description !== "VRT") {
            throw new Error("The provided file is not a VRT dataset.");
        }     

        if (fast) {
            const fastWaypoints = generate1MeterWaypointsHaversine(startWGS84, endWG84, maxDistance);
            const elevationProfileFast = await extractHeightDataFromCoordinates(dataset, fastWaypoints, band);
            return reduceToHighPoints(elevationProfileFast);
        } else {
            const vincentyWaypoints = generate1MeterWaypointsVincenty(startWGS84, endWG84, maxDistance, 0.5);
            const elevationProfilePrices = await extractHeightDataFromCoordinates(dataset, vincentyWaypoints, band);
            return reduceToHighPoints(elevationProfilePrices);
        }
    }
    catch (error) {
        console.error(`Higthprofie coude note creat becus of:${error instanceof Error ? error.message : error}`)
        return[]
    }

}

export async function getHeightofPoints(
    vrtFilePath: string,
    WGS84Points: gdal.xyz[],
    band: number = 1,
    
) {
    try {
        const dataset = await gdal.openAsync(vrtFilePath)
        if (!dataset || !dataset.driver || dataset.driver.description !== "VRT") {
            throw new Error("The provided file is not a VRT dataset.");
        }      
        const elevationProfilePrices = await extractHeightDataFromCoordinates(dataset, WGS84Points, band);
        return elevationProfilePrices;
        
    }
    catch (error) {
        console.error(`Higthprofie coude note creat becus of:${error instanceof Error ? error.message : error}`)
        return []
    }

}


export async function convertToVRTCoordinates(dataset: gdal.Dataset, Wgs84Coordinates: gdal.xyz[]): Promise<gdal.xyz[]> {
    try {
        const sourceSRS = gdal.SpatialReference.fromEPSG(4326);
        const targetSRS = dataset.srs;

        if (!targetSRS) {
            throw new Error("Dataset does not include an SRS, so the VRT is invalid.")
        }

        // Prüfung ob Transformation notwendig ist
        const needsTransformation = !isWGS84OrSameSRS(targetSRS);

        if (needsTransformation) {
            const transformation = new gdal.CoordinateTransformation(sourceSRS, targetSRS);

            const vrtCoordinates = Wgs84Coordinates.map(({ x, y, z }) => {
                const transformed = transformation.transformPoint(x, y, z);
                return transformed;
            });
            return vrtCoordinates;
        }

        return Wgs84Coordinates;

    } catch (error) {
        throw new Error(`${error instanceof Error ? error.message : error}`);
    }
}

function isWGS84OrSameSRS(srs: gdal.SpatialReference): boolean {
    // Prüfe EPSG Code
    const epsgCode = srs.getAuthorityCode('GEOGCS') || srs.getAuthorityCode('PROJCS');
    if (epsgCode === '4326') {
        return true;
    }

    // Prüfe WKT String auf WGS84 Bezeichnungen
    const wkt = srs.toWKT();
    if (wkt && wkt.includes('WGS84')) {
        return true;
    }

    return false;
}

export async function extractHeightDataFromCoordinates(
    dataset: gdal.Dataset,
    Wgs84Coordinates: gdal.xyz[],
    bandIndex: number = 1
): Promise<any[]> {
    const heightProfile: any[] = [];
    const band = await dataset.bands.getAsync(bandIndex);

    // Transformiere die Koordinaten erst hier ins VRT-System
    const vrtCoordinates = await convertToVRTCoordinates(dataset, Wgs84Coordinates);

    for (let i = 0; i < Wgs84Coordinates.length; i++) {
        const coordWGS84 = Wgs84Coordinates[i];
        const coordVRT = vrtCoordinates[i];
        try {
            const heightData = await getBandValueAtCoords(dataset, coordVRT, band);
            // Gebe die WGS84-Koordinaten im Ergebnis zurück
            heightProfile.push({ x: coordWGS84.x, y: coordWGS84.y, z: heightData.z });
        } catch (error) {
            console.warn(`Fehler beim Extrahieren der Höhe für Koordinate (${coordWGS84.x}, ${coordWGS84.y}): ${error}`);
            heightProfile.push({ x: coordWGS84.x, y: coordWGS84.y, z: 0 });
        }
    }

    return heightProfile;
}

export async function getBandValueAtCoords(
    dataset: gdal.Dataset,
    coordinate: gdal.xyz,
    band: gdal.RasterBand
): Promise<any> {
    const { x, y } = coordinate;

    // Koordinaten in Pixel-Koordinaten umwandeln
    const pixelCoordinates = convertToPixelCoordinates(dataset, x, y);

    // Höhenwert aus dem Band lesen (Prüfung erfolgt intern)
    const heightValue = readValueFromBand(dataset, pixelCoordinates, band);

    const result = { x, y, z: heightValue }


    return result;
}

export function convertToPixelCoordinates(dataset: gdal.Dataset, x: number, y: number): { x: number, y: number } {
    const geoTransform = dataset.geoTransform;
    if (!geoTransform) {
        throw new Error('Keine GeoTransform-Information in der Raster-Datei gefunden');
    }

    // Inverse GeoTransform berechnen (Geo -> Pixel)
    const [originX, pixelWidth, , originY, , pixelHeight] = geoTransform;
    const pixelX = Math.floor((x - originX) / pixelWidth);
    const pixelY = Math.floor((y - originY) / pixelHeight);

    return { x: pixelX, y: pixelY };
}

export function readValueFromBand(
    dataset: gdal.Dataset,
    pixelCoords: { x: number, y: number },
    band: gdal.RasterBand
): number {
    const { x: pixelX, y: pixelY } = pixelCoords;

    // Überprüfen ob Koordinaten im Raster liegen
    if (pixelX < 0 || pixelX >= dataset.rasterSize.x || pixelY < 0 || pixelY >= dataset.rasterSize.y) {
        console.log(`Koordinaten (${pixelX}, ${pixelY}) liegen außerhalb des Rasters (Size: ${dataset.rasterSize.x}x${dataset.rasterSize.y})`);
        return 0;
    }

    const value = band.pixels.get(pixelX, pixelY);

    if (value === band.noDataValue) {
        console.log(`NoDataValue (${band.noDataValue}) an Koordinate (${pixelX}, ${pixelY})`);
        return 0;
    }

    return value;
}

export function reduceToHighPoints(processedProfile: gdal.xyz[]): gdal.xyz[] {
    // First filter out invalid points like the worker does
    const validProfile = processedProfile.filter((point: gdal.xyz) => {
        // Check if point is a valid gdalxyz object
        return point &&
            typeof point.x === 'number' &&
            typeof point.y === 'number' &&
            typeof point.z === 'number' &&
            !isNaN(point.z);
    });

    // Find high points - logic inspired by worker
    let positions: gdal.xyz[] = [];
    for (let i = 0; i < validProfile.length; i++) {
        const val = validProfile[i];
        
        if (positions.length === 0) {
            positions.push(val);
            continue;
        }
        
        if (i === validProfile.length - 1) {
            positions.push(val);
            continue;
        }
        
        // High point: higher than both neighbors
        // const prev = validProfile[i - 1];
        const next = validProfile[i + 1];
          if (val && next && 
            typeof val.z === 'number' && typeof next.z === 'number' &&
            val.z > next.z) {
            const lastPosition = positions[positions.length - 1];
            if (lastPosition && typeof lastPosition.z === 'number' && val.z > lastPosition.z) {
                positions.push(val);
            }
        }
    }
    
    return positions;
}