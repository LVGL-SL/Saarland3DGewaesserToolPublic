import * as cesium from "@vcmap/cesium"
/// 
import CesiumLayer from "../Lissener/CesiumLayer";
import WaterBodyPath from "./objects/WaterBodyPath";
import WaterBodyVertex from "./objects/WaterBodyVertex";
import DescriptionNode from "./objects/DescriptionNode";
import DescriptionPath from "./objects/DescriptionPath";
import VcsMapGlobalAccess from "../PluginManager/VcsMapGlobalAccess";
import HeightProfileWorkerManager from "./worker/HeightProfileWorkerManager";
import PathManager from "./objects/PathManager"
import PluginManager from "../PluginManager/PluginManager";
import AwaitWaterBodyCreationState from "./startus/AwaitWaterBodyCreation/AwaitWaterBodyCreationState";
import WaterBodyControlState from "./startus/WaterBodyControl/WaterBodyControlState";
import CreateWaterBodyState from "./startus/CreateWaterBody/CreateWaterBodyState";
import WaterLevelStation,{Pegeldata} from "./objects/WaterLevelStation";

export default class WaterBodyToolManager {
    layer: CesiumLayer
    debugglayer: CesiumLayer
    waterLevelStationlayer: CesiumLayer
    nodelayer: cesium.EntityCollection
    ceatelayer: cesium.EntityCollection
    watersbodylayer: cesium.EntityCollection
    pegellayer: cesium.EntityCollection
    pathManager:PathManager|null = null 

    nodePath: DescriptionPath[] = []

    selecteNodePath: number = 0

    paths: Map<number, WaterBodyPath> = new Map()

   waterLevelStation:WaterLevelStation[] = []


    constructor() {
        this.layer = new CesiumLayer("WaterBodyToolMainLayer", true)
        this.layer.activate()
        this.debugglayer = new CesiumLayer("WaterBodyToolDEBUGLayer", true)
        //this.debugglayer.activate()
        this.waterLevelStationlayer = new CesiumLayer("WaterLevelStation", true)
        this.waterLevelStationlayer.activate()
        this.nodelayer = new Cesium.EntityCollection(this.layer.entities)
        this.ceatelayer = new Cesium.EntityCollection(this.debugglayer.entities)
        this.watersbodylayer = new Cesium.EntityCollection(this.layer.entities)
        this.pegellayer = new Cesium.EntityCollection(this.waterLevelStationlayer.entities)
        
        this.addNodepath()

        this.layer.entities.addCollection(this.nodelayer)
        this.createWaterLevelStation()
    }
    async createWaterLevelStation(){
        this.waterLevelStationlayer.entities.addCollection(this.pegellayer)
         const response = await fetch("/assets/Pegelmessstationen.json");
        
        const Pegelmessstationen = await  response.json() as Pegeldata[];

        this.waterLevelStation =  Pegelmessstationen.map((data) => new WaterLevelStation(data,this.pegellayer))
    }

    selectedWaterPath(index: number) {
        index = Math.max(0, Math.min(index, this.nodePath.length - 1))
        this.selecteNodePath = index

    }
    addNodepath() {
        if (this.nodePath.length < 10) {
            const notepathobj = new DescriptionPath(this.nodelayer)
            this.nodePath.push(notepathobj)
            this.selectedWaterPath(this.nodePath.length - 1)
        }


    }

    removeNodepath(index: number) {
        if (index >= 0 && index < this.nodePath.length) {
            const [notepathobj] = this.nodePath.splice(index, 1);
            notepathobj.destroy();
        }
        if (this.nodePath.length === 0) {
            this.addNodepath();
        }
        this.selectedWaterPath(index)
    }

    createNode(cartesian: cesium.Cartesian3): DescriptionNode | null {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
        return this.nodePath[this.selecteNodePath].create(cartographic)
    }
    moveNode(cartesian: cesium.Cartesian3, node: DescriptionNode | null) {
        if (node) {
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
            node.cartographic = cartographic
        }

    }
    delateNode(node: DescriptionNode | null) {
        if (node) {
            if (node.nodepath === this.nodePath[this.selecteNodePath]) {
                node.destroy()
            }
            else {
                //Makrier es als end node
                this.nodePath[this.selecteNodePath].addEndNode(node)

            }

        }
    }
    flyToNode(node: DescriptionNode | null) {
        if (node) {
            this.layer.flyToEntity(node.id)
        }
    }


