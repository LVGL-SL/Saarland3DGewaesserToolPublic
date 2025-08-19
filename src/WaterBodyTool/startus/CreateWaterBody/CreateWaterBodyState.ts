import WindowState from "../../../Window/WindowState"
import WaterBodyToolManager from "../../WaterBodyToolManager";
import PluginManager from "../../../PluginManager/PluginManager"

import type * as cesium from "@vcmap/cesium"
import DescriptionNode from "../../objects/DescriptionNode";
import AwaitWaterBodyCreationState from "../AwaitWaterBodyCreation/AwaitWaterBodyCreationState";


const COMPONENT = require("./CreateWaterBody.vue").default;


export default class CreateWaterBodyState extends WindowState {
    seleced: DescriptionNode | null = null
    _hover: DescriptionNode | null = null
    cachedColor: cesium.Color | null = null

    constructor() {
        super(COMPONENT)
        this.isDragEnabled = false

    }
    get WaterBodyToolManager(): WaterBodyToolManager | null {
        return PluginManager.instance?.WaterBodyToolManager ?? null
    }

    onClick(event: any) {
        if (this.WaterBodyToolManager) {
            const scene = event.map.getScene() as cesium.Scene
            if (!event?.windowPosition) return;
            const position = scene.pickPosition(event.windowPosition, new Cesium.Cartesian3())
            try{
            const feature = event?.feature?.id ?? null
            if (feature) {
                const node = this.WaterBodyToolManager.isObjektWaters(feature)
                if (node) {
                    this.WaterBodyToolManager.delateNode(node)
                    return
                }
            }
        }catch(e){}finally{

            this.hover = this.WaterBodyToolManager.createNode(position) ?? null
        }
        }
    }

    onDragStart(event: any) {
        if (this.WaterBodyToolManager) {
            this.isDragEnabled = true
            const scene = event.map.getScene() as cesium.Scene
            if (!event.windowPosition) return;
            const position = scene.pickPosition(event.windowPosition, new Cesium.Cartesian3())
            const feature = event?.feature?.id ?? null
            if (feature) {
                this.seleced = this.WaterBodyToolManager.isObjektWaters(feature) ?? null
                this.WaterBodyToolManager.moveNode(position, this.seleced)
                this.hover = this.seleced

            } else {
                this.isDragEnabled = false
                this.hover = null
                this.seleced = null
            }
        }
    }

    onDrag(event: any) {
        if (this.WaterBodyToolManager) {
            if (this.seleced) {
                const scene = event.map.getScene() as cesium.Scene
                if (!event.windowPosition) return;
                const position = scene.pickPosition(event.windowPosition, new Cesium.Cartesian3())
                this.WaterBodyToolManager.moveNode(position, this.seleced)
                this.hover = this.seleced
            }
        }
    }

    onDragEnd(event: any) {
        if (this.WaterBodyToolManager) {
            if (this.seleced) {
                const scene = event.map.getScene() as cesium.Scene
                if (!event.windowPosition) return;
                const position = scene.pickPosition(event.windowPosition, new Cesium.Cartesian3())
                this.WaterBodyToolManager.moveNode(position, this.seleced)
                this.hover = this.seleced
                this.seleced = null
            }
            this.seleced = null
        }
    }

    onMove(event: any) {
        if (this.WaterBodyToolManager) {
            if (this.seleced === null) {
                const scene = event.map.getScene() as cesium.Scene
                if (!event.windowPosition) return;
                const feature = scene.pick(event.windowPosition)?.id ?? null

                const currentHover: DescriptionNode | null = this.WaterBodyToolManager.isObjektWaters(feature) ?? null
                const previousHover: DescriptionNode | null = this.hover

                if (previousHover !== currentHover) {
                    this.hover = currentHover
                }
            }
        }
    }




    selectedWaterPath(index: number) {
        if (this.WaterBodyToolManager) {
            if (typeof index === "number") {

                this.WaterBodyToolManager.selectedWaterPath(index)
            }
        }
    }
    addNodepath() {
        if (this.WaterBodyToolManager) {
            this.WaterBodyToolManager.addNodepath()
        }
    }

    removeNodepath(index: number) {
        if (this.WaterBodyToolManager) {
            if (typeof index === "number") {
                this.WaterBodyToolManager.removeNodepath(index)
            }
        }
    }

    moveUp(node: DescriptionNode) {
        if (this.WaterBodyToolManager) {
            const seleced = this.WaterBodyToolManager.selecteNodePath
            this.WaterBodyToolManager.nodePath[seleced].moveUp(node)
        }
    }

    moveDown(node: DescriptionNode) {
        if (this.WaterBodyToolManager) {
            const seleced = this.WaterBodyToolManager.selecteNodePath
            this.WaterBodyToolManager.nodePath[seleced].moveDown(node)
        }
    }
    remove(node: DescriptionNode) {
        if (this.WaterBodyToolManager) {
            const seleced = this.WaterBodyToolManager.selecteNodePath
            this.WaterBodyToolManager.nodePath[seleced].remove(node)
        }
    }
    flyToNode(node: DescriptionNode) {
        if (this.WaterBodyToolManager) {
            this.WaterBodyToolManager.flyToNode(node)
        }

    }
    menuhover(node: DescriptionNode) {
        this.hover = node
    }
    menuunhover(node: DescriptionNode) {
        if (this.hover === node) {
            this.hover = null
        }
    }
    updateNodeLat(node: DescriptionNode, value: string) {
        if (this.WaterBodyToolManager) {
            try {
                const number = Number(value) ?? Number.NaN
                node.lat = number

            }
            catch (error) { }
        }
    }
    updateNodeLong(node: DescriptionNode, value: string) {
        if (this.WaterBodyToolManager) {
            try {
                const number = Number(value) ?? Number.NaN
                node.long = number

            }
            catch (error) { }
        }
    }
    createWaterBodies() {
        if (this.WaterBodyToolManager) {
            this.seleced = null
            this.hover = null
            this.WaterBodyToolManager.togglePathManager()
        }
    }
    saveNodepath(){
        if (this.WaterBodyToolManager) {
            this.WaterBodyToolManager.saveNodepath()           
        }
    }
    loadNodepath(event:any){
         if (this.WaterBodyToolManager) {
              this.WaterBodyToolManager.loadNodepath(event)     
        }
    }
    base() {
        if (this.WaterBodyToolManager) {
        }
    }

    set hover(hover: DescriptionNode | null) {
        if (this._hover !== hover) {
            this._hover?.deactive()
            this._hover = hover
            this._hover?.active()
            this.isDragEnabled = this._hover !== null
        }
    }
    get hover() {
        return this._hover
    }

    destroy() {
        this.seleced = null
        this.hover = null
        super.destroy()
    }
}