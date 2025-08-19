import * as cesium from "@vcmap/cesium"

interface gdalxyz {
    x:number, //latitude
    y:number, //longitude
    z:number //height
}

export function cartesian3ToCartesian4(Cesium:any, Cartesian3: cesium.Cartesian3,w:number): cesium.Cartesian4 {	
    return new Cesium.Cartesian4(Cartesian3.x, Cartesian3.y, Cartesian3.z, w);
}

export function gdalxyzToCartesian3(Cesium:any, gdalxyz: gdalxyz): cesium.Cartesian3 {
    const cartographic = Cesium.Cartographic.fromDegrees(gdalxyz.y, gdalxyz.x, gdalxyz.z, new Cesium.Cartographic())
    const cartesian3 = Cesium.Ellipsoid.WGS84.cartographicToCartesian(cartographic);
    return cartesian3;
}
export function gdalxyzToCartesian4(Cesium:any, gdalxyz: gdalxyz): cesium.Cartesian4 {
    return cartesian3ToCartesian4(Cesium,gdalxyzToCartesian3(Cesium,gdalxyz), gdalxyz.z);
}
