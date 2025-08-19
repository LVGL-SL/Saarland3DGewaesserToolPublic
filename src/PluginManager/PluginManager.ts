import WindowManager from "../Window/WindowManager"

// import WaitForToolmanagerState from "../watertool/startus/WaitForToolmanager/WaitForToolmanagerState"

import WindowState from "../Window/WindowState"

import WaterBodyAxisManager from "../WaterBodyAxisManager/WaterBodyAxisManager"
import WaterBodyToolManager from "../WaterBodyTool/WaterBodyToolManager"
import CreateWaterBodyState from "../WaterBodyTool/startus/CreateWaterBody/CreateWaterBodyState"

export default class PluginManager {
    private static _instance: PluginManager | null = null
    public static readonly onCloseWindow: vcs.vcm.event.VcsEvent = new vcs.vcm.event.VcsEvent()
    _actvie: boolean = false
    _disabled: boolean = false
    WaterBodyAxisManager: WaterBodyAxisManager
    WaterBodyToolManager: WaterBodyToolManager
    _WindowState: WindowState | null = null
    _WindowManager: WindowManager | null = null
    private constructor() {
        this.WaterBodyAxisManager = new WaterBodyAxisManager()
        this.WaterBodyToolManager = new WaterBodyToolManager()
        this._WindowState = new CreateWaterBodyState()
    }
    static init() {
        if (!PluginManager._instance) {
            console.log("plugin mander wird über init erstellt")
            PluginManager._instance = new PluginManager()
        }


    }

    public static get instance() {
        return PluginManager._instance
    }


    public static set WindowState(value) {
        if (PluginManager.instance) {
            PluginManager.instance._WindowState = value
        }

    }

    public static get WindowState(): WindowState | null {

        return PluginManager.instance?._WindowState ?? null

    }

    public get component() {
        if (this._WindowState) {
            console.log("fehler läufrt bis componet zugriff this._WindowState", this._WindowState)
            return this._WindowState?.component ?? null
        }
        return null

    }
    public get state() {
        return this._WindowState ?? null;
    }


    public static get status() {

        if (!PluginManager.instance || PluginManager.instance._disabled) {
            return "disabled"
        }
        else {
            if (PluginManager.instance._actvie) {
                return "active"
            }
            else {
                return "deactivated"
            }
        }
    }

    public static setIsdrag(value: boolean) {
        if (PluginManager.instance && PluginManager.instance._WindowManager) {
            {
                PluginManager.instance._WindowManager.isDragEnabled = value;
            }
        }
    }
    public static getIsDrag() {
        if (PluginManager.instance && PluginManager.instance._WindowManager) {
            return PluginManager.instance._WindowManager.isDragEnabled ?? false;
        }
        return false
    }

    public static openWindow() {
        if (PluginManager.instance) {
            if(!PluginManager.instance._WindowManager){
                PluginManager.instance._WindowManager = new WindowManager();
            }
        }
    }
    public  openWindow() {
            if(!this._WindowManager){
                this._WindowManager = new WindowManager();
            }
    }
    public closeWindow() {
        PluginManager.onCloseWindow.raiseEvent(true);
            this._WindowManager?.destroy()
            this._WindowManager = null
    }

    public static closeWindow() {
        if (PluginManager.instance) {
            PluginManager.onCloseWindow.raiseEvent(true);
            PluginManager.instance._WindowManager?.destroy()
            PluginManager.instance._WindowManager = null
        }
    }
    public static get WindowManager(): WindowManager | null {
        return PluginManager.instance?._WindowManager ?? null
    }
}