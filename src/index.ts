/// <reference path="../globals/vcs.d.ts" />
/// <reference path="../globals/globals.d.ts" />
// @ts-ignore
import window from './Window/window.vue';
// @ts-ignore
import icon from './components/icon.vue';
// CSS wird über VCS Framework geladen, nicht über Webpack import

const routes = [{
  name: 'waterbodytool',
  path: '/waterbodytool',
  component: window,
 
}];

vcs.ui.registerPlugin({
  name: 'waterbodytool',
  routes,
  widgetButton: icon,
  // headerButton: icon,
  toolboxButton: icon,
  // mapButton: icon,
  // mapComponent: window,
  supportedMaps: ['vcs.vcm.maps.Cesium'],
  //
  // A customizable button for the legend menu
  // legendItem: {
  //   name: 'meinWidget', // Name des Legendeneintrags
  //   component: "<p>lol</p>", // Vue-Komponente für die Legende
  // },
  
} as vcs.ui.PluginOptions).then(()=>afterInitialization())


import PluginManager from './PluginManager/PluginManager';
import VcsMapGlobalAccess from './PluginManager/VcsMapGlobalAccess';
function afterInitialization() {
  PluginManager.init()
  VcsMapGlobalAccess.Scene.debugShowFramesPerSecond = true
}
