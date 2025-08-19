import WindowState from "../../../Window/WindowState"
import WaterBodyToolManager from "../../WaterBodyToolManager";
import PluginManager from "../../../PluginManager/PluginManager"

import type * as cesium from "@vcmap/cesium"
import DescriptionNode from "../../objects/DescriptionNode";


const COMPONENT = require("./AwaitWaterBodyCreation.vue").default;


export default class AwaitWaterBodyCreationState extends WindowState {
    

    constructor() {
        super(COMPONENT)
        this.isDragEnabled = false

    }
    get WaterBodyToolManager(): WaterBodyToolManager | null {
        return PluginManager.instance?.WaterBodyToolManager ?? null
    }

   
   clearWaterBodies() {
        if (this.WaterBodyToolManager) {
           
            this.WaterBodyToolManager.togglePathManager()
        }
    }

    base() {
        if (this.WaterBodyToolManager) {
        }
    }


    destroy() {
        super.destroy()
    }
}