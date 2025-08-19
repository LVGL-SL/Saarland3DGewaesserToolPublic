import InteractionLissner from "./InteractionManager"
import PluginManager from "../PluginManager/PluginManager"

export default class WindowManager {
    _interactionListener: InteractionLissner
    constructor() {
        this._interactionListener = new InteractionLissner(this)
    }


    handleInteraction(event: any) {
        if (PluginManager.WindowState) {
            if (event.typeName) {
                switch (event.typeName) {
                    case "CLICK":
                        console.log(":/ öpö click")
                        PluginManager.WindowState.onClick(event);
                        break;
                    case "DBLCLICK":
                        PluginManager.WindowState.onDoubleClick(event)
                    case "DRAGSTART":
                        PluginManager.WindowState.onDragStart(event);
                        break;
                    case "DRAG":
                        PluginManager.WindowState.onDrag(event)
                        break;
                    case "DRAGEND":
                        PluginManager.WindowState.onDragEnd(event);
                        break;
                    case "MOVE":
                        PluginManager.WindowState.onMove(event);
                        break;
                    default:
                        console.warn(`WindowManager: InteractionListener has sent "${event.eventTypeName}" case not defined`, event)

                }
            }
        }

    }


    destroy() {
        this._interactionListener.destroy()
       


    }

    get isDragEnabled() {
        return this._interactionListener.isDragEnabled
    }
    set isDragEnabled(value: boolean) {
        this._interactionListener.isDragEnabled = value
    }

}

