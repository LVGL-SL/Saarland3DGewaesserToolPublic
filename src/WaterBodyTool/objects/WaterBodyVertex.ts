import type * as cesium from "@vcmap/cesium"


export default class WaterBodyVertex {
    center: cesium.Cartographic
    normal: cesium.Cartesian3 = Cesium.Cartesian3.ZERO
    martix: cesium.Matrix4 = Cesium.Matrix4.ZERO
    inverse: cesium.Matrix4 = Cesium.Matrix4.ZERO

    left: cesium.Cartographic[] = []
    right: cesium.Cartographic[] = []
    _currentHeight = 0
    pegelstationUpdate: (() => void)[] = []


    set currentHeight(value) {
        if (this._currentHeight !== value) {
            this._currentHeight = value
            console.log("wurde geänderrt", this._currentHeight)
            if (this.pegelstationUpdate.length > 0) {
                for (let update of this.pegelstationUpdate) {
                    update()
                }
            }

        }
    }

    get currentHeight() {
        return this._currentHeight

    }

    constructor(center: cesium.Cartographic) {
        this.center = center
    }

    async setup(from: WaterBodyVertex | null, to: WaterBodyVertex | null) {
        this.martix = Cesium.Transforms.eastNorthUpToFixedFrame(this.cartestian);
        this.inverse = Cesium.Matrix4.inverse(this.martix, new Cesium.Matrix4())

        const local = Cesium.Matrix4.multiplyByPoint(this.inverse, this.cartestian, new Cesium.Cartesian3);
        const flatLocal = Cesium.Cartesian2.fromCartesian3(local, new Cesium.Cartesian2());

        if (from) {
            const localFrom = Cesium.Matrix4.multiplyByPoint(this.inverse, from.cartestian, new Cesium.Cartesian3);
            const flatFrom = Cesium.Cartesian2.fromCartesian3(localFrom, new Cesium.Cartesian2());
            const vekFrom = Cesium.Cartesian2.subtract(flatLocal, flatFrom, new Cesium.Cartesian2());
            const unitFrom = Cesium.Cartesian2.normalize(vekFrom, new Cesium.Cartesian2());

            if (to) {
                const localTo = Cesium.Matrix4.multiplyByPoint(this.inverse, to.cartestian, new Cesium.Cartesian3);
                const flatto = Cesium.Cartesian2.fromCartesian3(localTo, new Cesium.Cartesian2());
                const vekTo = Cesium.Cartesian2.subtract(flatto, flatLocal, new Cesium.Cartesian2());
                const unitTo = Cesium.Cartesian2.normalize(vekTo, new Cesium.Cartesian2());

                const cuttingAxisVector = new Cesium.Cartesian3(
                    -(unitFrom.y + unitTo.y) / 2,
                    (unitFrom.x + unitTo.x) / 2,
                    0
                );
                this.normal = cuttingAxisVector;
            } else {
                const rotatedUnitFrom = new Cesium.Cartesian3(-unitFrom.y, unitFrom.x, 0);
                this.normal = rotatedUnitFrom;
            }
        } else if (to) {
            const localTo = Cesium.Matrix4.multiplyByPoint(this.inverse, to.cartestian, new Cesium.Cartesian3);
            const flatto = Cesium.Cartesian2.fromCartesian3(localTo, new Cesium.Cartesian2());
            const vekTo = Cesium.Cartesian2.subtract(flatto, flatLocal, new Cesium.Cartesian2());
            const unitTo = Cesium.Cartesian2.normalize(vekTo, new Cesium.Cartesian2());
            const rotatedUnitFrom = new Cesium.Cartesian3(-unitTo.y, unitTo.x, 0);
            this.normal = rotatedUnitFrom;
        } else {
            this.normal = Cesium.Cartesian3.ZERO;
        }

    }

    get cartestian(): cesium.Cartesian3 {
        return Cesium.Cartographic.toCartesian(this.center)
    }



    //hieght is delta to lokal height
    getRightByHeight(hieght: number): cesium.Cartesian3 {
        return this.getPositionFromHeight(hieght, this.right)

    }
    getLeftByHeight(hieght: number) {
        return this.getPositionFromHeight(hieght, this.left)
    }

    getPositionFromHeight(heightOffset: number, array: cesium.Cartographic[]) {
        const currenthiegt = heightOffset + this.center.height
        
        this.currentHeight = currenthiegt

        if (array.length === 0) {
            const { longitude, latitude } = this.center
            return Cesium.Cartesian3.fromRadians(longitude, latitude, currenthiegt)
        }
        // height is over heights point
        else if (currenthiegt > array[array.length - 1].height) {
            const { longitude, latitude } = array[array.length - 1]
            return Cesium.Cartesian3.fromRadians(longitude, latitude, currenthiegt)
        }
        else {
            const i = array.findIndex(item => item.height > currenthiegt) ?? array.length - 1;
            const { longitude, latitude } = array[i]
            return Cesium.Cartesian3.fromRadians(longitude, latitude, currenthiegt)
        }

    }


    getCartographicByDistance(distance: number, diraction: cesium.Cartesian3) {
        if (this.martix && diraction && distance) {
            const vector = Cesium.Cartesian3.multiplyByScalar(
                diraction,
                distance,
                new Cesium.Cartesian3()
            )
            const position = Cesium.Matrix4.multiplyByPoint(
                this.martix,
                vector,
                new Cesium.Cartesian3()
            );
            const lokation = Cesium.Cartographic.fromCartesian(position)
            lokation.height = 0
            return lokation
        }
        return this.center

    }



    getellipsoidGeodesic(diraction: cesium.Cartesian3): cesium.EllipsoidGeodesic {
        const start = this.center
        const end = this.getCartographicByDistance(1, diraction)

        return new Cesium.EllipsoidGeodesic(start, end, Cesium.Ellipsoid.WGS84)

    }

    get leftDirection() {
        return this.normal

    }
    get rightDirection() {
        return Cesium.Cartesian3.negate(this.normal, new Cesium.Cartesian3())
    }


}
