import WindowState from "../../../Window/WindowState"
import WaterBodyToolManager from "../../WaterBodyToolManager";
import PluginManager from "../../../PluginManager/PluginManager"

import type * as cesium from "@vcmap/cesium"
import DescriptionNode from "../../objects/DescriptionNode";
import WaterLevelStation from "../../objects/WaterLevelStation";


const COMPONENT = require("./WaterBodyControl.vue").default;


export default class WaterBodyControlState extends WindowState {
    

    constructor() {
        super(COMPONENT)
        this.isDragEnabled = false

    }
    get WaterBodyToolManager(): WaterBodyToolManager | null {
        return PluginManager.instance?.WaterBodyToolManager ?? null
    }
   _selected: boolean = false;

set selected(value: boolean) {
    if (this._selected !== value) {
        this._selected = value;
        this.isDragEnabled = value;
    }
}
get selected() {
    return this._selected;
}

waterLevel: number = 0;
startPosition: cesium.Cartesian2 | null = null;

    onDragStart(event: any) {
        if (this.WaterBodyToolManager) {
            console.log("öpö Drag",event)
            this.isDragEnabled = true;            
            const featureId = event?.feature?.id ?? null;
            if (this.WaterBodyToolManager.canchangeWaterLevel(featureId)) {
                this.selected = true;
                this.waterLevel = this.WaterBodyToolManager.waterlevel;
                this.startPosition = event.windowPosition;
            } else {
                this.isDragEnabled = false;
                this.startPosition = null;
                this.selected = false;
            }
        }
    }

    onDrag(event: any) {
        if (this.WaterBodyToolManager && this.startPosition) {
            const delta = Cesium.Cartesian2.subtract(
                this.startPosition,
                event.windowPosition,
                new Cesium.Cartesian2()
            );
            this.WaterBodyToolManager.waterlevel = this.waterLevel + delta.y/100;
        }
    }

    onDragEnd(event: any) {
        if (this.WaterBodyToolManager && this.startPosition) {
            const delta = Cesium.Cartesian2.subtract(
                this.startPosition,
                event.windowPosition,
                new Cesium.Cartesian2()
            );
            this.WaterBodyToolManager.waterlevel = this.waterLevel + delta.y/100;
            this.isDragEnabled = false;
            this.selected = false;
            this.startPosition = null;
        }
    }
   clearWaterBodies() {
        if (this.WaterBodyToolManager) {
           
            this.WaterBodyToolManager.togglePathManager()
        }
    }
    updateWaterLevel(value:number) {
        if (this.WaterBodyToolManager) {
            this.WaterBodyToolManager.waterlevel = value
        }
    }
    setOverheightto(waterLevelStation:WaterLevelStation,index:number) {
        if (this.WaterBodyToolManager) {
            this.WaterBodyToolManager.setOverheightto(waterLevelStation,index)
        }
    }
    setHeightFromWaterLevelStation(waterLevelStation:WaterLevelStation,height:number){
          if (this.WaterBodyToolManager) {
            this.WaterBodyToolManager.setHeightFromWaterLevelStation(waterLevelStation,height)
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