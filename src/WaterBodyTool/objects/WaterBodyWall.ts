import type * as cesium from "@vcmap/cesium";
import WaterBodyVertex from "./WaterBodyVertex";

export default class WaterBodyWall {
    wallEntity: cesium.Entity;
    entityCollection: cesium.EntityCollection;
    vertex: WaterBodyVertex;
    lissener: () => void;

    constructor(entityCollection: cesium.EntityCollection, vertex: WaterBodyVertex, event: vcs.vcm.event.VcsEvent) {
        this.entityCollection = entityCollection;
        this.vertex = vertex;
        this.wallEntity = this.createWallEntity(0); // initial mit Höhe 0
        entityCollection.add(this.wallEntity);
        this.lissener = event.addEventListener((height: number) => this.updateWall(height));
    }

    updateWall(height: number) {
        const left = this.vertex.getLeftByHeight(height);
        const right = this.vertex.getRightByHeight(height);
        const cartestianleft = Cesium.Cartographic.fromCartesian(left)
        const cartestianright = Cesium.Cartographic.fromCartesian(right)
        cartestianleft.height =0
        cartestianright.height= 0
        const leftBase =  Cesium.Cartographic.toCartesian(cartestianleft)
        const rightBase = Cesium.Cartographic.toCartesian(cartestianright)

        // Die Wand geht von leftBase zu left (oben), dann zu right (oben), dann zu rightBase (unten)
        const positions = [
            leftBase, left, right, rightBase
        ];

        // @ts-ignore
        this.wallEntity.wall.positions = new Cesium.CallbackProperty(() => positions, false);
    }

    createWallEntity(height: number): cesium.Entity {
        const left = this.vertex.getLeftByHeight(height);
        const right = this.vertex.getRightByHeight(height);
        const cartestianleft = Cesium.Cartographic.fromCartesian(left)
        const cartestianright = Cesium.Cartographic.fromCartesian(right)
        cartestianleft.height =0
        cartestianright.height= 0
        const leftBase =  Cesium.Cartographic.toCartesian(cartestianleft)
        const rightBase = Cesium.Cartographic.toCartesian(cartestianright)

        const positions = [leftBase, left, right, rightBase];

        // @ts-ignore
        return new Cesium.Entity({
            wall: {
                positions: new Cesium.CallbackProperty(() => positions, false),
                material: new Cesium.ColorMaterialProperty(Cesium.Color.fromAlpha(new Cesium.Color(0.3,0.5,1,0.75),0.75)),
                outline: false,
            },
            properties:{
                "changeWaterLevel":true
            }
        } as cesium.Entity.ConstructorOptions);
    }

    destroy() {
        this.lissener();
        this.entityCollection.remove(this.wallEntity);
    }
}