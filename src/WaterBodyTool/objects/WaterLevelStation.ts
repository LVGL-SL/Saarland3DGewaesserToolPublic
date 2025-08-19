import type * as cesium from "@vcmap/cesium"
import VcsMapGlobalAccess from "../../PluginManager/VcsMapGlobalAccess"
import WaterBodyPath from "./WaterBodyPath"
import { distance } from "ol/coordinate"
import WaterBodyVertex from "./WaterBodyVertex"
export interface Pegeldata {
    "MSTBEM": string
    "PGNP": number//in m over nn
    "long": number
    "lat": number
    "h1": number //in cm
    "h2": number //in cm
    "h3": number //in cm
    "h4": number //in cm
    "quasigeoidheight": number //in m

}


export default class WaterLevelStation {
    name: string
    center: cesium.Cartographic
    warn: number[] = []
    ray: cesium.Ray
    waterlevel = 0
    warnindex = -1
    position: cesium.Cartesian3
    color: cesium.Color = Cesium.Color.WHITE
    entity: cesium.Entity
    entityCollection: cesium.EntityCollection
    selceedVertex: WaterBodyVertex | null = null
    totalheight: number = 0
    constructor(pegeldata: Pegeldata, entityCollection: cesium.EntityCollection) {
        this.name = pegeldata.MSTBEM
        this.entityCollection = entityCollection
        const height = pegeldata.PGNP - 0 //pegeldata.quasigeoidheight
        this.center = Cesium.Cartographic.fromDegrees(pegeldata.long, pegeldata.lat, height)
        this.position = Cesium.Cartographic.toCartesian(this.center)
        this.warn = [pegeldata.h1 / 100, pegeldata.h2 / 100, pegeldata.h3 / 100, pegeldata.h4 / 100]
        for (let i = 0; i < this.warn.length; i++) {
            if (this.warn[i] <= 0) {
                this.warn.splice(i, 1)
                i--
            }
        }
        this.warn = this.warn.sort((a, b) => a - b)
        const cartographic = Cesium.Cartographic.clone(this.center)
        cartographic.height = 0
        const raystart = Cesium.Cartesian3.fromElements(0, 0, 0)
        const diraction = Cesium.Cartesian3.normalize(raystart, new Cesium.Cartesian3)
        this.ray = new Cesium.Ray(raystart, diraction)



        this.entity = this.createWallEntity()




    }
    get cartesian() {
        return Cesium.Cartographic.toCartesian(this.center)
    }

    checkforcolission(waterBodyVertexs: WaterBodyVertex[]): boolean {
        let distance = Number.POSITIVE_INFINITY
        let selceedVertex: WaterBodyVertex | null = null
        for (let vetex of waterBodyVertexs) {
            const cd = Cesium.Cartesian3.distance(this.cartesian, vetex.cartestian)
            if (cd < distance) {
                distance = cd
                selceedVertex = vetex

            }

        }
        if (selceedVertex) {
            if (distance < 100) {
                selceedVertex.pegelstationUpdate.push(() => { this.update() })
                this.selceedVertex = selceedVertex
                return true
            }

            else {
                this.color = this.color = Cesium.Color.DIMGREY
                this.selceedVertex = null
                return false
            }
        }
        return false

    }

    async update() {
      
        if (this.selceedVertex) {
            const height = this.selceedVertex.currentHeight
            if (this.totalheight !== height) {
                this.totalheight = height


                this.waterlevel =  this.totalheight - this.center.height
                if (this.warn.length === 0) {
                    this.warnindex = -2
                    this.color = Cesium.Color.DIMGREY
                } else {
                    const index = this.warn.findLastIndex((v) => v <= this.waterlevel)
                    if (index === -1) {
                        this.color = Cesium.Color.GREEN
                    } else if (index === 0) {
                        this.color = Cesium.Color.YELLOW
                    } else if (index === 1) {
                        this.color = Cesium.Color.ORANGE
                    } else if (index === 2) {
                        this.color = Cesium.Color.RED
                    } else {
                        this.color = Cesium.Color.VIOLET
                    }
                    this.warnindex = index
                }

                const minhiehgt = VcsMapGlobalAccess.Scene.globe.getHeight(this.center) ?? this.center.height

                if (height < minhiehgt) {
                    this.position = Cesium.Cartesian3.fromRadians(this.center.longitude, this.center.latitude, minhiehgt)
                } else {
                    this.position = Cesium.Cartesian3.fromRadians(this.center.longitude, this.center.latitude, height)
                }


            }
        }
    }






    createWallEntity(): cesium.Entity {


        // Set the position at the station's center
        const position = new Cesium.CallbackProperty((time, result: undefined | cesium.Cartesian3) => {
            if (!result) {
                result = this.position
            } else if (result !== this.position) {
                result = this.position

            }
            return result;
        }, false)

        // Create a billboard (pictogram) with a customizable color
        const color = new Cesium.CallbackProperty((time, result: undefined | cesium.Color) => {
            if (!result) {
                result = this.color
            } else if (result !== this.color) {
                result = this.color

            }
            return result;
        }, false)


        const entity = new Cesium.Entity(
            {
                position: position,
                billboard: {
                    image: 'assets/pegel.png', // z.B. './assets/waterlevel.png'
                    color: color,
                    width: 64,
                    height: 64,
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
                properties: {
                    "WaterLevelStation": this
                }
            } as unknown as cesium.Entity.ConstructorOptions
        );
        this.entityCollection.add(entity)
        return entity
    }

    getwarnheight(index:number){
        if(this.selceedVertex &&index>=0 && index<this.warn.length){
            const absoluteHeight =  this.center.height + this.warn[index]
            const relativeHeight = Math.ceil((absoluteHeight - this.selceedVertex.center.height) * 1000) / 1000
            return relativeHeight
        }
        if(this.selceedVertex &&index===-1){
            const relativeHeight = Math.ceil(( this.center.height  - this.selceedVertex.center.height) * 1000) / 1000    
            return relativeHeight
        }
        return 0
    }
    getsettoheight(hieght:number){
        if(this.selceedVertex &&!Number.isNaN(hieght)&& Number.isFinite(hieght)){
            const absoluteHeight =  this.center.height + hieght
            const relativeHeight = Math.ceil((absoluteHeight - this.selceedVertex.center.height) * 1000) / 1000
            console.log("öpö Warnhöhe Details:", {
                absoluteHeight,
                relativeHeight,
                centerHeight: this.center.height,
                selceedVertexCenterHeight: this.selceedVertex.center.height
            })
            return relativeHeight
        }
        return 0
    }

    destroy() {
        this.entityCollection.remove(this.entity)
    }


}

