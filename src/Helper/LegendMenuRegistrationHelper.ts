import config from "../../config.json"
const name = config.name
import i18n from "../i18n-Language/layerMenü"
//OLD VCS - Import 
type ClusterItem = vcs.vcm.widgets.legend.ClusterItem
type Layer = vcs.vcm.layer.Layer 
type LayerItemOptions = vcs.vcm.widgets.legend.LayerItemOptions
type LayerItem = vcs.vcm.widgets.legend.LayerItem
const LayerItem = vcs.vcm.widgets.legend.LayerItem
type GroupItem = vcs.vcm.widgets.legend.GroupItem
const GroupItem = vcs.vcm.widgets.legend.GroupItem

/**
 *  Create or gets pluginsLegendObject 
 * 
 * @param legendenObjekts 
 * @returns 
 * 
 * vcs.vcm.widgets.legend.GroupItem
 */
export function getPluginsGroupItem(legendenObjekts: ClusterItem): GroupItem {
    const pluginsLegendObject = legendenObjekts.children.find((obj: any) => obj.name === name) ?? _createPluginsGroupItem(legendenObjekts);
    return pluginsLegendObject as GroupItem
}

function _createPluginsGroupItem(legendenObjekts: ClusterItem): GroupItem {
    const pluginLegendObject = new GroupItem({
        name: name,
        title: getI18nTitle("pluginName"),
        clickable: true,
        startOpen: true,
        infoUrl: "",
        infoUrlTarget: "_blank",
        cssClassName: "plugins-group",
        showInLegendIfDisabled: true,
        icon: {
            src: "../assets/water-444.svg",
            className: name.toLowerCase() + "-icon",
        },
        properties: {
            hasMenu: true,
            menuEnabled: true
        }
    });
    legendenObjekts.children.push(pluginLegendObject);


    return pluginLegendObject
}

export function getLayerItem(legendenObjekts: ClusterItem, layer: Layer): LayerItem {
    const pluginsLegendObject = getPluginsGroupItem(legendenObjekts)
    const riverLayerItem = pluginsLegendObject.children.find((obj: any) => obj.name === layer.name) ?? _createLayerItem(pluginsLegendObject, layer);
    riverLayerItem.level = 1
    return riverLayerItem as LayerItem
}
function _createLayerItem(pluginsLegendObject: GroupItem, layer: Layer): LayerItem {
    const layerItem = new LayerItem({
        name: layer.name + "-layeritem",
        title: getI18nTitle(layer.name),
        infoUrl: "",
        infoUrlTarget: "",
        viewpointName: "",
        cssClassName: "waterbodytool-layer-item",
        showInLegendIfDisabled: true,
        layerName: layer.name,
        // icon: {
        //     src: "../assets/water-444.svg",
        //     className: "waterbodytool-icon",
        // },
    } as LayerItemOptions);
 
    pluginsLegendObject.children.push(layerItem);
    layerItem.level = 1
    layerItem.visible = true
    pluginsLegendObject.visible = true
    return layerItem;
}

export function removeLayerItem(legendenObjekts: ClusterItem, layer: Layer) {
    const pluginsLegendObject = getPluginsGroupItem(legendenObjekts)
    const layerItem = getLayerItem(legendenObjekts, layer)
    const index = pluginsLegendObject.children.indexOf(layerItem);
    if (index !== -1) {
        pluginsLegendObject.children.splice(index, 1);
    }
    if (pluginsLegendObject.children.length === 0) {
        const index = legendenObjekts.children.indexOf(pluginsLegendObject)
        legendenObjekts.children.splice(index, 1);
        pluginsLegendObject.destroy()
    }
    layerItem.destroy()
}
export function destroyPluginsGroupItem(legendenObjekts: ClusterItem) {
   const pluginsLegendObject = getPluginsGroupItem(legendenObjekts)
   const index = legendenObjekts.children.indexOf(pluginsLegendObject)
   if (index !== -1) {
      legendenObjekts.children.splice(index, 1);
   }
   pluginsLegendObject.children.forEach((child)=>child.destroy())
   pluginsLegendObject.destroy()
}



function getI18nTitle(key: string): object | string {
    if (i18n.hasOwnProperty(key) && i18n[key]) {
        return i18n[key];
    }
    return key;
}


