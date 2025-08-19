import DescriptionNode from "./DescriptionNode";
import type * as cesium from "@vcmap/cesium"

const inactiveColor = Cesium.Color.GRAY
export default class DescriptionPath {
    _type: string
    _lineVertices: cesium.Cartesian3[] = []
    _closeShapeLineVertices: cesium.Cartesian3[] = []
    entityCollection: cesium.EntityCollection
    path: DescriptionNode[] = []
    color: cesium.Color = new Cesium.Color(...randomColorComponent())
    lineEntity: cesium.Entity | null = null
    closeShapeLineEntitiy: cesium.Entity | null = null
    hasEndNod =false

    constructor(entityCollection: cesium.EntityCollection) {
        this.entityCollection = entityCollection
        this._type = "path"

    }

    create(cartographic: cesium.Cartographic):DescriptionNode|null {
         if(!this.hasEndNod){
            const node = new DescriptionNode(cartographic, this)
            this.path.push(node)
            this.updatePathVertices()
            return node
         }
         return null
    }

    addEndNode(node: DescriptionNode) {
        if(!this.hasEndNod && this.path.length>1){
            this.path.push(node)
            node.addtodestroyevent(this)
            this.hasEndNod=true
            this.updatePathVertices()
        }
        
    }
    removeEndNode(node:DescriptionNode){
        if(this.hasEndNod){
            if(this.path[this.path.length-1] === node){
                this.path.pop()
                this.hasEndNod=false
                this.updatePathVertices()
            }
        }
    }


    remove(node: DescriptionNode) {
        const index = this.path.findIndex((obj) => obj === node)
        if (index >= 0) {
            if(index === this.path.length-1 && this.hasEndNod){
                const [nodes] = this.path.splice(index, 1)
                this.removeEndNode(node)
            }
            else if(index === this.path.length-2 && this.hasEndNod){
                const [endNode,node]= this.path.splice(index, 2)
                this.removeEndNode(endNode)
                node.destroy()
            }else{
                const nodes= this.path.splice(index, 1)
                nodes.map((node)=>{node.destroy()})
            }
            this.updatePathVertices()
        }
    }

    moveUp(node: DescriptionNode) {
        const index = this.path.findIndex((obj) => obj === node)
        if (index > 0) {

            const [removed] = this.path.splice(index, 1)
            this.path.splice(index - 1, 0, removed)

            this.updatePathVertices()
        }
    }
    moveDown(node: DescriptionNode) {
        const index = this.path.findIndex((obj) => obj === node)
        if (index >= 0 && index < this.path.length - 1) {

            const [removed] = this.path.splice(index, 1)
            this.path.splice(index + 1, 0, removed)

            this.updatePathVertices()
        }
    }


    set type(type: string) {
        if (type === "shape" || type === "path") {
            this._type = type
            this.updatetype()
        }
    }
    get type() {
        return this._type
    }

    toggeltype() {
        switch (this.type) {
            case "shape": {
                this.type = "path";
                break;
            }
            case "path": {
                this.type = "shape";
                break;
            }
            default: {
                this.type = "path";
                break;
            }
        }
    }



    updatePathVertices() {
        if (this.path.length === 0) {
            this._lineVertices = []
            this._closeShapeLineVertices = []
        }
        else {
            const vetex: cesium.Cartesian3[] = []
            for (let node of this.path) {
                vetex.push(node.cartesian)
            }
            this._lineVertices = vetex
            this._closeShapeLineVertices = [vetex[0], vetex[vetex.length - 1]]
        }
        this.updatetype()
    }

    updatetype() {
        switch (this.type) {
            case "shape": {
                this.updateshapeentitiy(true)
                this.updatepathentitiy(true)
                break;
            }
            case "path": {
                this.updateshapeentitiy(false)
                this.updatepathentitiy(true)
                break;
            }
            default: {
                // Fix if unknown
                this._type = "path"
                this.updateshapeentitiy(false)
                this.updatepathentitiy(true)
            }
        }
    }

    updateshapeentitiy(active: boolean): void {
        if (!this.closeShapeLineEntitiy) {
            const positions = new Cesium.CallbackProperty((time, result: undefined | cesium.Cartesian3[]) => {
                if (!result) {
                    result = this._closeShapeLineVertices
                } else if (result !== this._closeShapeLineVertices) {
                    result = this._closeShapeLineVertices

                }
                return result;
            }, false)
            this.closeShapeLineEntitiy = new Cesium.Entity({
                polyline: {
                    positions,
                    width: 10,
                    material: new Cesium.PolylineDashMaterialProperty({
                        color: this.color,
                    }),

                    clampToGround: true,

                }
            })
        }

        if (active && !this.entityCollection.contains(this.closeShapeLineEntitiy)) {
            this.entityCollection.add(this.closeShapeLineEntitiy)
        } else if (!active && this.entityCollection.contains(this.closeShapeLineEntitiy)) {
            this.entityCollection.remove(this.closeShapeLineEntitiy)
        }
    }

    updatepathentitiy(active: boolean): void {
        if (!this.lineEntity) {
            const positions = new Cesium.CallbackProperty((time, result: undefined | cesium.Cartesian3[]) => {
                if (!result) {
                    result = this._lineVertices
                } else if (result !== this._lineVertices) {
                    result = this._lineVertices

                }
                return result;
            }, false)
            this.lineEntity = new Cesium.Entity({
                polyline: {
                    positions,
                    width: 10,
                    material: this.color,
                    clampToGround:true,
                }
                
            })
        }

        if (active && !this.entityCollection.contains(this.lineEntity)) {
            this.entityCollection.add(this.lineEntity)
        } else if (!active && this.entityCollection.contains(this.lineEntity)) {
            this.entityCollection.remove(this.lineEntity)
        }
    }





    destroy() {
        if(this.hasEndNod){
            this.path[this.path.length-1].removefromdestryevent(this)
            this.path.pop()
            this.hasEndNod = false
        }
        for(let i = this.path.length; i>0 ; i--){
            const node = this.path[0]
            node.destroy()
        }
        this.updatepathentitiy(false)
        this.updateshapeentitiy(false)
        
    }

    toObjekt(){
         const path = this.path.map((v)=>{return{lat:v.cartographic.latitude,long:v.cartographic.longitude,alt:v.cartographic.height}})
        return path
    }

    
    fromObjekt(path: {lat:number,long:number,alt:number}[]){
        for(let node of path){
            this.create(Cesium.Cartographic.fromRadians(node.long,node.lat,node.alt))
        }
       
    }
}


function randomColorComponent() {
    const pre = 0.9 + 0.1 * Math.random() - 0.1 / 2
    const sub = Math.random()
    let arra = [pre, sub, 0];
    // Liste mischen (Fisher-Yates Shuffle)
    for (let i = arra.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arra[i], arra[j]] = [arra[j], arra[i]];
    }
    arra.push(1)
    return arra;
}