//CesiumCamercontrolHelper
import * as cesium from "@vcmap/cesium"
import  VcsMapGlobalAccess from "../../PluginManager/VcsMapGlobalAccess";

type States = {
    enableRotate: boolean; //By left-Drag (3D/Columbus View)
    enableTranslate: boolean;//By left-Drag (2D/Columbus View)
    enableZoom: boolean;//By mouse wheel, right-drag, pinch
    enableTilt: boolean;//By middle-drag, left-drag+CTRL, right-drag+CTRL, pinch
    enableLook: boolean;//By left-drag+SHIFT
   
};
export function deactivateLeftDrag(): () => void {
    const scene = VcsMapGlobalAccess.Scene
    const state = {
        enableRotate: scene.screenSpaceCameraController.enableRotate,
        enableTranslate: scene.screenSpaceCameraController.enableTranslate,
        enableZoom: scene.screenSpaceCameraController.enableZoom,
        enableTilt: scene.screenSpaceCameraController.enableTilt,
        enableLook: scene.screenSpaceCameraController.enableLook,
       
    };
    deactivateCameraControls(scene);
   
    return () => { restoreCameraControls(scene, state); };
}

function deactivateCameraControls(scene: cesium.Scene): void {
    scene.screenSpaceCameraController.enableRotate = false;
    scene.screenSpaceCameraController.enableTranslate = false;
    scene.screenSpaceCameraController.enableZoom = false;
    scene.screenSpaceCameraController.enableTilt = false;
    scene.screenSpaceCameraController.enableLook = false;
    
}

function restoreCameraControls(
    scene: cesium.Scene,
    state: States
): void {
    scene.screenSpaceCameraController.enableRotate = state.enableRotate;
    scene.screenSpaceCameraController.enableTranslate = state.enableTranslate;
    scene.screenSpaceCameraController.enableZoom = state.enableZoom;
    scene.screenSpaceCameraController.enableTilt = state.enableTilt;
    scene.screenSpaceCameraController.enableLook = state.enableLook;
  
}



