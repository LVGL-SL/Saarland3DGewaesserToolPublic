
import gdal from "gdal-async";


const WGS84 = gdal.SpatialReference.fromEPSG(4326);
const ECEF = gdal.SpatialReference.fromEPSG(4978);

// Create coordinate transformation
const ECEFtransformation = new gdal.CoordinateTransformation(WGS84, ECEF);

export function wgs84ToEcef(longitude:number, latitude:number, height = 0) {

    const point = new gdal.Point(longitude, latitude, height);
    point.transform(ECEFtransformation);
    
    return {
        x: point.x,
        y: point.y,
        z: point.z
    };
} 

export function getTranform(sourceSRS:gdal.SpatialReference,taghitSRS:gdal.SpatialReference){
    return new gdal.CoordinateTransformation(sourceSRS, taghitSRS); 
}


export function getSpatialReferenceFromName(name:string){
    try {
        const srs = gdal.SpatialReference.fromUserInput(name);
        return srs;
    } catch (error) {
        console.error('Fehler beim Konvertieren:', error);
        return null;
    }

}

export function transformXYZ(transform:gdal.CoordinateTransformation,coordinate:gdal.Point):gdal.xyz
{
    const {x,y,z} = coordinate
    const point = new gdal.Point(x,y,z)

    point.transform(transform)
    return{
        x: point.x,
        y: point.y,
        z: point.z
    } as gdal.xyz
}