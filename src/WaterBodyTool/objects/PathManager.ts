import VcsMapGlobalAccess from "../../PluginManager/VcsMapGlobalAccess"
import WaterBodyToolManager from "../WaterBodyToolManager"
import WaterBodyVertex from "./WaterBodyVertex"
import type * as cesium from "@vcmap/cesium"
import HeightProfileWorkerManager, { ResolveData } from "../worker/HeightProfileWorkerManager"
import DescriptionNode from "./DescriptionNode"
import DescriptionPath from "./DescriptionPath"
import WaterBodyPath from "./WaterBodyPath"
import WaterBodyWall from "./WaterBodyWall"
import WaterLevelStation from "./WaterLevelStation"

export default class PathManager{
  
    _waterlevel = 0
    heightProfileWorkerManager :HeightProfileWorkerManager = new HeightProfileWorkerManager()
    entityCollection:cesium.EntityCollection
    createlayer:cesium.EntityCollection

    changehight:vcs.vcm.event.VcsEvent = new vcs.vcm.event.VcsEvent()
    waterBodyPaths: WaterBodyPath[]=[]
    waterBodyWalls: WaterBodyWall[]=[]
    waterLevelStation:WaterLevelStation[] =[]
    regtangel:cesium.Rectangle|null =null
    constructor(waterBodyToolManager:WaterBodyToolManager){
        this.entityCollection = waterBodyToolManager.watersbodylayer
        this.createlayer = waterBodyToolManager.ceatelayer
        
        
    }

    async setup(descriptionPath:DescriptionPath[],waterLevelStation:WaterLevelStation[]){
        this.waterLevelStation = waterLevelStation
        const computeVertx : Promise<void>[]=[]
        this.calculateTotal(descriptionPath)

        for(let path of descriptionPath){
            this.createlayer.suspendEvents()
            await this.setupPath(path)
            this.createlayer.resumeEvents()
            this.finishedCount++
        }
      
        this.waterlevel = 0.1
        this.finishedCount++

    }
    async setupPath(descriptionPath:DescriptionPath){
        const computeVertx : Promise<void>[]=[]
        const vetexe: WaterBodyVertex[] = []
        const vetexis = [] as WaterBodyVertex[]
        // Abstand (distance between vertices) is configurable via a constant
        const VERTEX_SPACING_METERS = 15; // You can change this value to adjust the spacing

        for (let i = 0; i < descriptionPath.path.length - 1; i++) {
            const nodeA = descriptionPath.path[i];
            const nodeB = descriptionPath.path[i + 1];
            const cartA = nodeA.cartographic;
            const cartB = nodeB.cartographic;

            // Calculate distance between nodes in meters
            const distance = Cesium.Cartesian3.distance(
            Cesium.Cartesian3.fromRadians(cartA.longitude, cartA.latitude, cartA.height || 0),
            Cesium.Cartesian3.fromRadians(cartB.longitude, cartB.latitude, cartB.height || 0)
            );

            if (i === 0) {
            vetexis.push(new WaterBodyVertex(cartA));
            this.totalCount+=2
            }

            // Add vertices every VERTEX_SPACING_METERS along the segment (excluding endpoints)
            const steps = Math.floor(distance / VERTEX_SPACING_METERS);
            for (let s = 1; s < steps; s++) {
            const fraction = (s * VERTEX_SPACING_METERS) / distance;
            if (fraction >= 1) break;
            // Interpolate between cartA and cartB by fraction
            const longitude = cartA.longitude + (cartB.longitude - cartA.longitude) * fraction;
            const latitude = cartA.latitude + (cartB.latitude - cartA.latitude) * fraction;
            const height = (cartA.height || 0) + ((cartB.height || 0) - (cartA.height || 0)) * fraction;
            const interpolated = new Cesium.Cartographic(longitude, latitude, height);
            vetexis.push(new WaterBodyVertex(interpolated));
            this.totalCount+=2
            }
            vetexis.push(new WaterBodyVertex(cartB));
            this.totalCount+=2
            this.finishedCount++;
        }
        // If only one node exists, add it
        if (descriptionPath.path.length === 1) {
            vetexis.push(new WaterBodyVertex(descriptionPath.path[0].cartographic));
            this.totalCount+=2
            this.finishedCount++;
        }
        console.log("PathManager: node to vetexis:",vetexis)
        for (let i = 0; i < vetexis.length; i++) {
            const from: WaterBodyVertex | null = (i - 1 >= 0) ? vetexis[i - 1] : null
            const to: WaterBodyVertex | null = (i + 1 < vetexis.length) ? vetexis[i + 1] : null
            console.log("PathManager: vetexis from and to:",from,to)
            await vetexis[i].setup(from, to)
            computeVertx.push(this.setupVertex(vetexis[i]))
        }
        console.log("PathManager: vetexis to vetexis:",vetexis)

        await Promise.all(computeVertx)
        console.log("PathManager: vetexis haben l und r",vetexis)


        for (let i = 0; i < vetexis.length - 1; i++) {
            const from = vetexis[i];
            const to = vetexis[i + 1];
            this.waterBodyPaths.push(new WaterBodyPath(this.entityCollection, from, to, this.changehight));
            this.finishedCount++;
        }
         this.waterLevelStation= this.waterLevelStation.filter((v)=>{
            const bool =  v.checkforcolission(vetexis)  
            this.finishedCount++
            return bool
         })
        
        this.waterBodyWalls.push(
        new WaterBodyWall(this.entityCollection,vetexis[0],this.changehight),
        new WaterBodyWall(this.entityCollection,vetexis[vetexis.length-1],this.changehight)
        )
        


        

    }

