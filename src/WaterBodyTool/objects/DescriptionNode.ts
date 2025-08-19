import type * as cesium from "@vcmap/cesium"
import DescriptionPath from "./DescriptionPath"



export default class DescriptionNode {
    private _cartographic: cesium.Cartographic
    private _entity: cesium.Entity
    private _cartesian: cesium.Cartesian3
    private _position: cesium.Cartesian3
    private _nodePath: DescriptionPath
    private _informOndestroy: Set<DescriptionPath>=new Set()

    constructor(cartographic: cesium.Cartographic, nodePath: DescriptionPath) {
        this._cartographic = cartographic
        this._nodePath = nodePath
        this._cartesian = Cesium.Cartesian3.fromRadians(this._cartographic.longitude, this._cartographic.latitude)
        this._position = Cesium.Cartesian3.fromRadians(this._cartographic.longitude, this._cartographic.latitude, this._cartographic.height)
        this._entity = this.createPoint()
    }
    outlineColor = new Cesium.Color()
    pixelSize = 0
    outlineWidth = 0
    createPoint(): cesium.Entity {
        this.deactive()
        const position = new Cesium.CallbackProperty(
            (time, result: cesium.Cartesian3 | undefined) => {
                if (!result) {
                    result = Cesium.Cartesian3.clone(this.position);
                }
                else if (!Cesium.Cartesian3.equals(result, this.position)) {
                    result = Cesium.Cartesian3.clone(this.position);
                }
                return result
            }, false)
        const outlineColor = new Cesium.CallbackProperty(
            (time, result: cesium.Color | undefined) => {

                if (!result) {
                    result = Cesium.Color.clone(this.outlineColor);
                }
                else if (!Cesium.Color.equals(result, this.outlineColor)) {
                    result = Cesium.Color.clone(this.outlineColor)

                }
                return result
            }, false)
        const pixelSize = new Cesium.CallbackProperty(
            (time, result: number | undefined) => {

                if (!result) {
                    result = this.pixelSize;
                }
                else if (result !== this.pixelSize) {
                    result = this.pixelSize

                }
                return result
            }, false)
        const outlineWidth = new Cesium.CallbackProperty(
            (time, result: number | undefined) => {

                if (!result) {
                    result = this.outlineWidth;
                }
                else if (result !== this.outlineWidth) {
                    result = this.outlineWidth

                }
                return result
            }, false)
        //@ts-ignore
        const entitiy = this._nodePath.entityCollection.add(new Cesium.Entity({
            position,
            point: {
                pixelSize,
                color: this._nodePath.color,
                outlineColor,
                outlineWidth,
                // Ensures the point is always rendered on top
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
            properties: { "NodeObjektWaters": this },
        } as cesium.Entity.ConstructorOptions))

        return entitiy
    }
    updateCartesian() {
        this._cartesian = Cesium.Cartesian3.fromRadians(this._cartographic.longitude, this._cartographic.latitude)
        this.updatePOSITION()
        this._nodePath.updatePathVertices()
        for(let otherpath of this._informOndestroy.keys()){
            otherpath?.updatePathVertices()
            }
    }
    updatePOSITION() {
        this._position = Cesium.Cartesian3.fromRadians(this._cartographic.longitude, this._cartographic.latitude, this._cartographic.height)

    }

    destroy() {
        for(let otherpath of this._informOndestroy.keys()){
           otherpath?.removeEndNode(this)
        }

        this._nodePath.remove(this)
        this._nodePath.entityCollection.remove(this.entity)
    }

    set cartographic(cartographic: cesium.Cartographic) {
        this._cartographic = cartographic
        this.updateCartesian()
        
    }
    get cartographic() {
        return this._cartographic
    }

    set lat(lat: number) {
        if(!Number.isNaN(lat)){
            const newlat = Math.max(0,Math.min(lat+90,180))-90
            this.cartographic.latitude = Cesium.Math.toRadians(newlat)
            this.updateCartesian()
        }
        
    }
    get lat() {
        
        return Cesium.Math.toDegrees(this.cartographic.latitude)
    }

    set long(long: number) {
        if(!Number.isNaN(long)){
            const newlong=((long + 540) % 360) - 180;
            this.cartographic.longitude = Cesium.Math.toRadians(newlong)
            this.updateCartesian()
        }    
    }
    get long() {
        return Cesium.Math.toDegrees(this.cartographic.longitude)
    }

    get entity(): cesium.Entity {
        return this._entity
    }

    get cartesian():cesium.Cartesian3 {
        return this._cartesian
    }
    get position():cesium.Cartesian3{

        return this._position
    }

    get id(): string {
        return this._entity.id
    }
    get nodepath (){
        return this._nodePath
    }


    addtodestroyevent(otherpath:DescriptionPath){
        this._informOndestroy.add(otherpath)
    }
    removefromdestryevent(otherpath:DescriptionPath){
        this._informOndestroy.delete(otherpath)
    }


    active() {

        this.outlineColor = Cesium.Color.WHITE
        this.pixelSize = 20
        this.outlineWidth = 2
    }
    deactive() {

        this.outlineColor = Cesium.Color.BLACK
        this.pixelSize = 15
        this.outlineWidth = 2
    }

}