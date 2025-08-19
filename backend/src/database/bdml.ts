import gdal from "gdal-async"
import { addWaterVertex, addAXGewaesserachse, addAXWasserlauf, addWaterPath } from "./hanlder"
import WaterVertex from "./objects/Watervertex";
import AXGewaesserachse from "./objects/AX_Gewaesserachse";
import AXWasserlauf from "./objects/AX_Wasserlauf";
import WaterPath from "./objects/Waterpath";
import { extractHeightDataFromCoordinates, getHeightofPoints } from "../helper/HieghtprofileHelper";
import { wgs84ToEcef } from "../helper/CoordinatesUtility";
import { off } from "process";



export async function readdatafromBDML(filedata: any, filePath: string): Promise<void> {
    try {
        if (filedata?.["AX_Bestandsdatenauszug"]?.["enthaelt"]?.["wfs:FeatureCollection"]?.["wfs:member"]) {
            const content = filedata["AX_Bestandsdatenauszug"]["enthaelt"]["wfs:FeatureCollection"]["wfs:member"]
            if (Array.isArray(content)) {
                for (const obj of content) {
                    for (const typename of Object.keys(obj)) {
                        await createenty(typename, obj)
                    }
                }
            }
        }

    } catch (error) {
        console.error(`Fehler beim lesen der BDML:\n${error instanceof Error ? error.message : "unbekannt"}`);
        throw error;
    }

}

async function createenty(typename: string, obj: any) {
    const entry = obj[typename]
    if (entry["@_gml:id"]) {
        await isAX_Gewaesserachse(typename, entry)
        await isAX_Wasserlauf(typename, entry)
        await isAX_Gewaesserstationierungsachse(typename,entry)
    }
    else {
        console.log(`Typename "${typename}" fehlt "@_gml:id". Übergebene Daten:\n${obj[typename]}`)
    }
}

async function isAX_Wasserlauf(typename: string, entry: any) {
    if (typename === "AX_Wasserlauf") {
        try {
            //erstelle AX Wasserlauf eintrag 
            const newEntry = {
                gmlid: entry["@_gml:id"] as string,
                name: entry["name"] || "",
                gewaesserkennzahl: parseInt(entry["gewaesserkennzahl"]) || 0
            };
            await addAXWasserlauf(newEntry);
        } catch (error) {
            console.log(`Error saving AX_Wasserlauf: ${error}`)
            throw error
        }
    }
}

async function isAX_Gewaesserachse(typename: string, entry: any) {
    if (typename === "AX_Gewaesserachse") {
        try {
            //erstelle AX_Gewaesserachse eintrag 
            const newEntry = {
                gmlid: entry["@_gml:id"] as string,
                istteilvon: entry["istTeilVon"]["@_xlink:href"].replace("urn:adv:oid:", ""),
                hatdirektunten: entry?.["hatDirektUnten"]?.["@_xlink:href"].replace("urn:adv:oid:", "") ?? null
            } as AXGewaesserachse;
            await addAXGewaesserachse(newEntry);

            await createWaterVertexPath(entry)
        }
        catch (error) {
            console.log(`Error saving AX_Gewaesserachse: ${error}`)
            throw error
        }
    }
}
async function isAX_Gewaesserstationierungsachse(typename: string, entry: any) {
      if (typename === "AX_Gewaesserstationierungsachse") {
         try {
            //erstelle AX Wasserlauf eintrag 
            const newEntry = {
                gmlid: entry["@_gml:id"] as string,
                name: entry["name"] || "",
                gewaesserkennzahl: parseInt(entry["gewaesserkennzahl"]) || 0
            };
            await addAXWasserlauf(newEntry);
        } catch (error) {
            console.log(`Error saving AX_Wasserlauf: ${error}`)
            throw error
        }

        try {
            //erstelle AX_Gewaesserachse eintrag 
            const newEntry = {
                gmlid: entry["@_gml:id"] as string,
                istteilvon: entry["@_gml:id"] as string,
                hatdirektunten: entry?.["hatDirektUnten"]?.["@_xlink:href"].replace("urn:adv:oid:", "") ?? null
            } as AXGewaesserachse;
            await addAXGewaesserachse(newEntry);

            await createWaterVertexPath(entry)
        }
        catch (error) {
            console.log(`Error saving AX_Gewaesserachse: ${error}`)
            throw error
        }
      }
}