     async setupVertex(waterBodyVertex:WaterBodyVertex){
            //left 
            const leftdiraction = waterBodyVertex.leftDirection
            const response1 = await this.setupsiedevertexes(waterBodyVertex,leftdiraction) 
            const {data:data1,start:start1} = response1 as ResolveData
            waterBodyVertex.left = data1
            if(waterBodyVertex.center.height > start1.height)
            {waterBodyVertex.center = start1}
            this.finishedCount++
            //right
            const rightdiration = waterBodyVertex.rightDirection
            const response2 = await this.setupsiedevertexes(waterBodyVertex,rightdiration)
            const {data:data2,start:start2} = response2 as ResolveData
            waterBodyVertex.right = data2
            if(waterBodyVertex.center.height > start2.height)
            {waterBodyVertex.center = start2}

            console.log("PathManager: Vetxfertig")
            this.finishedCount++

    }
   
    async setupsiedevertexes(waterBodyVertex:WaterBodyVertex,diraction:cesium.Cartesian3){
        const start = waterBodyVertex.center
        const end= waterBodyVertex.getCartographicByDistance(1000,diraction)
        createLine(this.createlayer,start,end,Cesium.Color.MINTCREAM)
        createPoint(this.createlayer,end,Cesium.Color.MINTCREAM)
        const profile = await this.heightProfileWorkerManager.requestPaths(start, end)
        console.log("PathManager:vertexe haben:",profile)
        profile.data.forEach((v)=>{createPoint(this.createlayer,v,Cesium.Color.PALEVIOLETRED)})
        return profile
    }


    set waterlevel(value){
        if(Number.isFinite(value)&&!Number.isNaN(value)){
            
            console.log("Upadte waterheight")
            this._waterlevel = Number(value.toFixed(6))
            this.changehight.raiseEvent(this._waterlevel)
        }
    }
    get waterlevel(){
       return this._waterlevel
    }
 


    destroy(){
        this.entityCollection.removeAll()
        this.createlayer.removeAll()
        this.changehight.destroy()
        this.heightProfileWorkerManager.destroy()
       
    }
    calculateTotal(descriptionPath:DescriptionPath[]){
       let total = 0
       const cartographics = []
       for(let path of descriptionPath){
          total += path.path.length //node to vertex
          total += path.path.length-1 //Paht objekte
          total++
          for(let node of path.path){
            cartographics.push(node.cartographic)
          }
       }
       
        total+= this.waterLevelStation.length
       
       this.totalCount = total
    }
    totalCount:number=0
    finishedCount:number=0

     get progressPercentage(){
        if(this.totalCount ==0) return 0
        console.log("totalCount:",this.totalCount,"finishedCount:",this.finishedCount,"::",1/this.totalCount*this.finishedCount)
        return 1/this.totalCount*this.finishedCount

       
    }

}
function createPoint(entityCollection: cesium.EntityCollection, cartographic: cesium.Cartographic, color = Cesium.Color.RED) {
    const height = VcsMapGlobalAccess.Scene.globe.getHeight(cartographic)
    entityCollection.add(new Cesium.Entity({
        position: Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, height),
        point: {
            pixelSize: 10,
            color,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2
        }
    }))
}
function createLine(entityCollection: cesium.EntityCollection, from: cesium.Cartographic, to: cesium.Cartographic, color = Cesium.Color.RED) {
    entityCollection.add(new Cesium.Entity({
        polyline: {
            positions: [
                Cesium.Cartesian3.fromRadians(from.longitude, from.latitude),
                Cesium.Cartesian3.fromRadians(to.longitude, to.latitude)
            ],
            clampToGround: true,
            width: 3,
            material: color
        }
    }))
}
