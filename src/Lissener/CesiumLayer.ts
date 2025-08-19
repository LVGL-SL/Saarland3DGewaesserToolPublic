import { removeLayerItem, getLayerItem } from "../Helper/LegendMenuRegistrationHelper";
import * as cesium from "@vcmap/cesium"
import EnhancedCompositeEntityCollection from "./EnhancedCompositeEntityCollection";
import VcsMapGlobalAccess from "../PluginManager/VcsMapGlobalAccess";
//!!!OLD VCS - Import constance
type VcsEvent =  vcs.vcm.event.VcsEvent
const VcsEvent =  vcs.vcm.event.VcsEvent
const DataSource = vcs.vcm.layer.DataSource
type Framework = vcs.vcm.Framework;
const Framework = vcs.vcm.Framework;


export default class CesiumLayer extends DataSource {
    private _event: VcsEvent = new VcsEvent()
    private _removeStatusListenerFunction: () => void;
    private _primitives = new Cesium.PrimitiveCollection();
    entities = new EnhancedCompositeEntityCollection() //enable mulpite entitiycollations 
    //private _globclipinng = new Cesium.ClippingPlaneCollection();
 
    constructor(LayerName:string,activeOnStartup:boolean=false){
        super({
            name: LayerName,
            activeOnStartup: activeOnStartup,
        })
        this._removeStatusListenerFunction = this.stateChanged.addEventListener((e: any) => this._watchLayerState(e))
        VcsMapGlobalAccess.Framework.addLayer(this)
        VcsMapGlobalAccess.registerLayer(this)
        VcsMapGlobalAccess.Scene.primitives.add(this._primitives)
       
        

        this._primitives.show = this.active


    }

    destroy(): void {
        VcsMapGlobalAccess.Framework.removeLayer(this)
        VcsMapGlobalAccess.removeLayerItem(this)
        VcsMapGlobalAccess.Scene.primitives.remove(this._primitives)
        this._removeStatusListenerFunction()

        super.destroy()
    }

    private _watchLayerState(state: number) {
        let status = VcsMapGlobalAccess.getLayerStateName(state)
        if(status ==="ACTIVE"){
            this._primitives.show = true
        }
        else{
            this._primitives.show = false
        }
        // Szene reload
        VcsMapGlobalAccess.Scene.requestRender();
        this._event.raiseEvent(status)
    }

    public get primitives(){
        return this._primitives
    }  

    /**
     * Called when the status of the layer changes.
     * @returns "INACTIVE" | "ACTIVE" | "LOADING" | ("NONE" by error) 
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