    isObjektWaters(entity: cesium.Entity | null): DescriptionNode | null {
        try{
        if (entity && entity?.properties && entity.properties?.NodeObjektWaters) {
            const nodeObj = entity.properties.NodeObjektWaters.getValue() ?? null;
            return nodeObj instanceof DescriptionNode ? nodeObj : null;
        }
        return null
    }catch(e){

        return null
    }
    }
    canchangeWaterLevel(entity: cesium.Entity | null): boolean {
          try{
        if (entity && entity?.properties && entity.properties?.changeWaterLevel) {
            console.log("öpö",entity,entity.properties.changeWaterLevel.getValue())
            const can = entity.properties.changeWaterLevel.getValue() ?? false;
            return can
        }
        return false}catch(e){

        return false
    }
    }

    async togglePathManager():Promise<boolean> {
        if(!this.pathManager)
        {   
            if(this.nodePath[this.selecteNodePath].path.length>1){
            PluginManager.WindowState = new AwaitWaterBodyCreationState()
            this.pathManager = new PathManager(this)
            await this.pathManager.setup([this.nodePath[this.selecteNodePath]],this.waterLevelStation)
            this.debugglayer.entities.addCollection(this.ceatelayer)
            this.layer.entities.addCollection(this.watersbodylayer)
            this.layer.entities.removeCollection(this.nodelayer)

            PluginManager.WindowState = new WaterBodyControlState()
            return true
            }else{
                return false
            }

        }else{
            this.pathManager.destroy()
            this.pathManager = null
            this.debugglayer.entities.removeCollection(this.ceatelayer)
            this.layer.entities.removeCollection(this.watersbodylayer)
            this.layer.entities.addCollection(this.nodelayer)
            PluginManager.WindowState = new CreateWaterBodyState()
            this.waterLevelStation.map((v)=>{v.color =Cesium.Color.WHITE})
            return false
        }
    }

    setOverheightto(waterLevelStation:WaterLevelStation,index:number){
        this.waterlevel = waterLevelStation.getwarnheight(index)
    }
    setHeightFromWaterLevelStation(waterLevelStation:WaterLevelStation,height:number){
        if(waterLevelStation && !Number.isNaN(height)&& Number.isFinite(height))
      {this.waterlevel =  waterLevelStation.getsettoheight(height)}
    }

    get protectedloadet(){
        if(!this.pathManager) return 0
        return this.pathManager.progressPercentage
    }
    get waterlevel(){
        if(!this.pathManager) return 0
        return this.pathManager.waterlevel
    }
    set waterlevel(value){
        if(this.pathManager){
            if(!Number.isNaN(value)&&Number.isFinite(value)){
                         this.pathManager.waterlevel = value
            }  
        }
    }
    get currentWaterLevelStations(){
        if(!this.pathManager) return []
        return this.pathManager.waterLevelStation
    }
    set currentWaterLevelStations(value){
        return
    }
    get waterLevelStationsWaterLevel() {
        if (!this.pathManager) return [];
        return this.pathManager.waterLevelStation.map((v) => v.waterlevel);
    }
    get waterLevelStationsWarnIndex() {
        if (!this.pathManager) return [];
        return this.pathManager.waterLevelStation.map((v) => v.warnindex);
    }


    saveNodepath(){
        if(this.nodePath[this.selecteNodePath].path.length>0){
        const obj = this.nodePath[this.selecteNodePath].toObjekt()
        const jsonstring = JSON.stringify(obj, null, 2);
        const blob = new Blob([jsonstring], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "datei.txt";
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);}
    }

     loadNodepath(event: Event) {
        const target = event.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            const file = target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                 if (this.nodePath.length < 10) {
                    const notepathobj = new DescriptionPath(this.nodelayer)
                    try{
                    const obj = JSON.parse(text);
                    notepathobj.fromObjekt(obj)
                    this.nodePath.push(notepathobj)
                    this.selectedWaterPath(this.nodePath.length - 1)
                    }
                    catch(e){
                        console.log(e)
                        notepathobj.destroy()
                    }
                }

                console.log(text); // Hier wird der Text ausgegeben
            };
            reader.readAsText(file);
        }
    };
  

}