// Vordefinierte Funktion für WaterVertex - gibt immer leere Liste zurück
// TODO: Implementierung später hinzufügen
async function createWaterVertexPath(entry: any): Promise<any[]> {
    // Hilfsfunktion: Rekursiv alle 'gml:Curve' Objekte finden
    function findAllGmlCurves(obj: any, parentSrsName?: string): any[] {
        let curves: any[] = [];
        if (!obj || typeof obj !== "object") return curves;

        // Wenn das Parent ein @_srsName hat, an die Kinder weitergeben (kopieren)
        let currentObj = obj;
        if (parentSrsName && !currentObj["@_srsName"]) {
            currentObj = { ...obj, "@_srsName": parentSrsName };
        }

        if (currentObj.hasOwnProperty("gml:Curve")) {
            let curve = currentObj["gml:Curve"];
            // Falls Curve kein @_srsName hat, von Parent übernehmen
            if (currentObj["@_srsName"] && !curve["@_srsName"]) {
                curve = { ...curve, "@_srsName": currentObj["@_srsName"] };
            }
            curves.push(curve);
        }

        for (const key of Object.keys(currentObj)) {
            const val = currentObj[key];
            if (Array.isArray(val)) {
                for (const item of val) {
                    curves = curves.concat(findAllGmlCurves(item, currentObj["@_srsName"]));
                }
            } else if (typeof val === "object" && val !== null) {
                curves = curves.concat(findAllGmlCurves(val, currentObj["@_srsName"]));
            }
        }
        return curves;
    }

    const allCurves: any[] = findAllGmlCurves(entry["position"]); 
    
    for (let curve of allCurves) {
        let srs: string = (curve as any)["@_srsName"];
        const sourceSRS = getSpatialReference(srs);
        const textlist = curve["gml:segments"]?.["gml:LineStringSegment"]?.["gml:posList"] ?? []
        if (sourceSRS) {
            let transformation = null
            const targetSRS = gdal.SpatialReference.fromEPSG(4326);
            if (!isWGS84OrSameSRS(sourceSRS)) {
                transformation = new gdal.CoordinateTransformation(sourceSRS, targetSRS)
            }


            if (typeof textlist === "string") {
                const list = textlist.trim().split(/\s+/);
                const xyList = [];
                for (let i = 0; i < list.length; i += 2) {
                    let pos = { x: Number(list[i]), y: Number(list[i + 1]), z: 0 }
                    if (transformation) {
                        pos = transformation.transformPoint(pos.x, pos.y, pos.z) as { x: number, y: number, z: number }
                    }
                    xyList.push(pos);
                }

                const xyzList = await getHeightofPoints("data/DGM/mosaic.vrt",xyList,1)

                for (let i = 0; i < xyzList.length; i++) {
                    const curent = xyzList[i]
                    try {
                        const ca3 = wgs84ToEcef(curent.y,curent.x,curent.z)
                        const newVertex = {
                            x: curent.x,
                            y: curent.y,
                            z: curent.z,
                            ecef: JSON.stringify(ca3)
                        } as Omit<WaterVertex, 'id'>;
                        await addWaterVertex(newVertex);
                    } catch (error) {
                        console.log(error instanceof Error ? error.message : "unknown error");
                        throw error;
                    }
                    if (i < xyList.length-1) {
                        const next = xyList[i + 1]
                        const newPath = {
                            fromx: curent.x,
                            fromy: curent.y,
                            istteilvon: entry["@_gml:id"] as string,
                            tox: next.x,
                            toy: next.y

                        } as Omit<WaterPath, 'id'>;
                        await addWaterPath(newPath);
                    }


                }


            }
        }
    }

    return [];
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

// Hilfsfunktion: ETRS89_UTMxx automatisch auf EPSG-Code mappen
function getSpatialReference(srs: string): any {
    // ETRS89_UTMxx → EPSG:258xx
    if (srs.startsWith("urn:adv:crs:ETRS89_UTM")) {
        const zonesting = srs.replace("urn:adv:crs:ETRS89_UTM", "")
        const zone = parseInt(zonesting)
        if (zone) {
            const epsg = 25800 + zone;
            return gdal.SpatialReference.fromEPSG(epsg);
        }
    }

    console.log("erererererrrererereroer", srs.startsWith("urn:adv:crs:ETRS89_UTM"), srs.startsWith("urn:adv:crs:"))
}