import { deactivateLeftDrag } from "./InteractionHelpers/CesiumCamercontrolHelper";
import { getReadableEventTypeName } from "./InteractionHelpers/InteractionHelper"
import WindowManager from "../Window/WindowManager";
import * as cesium from "@vcmap/cesium"
//!!!OLD VCS - Import constance
import VcsMapGlobalAccess from "../PluginManager/VcsMapGlobalAccess";
const EVENT_TYPE_TYPE = vcs.vcm.interaction.EventType
const MODIFICATION_KEY_TYPE = vcs.vcm.interaction.ModificationKeyType;
const VcsEvent = vcs.vcm.event.VcsEvent
const AbstractInteraction = vcs.vcm.interaction.AbstractInteraction


/**
 *  InteractionLissner
 ** Based on vcs.vcm.event.VcsEvent.
 ** Provides Click Drage Move Events 
 */
export default class InteractionLissner extends AbstractInteraction {
    private _windowManager: WindowManager
    private _removeEventListener: () => void = () => { };
    private _resumeCameraMovement: (() => void) | null = null;
    private _isDragEnabled: boolean = false

    constructor(
        windowManager: WindowManager
    ) {
        super();
        this._windowManager = windowManager
        // definition of all Events for full Support 
        this._defaultActive = EVENT_TYPE_TYPE.ALL;
        this._defaultModificationKey = MODIFICATION_KEY_TYPE.ALL;
        // First element of the chain that contains all event content 
        this._removeEventListener = VcsMapGlobalAccess.EventHandler.addPersistentInteraction(this, 3);   
        // finally set listener to Active 
        this.setActive();
    }

    async pipe(event: vcs.vcm.interaction.Event) {
        if (this._isDragEnabled && event.type === 512/*DRAGEND*/) {
            this._cesiumLeftDragPrevent()
        }
        const typeName = getReadableEventTypeName(event.type)
        this._windowManager.handleInteraction({ ...event, typeName })
        event.stopPropagation = true
        return event;
    }


    private _cesiumLeftDragPrevent() {
        if (this._resumeCameraMovement === null) {
            this._resumeCameraMovement = deactivateLeftDrag()
        }
        console.log("InteractionLissner stop camera")
    }

    private _cesiumLeftDragAllow() {
        if (this._resumeCameraMovement !== null) {
            this._resumeCameraMovement();
            this._resumeCameraMovement = null;
        }
        console.log("InteractionLissner free camera");
    }

    get isDragEnabled(){
        return this._isDragEnabled
    }
    set isDragEnabled(value:boolean){
        if (value) {
            this._cesiumLeftDragPrevent();
        } else {
            this._cesiumLeftDragAllow();
        }
        this._isDragEnabled = value;
    }

    destroy(): void {
        super.destroy()
        this._removeEventListener();
        if (this._resumeCameraMovement !== null) {
            this._resumeCameraMovement()
        }
    }

}
