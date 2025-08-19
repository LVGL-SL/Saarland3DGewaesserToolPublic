import * as cesium from "@vcmap/cesium"
import WaterBodyToolManager from "../../WaterBodyToolManager"
import WaterBodyVertex from "../../objects/WaterBodyVertex"
import CollisionRay from "./CollisionRay"
import Collisionpoint from "./Collisionpoint"
import VcsMapGlobalAccess from "src/PluginManager/VcsMapGlobalAccess"


function computeVertx(self: WaterBodyToolManager) {
    console.log("ÖPÖ WaterBodyToolManager", self)
    const nodes = self.nodePath[0].path

    self.ceatelayer.removeAll()
    if (!self.layer.entities.containsCollection(self.ceatelayer)) {
        self.layer.entities.addCollection(self.ceatelayer)
        console.log("ÖPÖ add Layer", self.ceatelayer)
    }
    //Crate Vertexies
    const vetexis = [] as WaterBodyVertex[]
    for (let node of nodes) {
        vetexis.push(new WaterBodyVertex(node.cartographic))
    }
    for (let i = 0; i < vetexis.length; i++) {
        const from: WaterBodyVertex | null = getWaterBodyVertexfromArry(vetexis, i - 1)
        const to: WaterBodyVertex | null = getWaterBodyVertexfromArry(vetexis, i + 1)
        vetexis[i].setup(from, to)
    }
    console.log("ÖPÖ vetexis", vetexis)

    //vertesies ar now stetupde
    for (let vertex of vetexis) {
        const leftdiraction = vertex.leftDirection
        const rightdiration = vertex.rightDirection
        const rayleft = vertex.getellipsoidGeodesic(leftdiraction)
        const rayright = vertex.getellipsoidGeodesic(rightdiration)

        createPoint(self.ceatelayer, rayleft.interpolateUsingSurfaceDistance(1000), Cesium.Color.ORANGE)
        createPoint(self.ceatelayer, rayright.interpolateUsingSurfaceDistance(1000), Cesium.Color.LIMEGREEN)
        createLine(self.ceatelayer, vertex.center, rayleft.interpolateUsingSurfaceDistance(1000), Cesium.Color.ORANGE)
        createLine(self.ceatelayer, vertex.center, rayright.interpolateUsingSurfaceDistance(1000), Cesium.Color.LIMEGREEN)
    }




    const compare: CollisionRay[] = []
    for (let v of vetexis) {
        compare.push(
            new CollisionRay(v.getellipsoidGeodesic(v.leftDirection), 1000)

        )
        compare.push(
            new CollisionRay(v.getellipsoidGeodesic(v.rightDirection), 1000)

        )

    }

    const levelTree: Array<Collisionpoint[]> = []
    //Füreaus für jedes level
    let level = 0

    levelTree[level] = [];
    for (let i = 0; i < compare.length; i++) {
        const rayA = compare[i]
        for (let j = i + 1; j < compare.length; j++) {
            const rayB = compare[j]
            if (!Cesium.Cartesian3.equals(rayA.direction, Cesium.Cartesian3.negate(rayB.direction,new Cesium.Cartesian3()))) {
                const cartographic = getPlanesIntersectionCartographic(rayA.plain, rayB.plain);
                if (cartographic) {
                    const elipA = checkIfRightDirection(rayA.start, cartographic)
                    const elipB = checkIfRightDirection(rayB.start, cartographic)
                    if (elipA && elipB) {

                        const rayAnew = new CollisionRay(elipA, rayA.distance)
                        const rayBnew = new CollisionRay(elipB, rayB.distance)

                        const compareA = rayA.interpolateUsingSurfaceDistance(rayAnew.surfaceDistance)
                        const compareB = rayB.interpolateUsingSurfaceDistance(rayBnew.surfaceDistance)
                        if (isCartographicWithinThreshold(compareA, cartographic) &&
                            isCartographicWithinThreshold(compareB, cartographic)
                        ) {
                            levelTree[level].push(new Collisionpoint(cartographic, rayA, rayB, rayAnew, rayBnew))
                            createPoint(self.ceatelayer, cartographic, Cesium.Color.CORNFLOWERBLUE)
                        }
                    }
                }
            }
        }
    }


    // Sort so that index 0 is the smallest mindistance, last index is the largest
    levelTree[level].sort((a, b) => a.mindistance - b.mindistance);
    console.log("äüä", levelTree[level])
    for (let i = 0; i < levelTree[level].length; i++) {
        const { altA: A, altB: B } = levelTree[level][i]

        for (let j = i + 1; j < levelTree[level].length; j++) {
            const { altA: AA, altB: BB } = levelTree[level][j]
            if (AA === A || BB === A || AA === B || BB === B) {
                levelTree[level].splice(j, 1);
                j--;
            }
        }
    }
    console.log("äüä", levelTree[level])

    for (let i = 0; i < levelTree[level].length; i++) {
        const { cartogafic, altA, altB, neuA, neuB } = levelTree[level][i]
        createPoint(self.ceatelayer, neuA.end, Cesium.Color.BURLYWOOD);
        createLine(self.ceatelayer, neuA.start, neuA.end, Cesium.Color.RED);
        createLine(self.ceatelayer, neuB.start, neuB.end, Cesium.Color.RED);
        const mindistance = Math.min(neuA.surfaceDistance, neuB.surfaceDistance);
        if (mindistance < 1000) {
            const smallHalfNormalVector =
                Cesium.Cartesian3.normalize(
                    Cesium.Cartesian3.add(
                        altA.direction,
                        altB.direction,
                        new Cesium.Cartesian3()
                    ),
                    new Cesium.Cartesian3()
                )
            const pos = Cesium.Cartesian3.add(neuA.endC3, smallHalfNormalVector, new Cesium.Cartesian3())
            const cartographicB = Cesium.Cartographic.fromCartesian(pos);
            cartographicB.height = 0;
            const ray = new Cesium.EllipsoidGeodesic(cartogafic, cartographicB);
            createLine(self.ceatelayer, cartogafic, ray.interpolateUsingSurfaceDistance(1000 - mindistance), Cesium.Color.SALMON);
        }

    }

    level++

    console.log(levelTree)



    // for (let i = 0; i < vetexis.length; i++) {
    //     for (let j = i + 1; j < vetexis.length; j++) {
    //         const vetexA = getWaterBodyVertexfromArry(vetexis, i);
    //         const vetexB = getWaterBodyVertexfromArry(vetexis, j);
    //         if (vetexA && vetexB) {
    //             const nomalplaneA = createPlaneNormals(vetexA, vetexA.leftDirection);
    //             const nomalplaneB = createPlaneNormals(vetexB, vetexB.leftDirection);
    //             const DiractionA = nomalplaneA[1];
    //             const DiractionB = nomalplaneB[1];
    //             const cartographic = getPlanesIntersectionCartographic(nomalplaneA, nomalplaneB);
    //             if (cartographic) {
    //                 const ellipsoidGeodesicA = checkIfRightDirection(vetexA.center, cartographic)
    //                 const ellipsoidGeodesicB = checkIfRightDirection(vetexB.center, cartographic)



    //                 if (ellipsoidGeodesicA && ellipsoidGeodesicB) {
    //                     const rayA = vetexA.getellipsoidGeodesic(vetexA.leftDirection)
    //                     const compareA = rayA.interpolateUsingSurfaceDistance(ellipsoidGeodesicA.surfaceDistance)

    //                     const rayB = vetexB.getellipsoidGeodesic(vetexB.leftDirection)
    //                     const compareB = rayB.interpolateUsingSurfaceDistance(ellipsoidGeodesicB.surfaceDistance)
    //                     if (
    //                         Cesium.Cartesian3.distance(Cesium.Cartographic.toCartesian(compareA), Cesium.Cartographic.toCartesian(cartographic)) < 1 &&
    //                         Cesium.Cartesian3.distance(Cesium.Cartographic.toCartesian(compareB), Cesium.Cartographic.toCartesian(cartographic)) < 1
    //                     ) {

    //                         console.log("öpö punkte schneiden sich");
    //                         createPoint(self.ceatelayer, cartographic, Cesium.Color.CORNFLOWERBLUE);
    //                         createLine(self.ceatelayer, ellipsoidGeodesicA.start, ellipsoidGeodesicA.end, Cesium.Color.CORNFLOWERBLUE);
    //                         createLine(self.ceatelayer, ellipsoidGeodesicB.start, ellipsoidGeodesicB.end, Cesium.Color.CORNFLOWERBLUE);

    //                         const mindistance = Math.min(ellipsoidGeodesicB.surfaceDistance, ellipsoidGeodesicA.surfaceDistance);
    //                         if (mindistance < 1000) {
    //                             const smallHalfNormalVector =
    //                                 Cesium.Cartesian3.normalize(
    //                                     Cesium.Cartesian3.add(
    //                                         DiractionA,
    //                                         DiractionB,
    //                                         new Cesium.Cartesian3()
    //                                     ),
    //                                     new Cesium.Cartesian3()
    //                                 )
    //                             const cartographicB = Cesium.Cartographic.fromCartesian(smallHalfNormalVector);
    //                             cartographicB.height = 0;
    //                             const ray = new Cesium.EllipsoidGeodesic(cartographic, cartographicB);
    //                             createLine(self.ceatelayer, cartographic, ray.interpolateUsingSurfaceDistance(1000 - mindistance), Cesium.Color.SALMON);
    //                         }
    //                     } else {
    //                         console.log("öpö punkte schneiden sich nicht");
    //                         createPoint(self.ceatelayer, cartographic, Cesium.Color.RED);
    //                         createLine(self.ceatelayer, ellipsoidGeodesicA.start, ellipsoidGeodesicA.end, Cesium.Color.RED);
    //                         createLine(self.ceatelayer, ellipsoidGeodesicB.start, ellipsoidGeodesicB.end, Cesium.Color.RED);
    //                     }
    //                 } else {
    //                     console.log("öpö punkte schneiden sich nicht");
    //                     createPoint(self.ceatelayer, cartographic, Cesium.Color.RED);
    //                 }
    //             }
    //         }
    //     }
    // }

}

