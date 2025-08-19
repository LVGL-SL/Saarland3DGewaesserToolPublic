import WaterBodyVertex from "./WaterBodyVertex";
import type * as cesium from "@vcmap/cesium"


export default class WaterBodyPath {
    plainentitiy: cesium.Entity
    waterlevel = 0
    from: WaterBodyVertex
    to: WaterBodyVertex
    entityCollection: cesium.EntityCollection
    polygonHierarchy: cesium.PolygonHierarchy = new Cesium.PolygonHierarchy()
   
    lissener: () => void;
    constructor(entityCollection: cesium.EntityCollection, from: WaterBodyVertex, to: WaterBodyVertex, event: vcs.vcm.event.VcsEvent) {
        this.plainentitiy = this.ceatplainentity()
        this.entityCollection = entityCollection
        entityCollection.add(this.plainentitiy)
        this.from = from
        this.to = to
        this.lissener = event.addEventListener((hieght: number) => this.update(hieght))

    }

    update(hieght: number) {
        if (hieght !== this.waterlevel) {
            this.waterlevel = hieght
            const A = this.from.getLeftByHeight(hieght)
            const B = this.to.getLeftByHeight(hieght)
            const C = this.to.getRightByHeight(hieght)
            const D = this.from.getRightByHeight(hieght)
            this.polygonHierarchy = new Cesium.PolygonHierarchy([A, B, C, D])
        }
    }


    ceatplainentity(): cesium.Entity {
        const hierarchy = new Cesium.CallbackProperty((time, result: undefined | cesium.PolygonHierarchy) => {
            if (!result) {
                result = this.polygonHierarchy
            } else if (result !== this.polygonHierarchy) {
                result = this.polygonHierarchy

            }
            return result;
        }, false)
        //@ts-ignore
        return new Cesium.Entity({
            polygon: {
                hierarchy: hierarchy,
                perPositionHeight: true,
                material: new Cesium.ColorMaterialProperty(Cesium.Color.fromAlpha(new Cesium.Color(0.5,0.6,1,0.75), 0.75)),
                outline: false,
            },
            properties:{
                "changeWaterLevel":true
            }
        } as cesium.Entity.ConstructorOptions)
    }


    destroy() {
        this.lissener()
        this.entityCollection.remove(this.plainentitiy)
    }

    get triangels(){
        const a = Cesium.Cartographic.toCartesian(this.from.left[0])
        const b = Cesium.Cartographic.toCartesian(this.from.right[0])
        const c = Cesium.Cartographic.toCartesian(this.to.left[0])
        const d = Cesium.Cartographic.toCartesian(this.to.right[0])
        return [[a,c,b],[c,d,b]] as [cesium.Cartesian3,cesium.Cartesian3,cesium.Cartesian3][]
    }
}