import type { Component } from "vue"
import PluginManager from "../PluginManager/PluginManager";
// Verwende direkt eine Klasse statt Interface + Basisklasse

export default class WindowState {
    name: string = "";
    readonly component: Component;

    /**
     * Necessary to call super(windowManager, component)
     * @param event 
     */
    constructor(component: Component) {
        this.isDragEnabled = false
        this.component = component

    }


    /**
     * Necessary to call super.destroy()
     * @param event 
     */
    destroy() {

    }
    /**
     * No base function
     * @param event 
     */
    onClick(event: any) { };
    /**
     * Default as no separate function
     * @param event 
     */
    onDoubleClick(event: any) { this.onClick(event) };

    /**
     * Prevent camera movement
     * @param event 
     */
    onDragStart(event: any) {
    }

    /**
     * No base function
     * @param event 
     */
    onDrag(event: any) { };

    /**
     * Restores camera movement
     * @param event 
     */
    onDragEnd(event: any) {
    }

    /**
    * No base function
    * @param event 
    */
    onMove(event: any) { };

    /**
     * No base function
     * @param event 
     */
    onClose(event: any) { };

    /**
     * No base function
     * @param event 
     */
    onStart(){}



    /**
     * Gets whether drag is enabled from the InputManager.
     * @returns {boolean}
     */
    get isDragEnabled(): boolean {
        return PluginManager.getIsDrag()
    }

    /**
     * Sets whether drag is enabled in the InputManager.
     * @param {boolean} value
     */
    set isDragEnabled(value: boolean) {
       PluginManager.setIsdrag(value)
    }


}



