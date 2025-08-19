import type * as cesium from "@vcmap/cesium";


 export default class CollisionRay {
    //heigth ist 0
    ellipsoidGeodesic: cesium.EllipsoidGeodesic
    distance:number
    constructor (ellipsoidGeodesic:cesium.EllipsoidGeodesic,distance:number){
        this.ellipsoidGeodesic = ellipsoidGeodesic
        this.distance = distance
    }
    get start() {
        return this.ellipsoidGeodesic.start
    }
    get end() {
        return this.ellipsoidGeodesic.end
    }
    get startC3() {
        return Cesium.Cartographic.toCartesian(this.start)
    }
    get endC3() {
        return Cesium.Cartographic.toCartesian(this.end)
    }

    get direction() {

        const cartographic = this.ellipsoidGeodesic.interpolateUsingSurfaceDistance(1000)
        const position = Cesium.Cartographic.toCartesian(cartographic)
        return Cesium.Cartesian3.subtract(position, this.startC3, new Cesium.Cartesian3())

    }
    get normalizedstart() {
        return Cesium.Cartesian3.normalize(this.startC3, new Cesium.Cartesian3())
    }
    get normalizedDirection() {
        return Cesium.Cartesian3.normalize(this.direction, new Cesium.Cartesian3())

    }
    get plain():[cesium.Cartesian3,cesium.Cartesian3] {
        return [this.normalizedstart, this.normalizedDirection]
    }

    get surfaceDistance(){
        return this.ellipsoidGeodesic.surfaceDistance
    }
    interpolateUsingSurfaceDistance(distance: number){
       return this.ellipsoidGeodesic.interpolateUsingSurfaceDistance(distance)
    }
}