function createPoint(entityCollection: cesium.EntityCollection, cartographic: cesium.Cartographic, color = Cesium.Color.RED) {
    const height = VcsMapGlobalAccess.Scene.globe.getHeight(cartographic)
    entityCollection.add(new Cesium.Entity({
        position: Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, height),
        point: {
            pixelSize: 10,
            color,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2
        }
    }))
}
function createLine(entityCollection: cesium.EntityCollection, from: cesium.Cartographic, to: cesium.Cartographic, color = Cesium.Color.RED) {
    entityCollection.add(new Cesium.Entity({
        polyline: {
            positions: [
                Cesium.Cartesian3.fromRadians(from.longitude, from.latitude),
                Cesium.Cartesian3.fromRadians(to.longitude, to.latitude)
            ],
            clampToGround: true,
            width: 3,
            material: color
        }
    }))
}

function getWaterBodyVertexfromArry(arry: WaterBodyVertex[], index: number): WaterBodyVertex | null {
    if (index >= arry.length || index < 0) {
        return null
    } else {
        return arry[index]
    }
}


function createPlaneNormals(vertex: WaterBodyVertex, direction: cesium.Cartesian3): [cesium.Cartesian3, cesium.Cartesian3] {
    console.log("createPlaneNormals")
    const ray = vertex.getellipsoidGeodesic(direction)
    const cartographic = ray.interpolateUsingSurfaceDistance(1000)
    const position = Cesium.Cartographic.toCartesian(cartographic)
    const dir = Cesium.Cartesian3.subtract(position, vertex.cartestian, new Cesium.Cartesian3())
    const N1 = Cesium.Cartesian3.normalize(vertex.cartestian, new Cesium.Cartesian3())
    const N2 = Cesium.Cartesian3.normalize(dir, new Cesium.Cartesian3())
    console.log("createPlaneNormals läuft")
    return [N1, N2]
}

