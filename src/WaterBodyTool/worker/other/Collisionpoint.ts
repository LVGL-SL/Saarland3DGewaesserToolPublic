import CollisionRay from "./CollisionRay"
import * as cesium from "@vcmap/cesium"

export default class Collisionpoint{
    // schnittcordinate
    cartogafic: cesium.Cartographic
    //input verbinung nach obern
    altA: CollisionRay
    altB: CollisionRay
    //bechnetes zwichen ergbniss
    neuA: CollisionRay
    neuB: CollisionRay

    constructor(cartogafic: cesium.Cartographic, altA: CollisionRay, altB: CollisionRay, neuA: CollisionRay, neuB: CollisionRay) {
        this.cartogafic = cartogafic;
        this.altA = altA;
        this.altB = altB;
        this.neuA = neuA;
        this.neuB = neuB;
    }

    get mindistance() {
        return Math.min(this.neuA.surfaceDistance,this.neuB.surfaceDistance)
    }
}