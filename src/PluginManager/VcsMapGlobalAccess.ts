
import type * as cesium from "@vcmap/cesium"
import { getLayerItem, removeLayerItem } from "../Helper/LegendMenuRegistrationHelper"


export default class VcsMapGlobalAccess {
    static get Framework(): vcs.vcm.Framework {
        return vcs.vcm.Framework.getInstance()
    }
    static get CesiumMap() {
        return this.Framework.getActiveMap() as vcs.vcm.maps.CesiumMap
    }
    static get EventHandler() {
        return this.Framework.eventHandler
    }
      static get Viewer(): cesium.Viewer {
        return this.CesiumMap.getViewer()
    }
    static get Scene(): cesium.Scene {
        return this.CesiumMap.getScene() as cesium.Scene
    }
    static get Camera(): cesium.Camera {
        return this.CesiumMap.getScene().camera as cesium.Camera
    }
    static get LegendenObjekts() {
        return this.Framework.getWidgetByType('vcs.vcm.widgets.legend.Legend').cluster[0] as vcs.vcm.widgets.legend.ClusterItem
    }

    public static registerLayer(layer: vcs.vcm.layer.Layer) {
        getLayerItem(this.LegendenObjekts, layer)

    }

    public static removeLayerItem(layer: vcs.vcm.layer.Layer) {
        removeLayerItem(this.LegendenObjekts, layer)
    }

    public static getLayerStateName(type: number): string {
        const LAYER_STATE_TYPE = vcs.vcm.layer.LayerState;
        const LAYER_STATE_MAP = Object.entries(LAYER_STATE_TYPE);
        return LAYER_STATE_MAP.find(
            ([key, value]) => value === type
        )?.[0] || 'NONE';
    }
}

