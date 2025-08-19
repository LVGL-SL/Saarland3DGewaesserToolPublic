import type * as cesium from "@vcmap/cesium"
import WaterBodyVertex from "../../objects/WaterBodyVertex"

interface SearchRayObjekt {
    ellipsoidGeodesic:cesium.EllipsoidGeodesic;
    distance:number
    resolves:number[]
}
interface ResponceObjekt{
     id:number;
     highPointArry:cesium.Cartographic[]
}
const MAXDISTANCE=1000

class HighPointRaysManager {
    requests: Map<number, { resolve: (value: cesium.Cartographic[]) => void; reject: (reason?: any) => void }> = new Map()    
    SearchRay: Map<number,SearchRayObjekt> =new Map()
    responce: ResponceObjekt[] =[]
    totalrequset: number = 0
    finishedrequest: number= 0

    getHeightPointProfile(waterBodyVertex:WaterBodyVertex,diraction:cesium.Cartesian3):Promise<cesium.Cartographic[]>{
        const Promisid = this.totalrequset++
        const SearchRayid = this.totalrequset++
        const ellipsoidGeodesic = waterBodyVertex.getellipsoidGeodesic(diraction)
        this.SearchRay.set(SearchRayid,{ellipsoidGeodesic,distance:MAXDISTANCE,resolves:[Promisid]})
        
        return  new Promise<cesium.Cartographic[]>((resolve, reject) => {
            this.requests.set(Promisid, {resolve, reject});
           
        });
    }

    resolveproblems(responceObjekt: ResponceObjekt) {
    const { id, highPointArry } = responceObjekt;
    const searchRayObjekt = this.SearchRay.get(id);
    if (searchRayObjekt) {
        this.requestWorker(searchRayObjekt, highPointArry);
        this.SearchRay.delete(id)
    } else {
        const request = this.requests.get(id);
        if (request) {
            request.resolve(highPointArry); 
            this.requests.delete(id);
        }
    }
}
    
    async requestWorker(searchRayObjekt:SearchRayObjekt,highPointArry:cesium.Cartographic[]):Promise<void>{
        const awaitResposeofworker = [] as cesium.Cartographic[]
        const combindeArry = [...awaitResposeofworker,...highPointArry]
        for(let slove of searchRayObjekt.resolves){
            this.responce.push({id:slove,highPointArry:combindeArry}as ResponceObjekt)
        }
    }
    

}

///VertexCreatHelper
export function getIntersectionDirection(vecA: cesium.Cartesian3, vecB: cesium.Cartesian3): cesium.Cartesian3 {
    // Ursprung ist (0,0,0), Schnittgerade geht durch Ursprung
    return Cesium.Cartesian3.cross(vecA, vecB, new Cesium.Cartesian3());
}

export function getCartographicDistance(a: cesium.Cartographic, b: cesium.Cartographic): number {
    const geodesic = new Cesium.EllipsoidGeodesic(a, b, Cesium.Ellipsoid.WGS84);
    return geodesic.surfaceDistance;
}

export function getPointAtDistance(
    start: cesium.Cartographic,
    end: cesium.Cartographic,
    distanceMeters: number,
    ellipsoid: cesium.Ellipsoid = Cesium.Ellipsoid.WGS84
): cesium.Cartographic {
    const geodesic = new Cesium.EllipsoidGeodesic(start, end, ellipsoid);
    const totalDistance = geodesic.surfaceDistance;
    const fraction = Math.min(distanceMeters / totalDistance, 1.0);
    return geodesic.interpolateUsingFraction(fraction);
}

export function getStartEndFromMatrixAndDirection(
    position: cesium.Cartesian3,
    direction: cesium.Cartesian3,
    distanceMeters: number,
    ellipsoid: cesium.Ellipsoid = Cesium.Ellipsoid.WGS84
): { start: cesium.Cartographic, end: cesium.Cartographic } {
    const start = Cesium.Cartographic.fromCartesian(position, ellipsoid);

    const normDir = Cesium.Cartesian3.normalize(direction, new Cesium.Cartesian3());
    const scaledDir = Cesium.Cartesian3.multiplyByScalar(normDir, distanceMeters, new Cesium.Cartesian3());
    const endCartesian = Cesium.Cartesian3.add(position, scaledDir, new Cesium.Cartesian3());

    // Convert end position to Cartographic
    const end = Cesium.Cartographic.fromCartesian(endCartesian, ellipsoid);

    return { start, end };
}