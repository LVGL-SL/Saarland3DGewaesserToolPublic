//Translation 
import i18n from "../i18n-Language/layerMenü"
//CONSTS
const PLUGINS_NAME = "waterbodytool"
const CZML_LAYER_NAME = "waterbodytool-layer"
const CZML_LAYERITEM_NAME = "waterbodytool-plugin"


/**
 * LayerLissener
 * 
 ** Based on vcs.vcm.event.VcsEvent.
 ** Provides the Layer State event.
 ** Ensures that CzmlLayer, Widgets-Legend Plugins-GroupItem, and Czml-LayerItem exist.
 */
export default class LayerLissener {

    private _event: vcs.vcm.event.VcsEvent = new vcs.vcm.event.VcsEvent()

    private _frameworkInstance: vcs.vcm.Framework
    private _czmlLayer: vcs.vcm.layer.Czml;
    private _legendenObjekts: vcs.vcm.widgets.legend.ClusterItem;
    private _pluginsLegendObject: vcs.vcm.widgets.legend.GroupItem;
    private _czmlLayerItem: vcs.vcm.widgets.legend.LayerItem;
    private _removeCzmlListenerFunction: () => void;

    /**
     * Constructor
     * Creat CzmlLayer, Widgets-Legend Plugins-GroupItem, and Czml-LayerItem if nesseay 
     * @param frameworkInstance 
     * @param legendenObjekts 
     */
    constructor(frameworkInstance: vcs.vcm.Framework, legendenObjekts: vcs.vcm.widgets.legend.ClusterItem) {
        this._frameworkInstance = frameworkInstance
        this._legendenObjekts = legendenObjekts
        this._czmlLayer = this._getCzmlLayer()
        this._pluginsLegendObject = this._getPluginsGroupItem()
        this._czmlLayerItem = this._getCzmlLayerItem()
        this._removeCzmlListenerFunction = this._czmlLayer.stateChanged.addEventListener((e: any) => this._watchCzmlLayerState(e))
        this._pluginsLegendObject.visible = true
        this._czmlLayerItem.visible = true
    }


    destroy(): void {

        // Removes the listener for the layer state
        this._removeCzmlListenerFunction();
        this._event.destroy();
        //remove layer
        this._frameworkInstance.removeLayer(this._czmlLayer)
        //remove layer from LegedenMenue
        const index = this._pluginsLegendObject.children.indexOf(this._czmlLayerItem);
        if (index !== -1) {
            this._pluginsLegendObject.children.splice(index, 1);
        }
    }

    private _getCzmlLayer(): vcs.vcm.layer.Czml {
        const pluginsLegendObject = this._frameworkInstance.layerCollection.getByKey(CZML_LAYER_NAME) ?? this._createCzmlLayer()
        return pluginsLegendObject as vcs.vcm.layer.Czml
    }
    private _createCzmlLayer(): vcs.vcm.layer.Czml {
        const czmlLayer = new vcs.vcm.layer.Czml({
            name: CZML_LAYER_NAME,
            activeOnStartup: false,
            url: "data:application/json," + encodeURIComponent(JSON.stringify([{ "id": "document", "name": CZML_LAYER_NAME, "version": "1.0" }]))
        });
        this._frameworkInstance.layerCollection.add(czmlLayer);
        return czmlLayer
    }

    private _getPluginsGroupItem(): vcs.vcm.widgets.legend.GroupItem {
        const pluginsLegendObject = this._legendenObjekts.children.find((obj: any) => obj.name === PLUGINS_NAME) ?? this._createPluginsGroupItem();
        return pluginsLegendObject as vcs.vcm.widgets.legend.GroupItem
    }

    private _createPluginsGroupItem(): vcs.vcm.widgets.legend.GroupItem {
        const pluginLegendObject = new vcs.vcm.widgets.legend.GroupItem({
            name: PLUGINS_NAME,
            title: i18n.plugins,
            clickable: true,
            startOpen: true,
            infoUrl: "",
            infoUrlTarget: "_blank",
            cssClassName: "plugins-group",
            showInLegendIfDisabled: true,
            icon: {
                src: "../assets/pussel-444.svg",
                className: "plugins-icon",
            },
            properties: {
                hasMenu: true,
                menuEnabled: true
            }
        });
        this._legendenObjekts.children.push(pluginLegendObject);
        

        return pluginLegendObject
    }

    private _getCzmlLayerItem(): vcs.vcm.widgets.legend.LayerItem {
        const riverLayerItem = this._pluginsLegendObject.children.find((obj: any) => obj.name === CZML_LAYERITEM_NAME) ?? this._createCzmlLayerItem();
        riverLayerItem.level = 1
        return riverLayerItem as vcs.vcm.widgets.legend.LayerItem
    }
    private _createCzmlLayerItem(): vcs.vcm.widgets.legend.LayerItem {
        const czmlLayerItem = new vcs.vcm.widgets.legend.LayerItem({
            name: CZML_LAYERITEM_NAME,
            title: i18n.czmlLayer,
            infoUrl: "",
            infoUrlTarget: "",
            viewpointName: "",
            cssClassName: "waterbodytooln-layer-item",
            showInLegendIfDisabled: true,
            layerName: this._czmlLayer.name,

        } as vcs.vcm.widgets.legend.LayerItemOptions);

        this._pluginsLegendObject.children.push(czmlLayerItem);
        //@ts-ignore
        const plugin = new vcs.vcm.widgets.legend.PluginItem(
            {plugin : "waterbodytool", 
            name: "waterbodytool",
            id: "waterbodytool",
            config: {
                title: "waterbodytool",
                showIcons: true,
                color: "#00ff00"
            }
                
            }
        )
       this._pluginsLegendObject.children.push(plugin);

        return czmlLayerItem
    }
    /**
     * Decode LayerState Enum to readable status
     */
    private _watchCzmlLayerState(state: number) {
        let status
        switch (state) {
            case vcs.vcm.layer.LayerState.ACTIVE:
                status = "active"
                break;
            case vcs.vcm.layer.LayerState.INACTIVE:
                status = "inactive"
                break;
            case vcs.vcm.layer.LayerState.LOADING:
                status = "loading"
                break;
            default:
                status = "none"
                break;
        }
        console.log("LegendeLissener: Layer is", status, "?", this._event.numberOfListeners)
        this._event.raiseEvent(status)
    }

    /**
     * Make the CzmlLayer available for other modules
     * @returns
     */
    public get layer(){
        return this._czmlLayer
    }
    // Adds the regula Funktions form VcsEvent
    /**
     * Called when the status of the layer changes.
     * @returns "active" | "inactive" | "loading" | ("none" by error) 
     */
    public addEventListener(listener: (event:string) => void): () => void {
        return this._event.addEventListener(listener)
    }
    /**
     * vcs.vcm.event.VcsEvent
     * @readonly
     */
    public get numberOfListeners() {
        return this._event.numberOfListeners
    }
    /**
     * vcs.vcm.event.VcsEvent
     * @param event 
     */
    public raiseEvent(event: any): void {
        this._event.raiseEvent(event)
    }
    /**
     * vcs.vcm.event.VcsEvent
     * @param listener 
     * @returns 
     */
    public removeEventListener(listener: (event: any) => void): boolean {
        return this._event.removeEventListener(listener)
    }
}