function getPlanesIntersectionCartographic(
    planeA: [cesium.Cartesian3, cesium.Cartesian3],
    planeB: [cesium.Cartesian3, cesium.Cartesian3]
): cesium.Cartographic | null {
    console.log("getPlanesIntersectionCartographic")
    const crossA = Cesium.Cartesian3.cross(planeA[0], planeA[1], new Cesium.Cartesian3())
    const crossB = Cesium.Cartesian3.cross(planeB[0], planeB[1], new Cesium.Cartesian3())
    const intersectionAxis = Cesium.Cartesian3.cross(crossA, crossB, new Cesium.Cartesian3())
    const normalizeIntersection = Cesium.Cartesian3.normalize(intersectionAxis, new Cesium.Cartesian3())
    const cartographic = Cesium.Cartographic.fromCartesian(normalizeIntersection)
    cartographic.height = 0
    console.log("getPlanesIntersectionCartographic läuft", cartographic)
    return normalizeCartographic(cartographic)
}
function normalizeCartographic(cart: cesium.Cartographic): cesium.Cartographic | null {
    if (!(Number.isFinite(cart.longitude) && Number.isFinite(cart.latitude))) { return null }
    // Longitude in [-π, π]
    cart.longitude = ((cart.longitude + Math.PI) % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI) - Math.PI;
    // Latitude in [-π/2, π/2]
    cart.latitude = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cart.latitude));
    return cart;
}


function checkIfRightDirection(start: cesium.Cartographic, end: cesium.Cartographic): cesium.EllipsoidGeodesic | null {

    console.log("checkIfRightDirection")
    const postA = Cesium.Cartographic.toCartesian(start)
    const postB = Cesium.Cartographic.toCartesian(end)
    const dot1 = Cesium.Cartesian3.dot(postA, postB);
    if (dot1 > 0) {
        return new Cesium.EllipsoidGeodesic(start, end)
    }
    else {
        console.log("nichterlaubt")
        return null
    }

}


function isCartographicWithinThreshold(left: cesium.Cartographic, right: cesium.Cartographic, distanceThreshold: number = 1) {
    const A = Cesium.Cartographic.toCartesian(left)
    const B = Cesium.Cartographic.toCartesian(right)
    return Cesium.Cartesian3.distance(A, B) < distanceThreshold
}