import type * as cesium from "@vcmap/cesium"
/// 
import CesiumLayer from "../Lissener/CesiumLayer";
import VcsGlobalAccess from "../PluginManager/VcsMapGlobalAccess"
import PathWorkerManager from "./PathWorkerManager";
import { Tile } from "ol";
import { distance } from "ol/coordinate";

const TILE_SICE_LEVEL = 16
const TILE_LOAD_RADIUS = 6
const TILE_RADIUS = 12
const AREA_RECTAGLE = calculateAreaRectangle({
    s: 49.09426741181045,
    w: 6.348240263479982,
    n: 49.64598994082118,
    e: 7.4172786639971156
})

export default class WaterBodyAxisManager {
    _layer: CesiumLayer
    onNodesFinished: vcs.vcm.event.VcsEvent = new vcs.vcm.event.VcsEvent()
    private _cameraMoveStartListener: cesium.Event.RemoveCallback | null = null

    private _cameraMoveEndListener: cesium.Event.RemoveCallback | null = null

    tilingScheme = new Cesium.GeographicTilingScheme();
    tiles: Map<string, cesium.EntityCollection> = new Map();
    currentTiles: Set<string> = new Set()
    currentTilesLength = 0
    maxCurrentTileLength = getrenderCircleid(new Cesium.Cartesian2(1, 1), TILE_RADIUS).length
    requiredTiles: string[] = []
    removealetiles: string[] = []


    PathWorkerManager: PathWorkerManager = new PathWorkerManager()
    onchange = false
    changeintervall: NodeJS.Timeout | null = null
    lasttile: cesium.Cartesian2 | null = null
    loadedtiels: { tileid: string, tile: cesium.EntityCollection, data: Array<EntityOptions>, parent: cesium.Entity }[] = []
    removetiels: cesium.EntityCollection[] = []
    suspended: boolean = false
    isMoving = false
    waterscollor: Map<string, cesium.Color> = new Map<string, cesium.Color>()

    constructor() {
        this._layer = new CesiumLayer("WaterBodyAxisLayer", false)

        const camera = VcsGlobalAccess.Camera

        this._cameraMoveEndListener = camera.moveEnd.addEventListener((type) => {
            this.onchange = true
            this.isMoving = false
        })
        this._cameraMoveStartListener = camera.moveStart.addEventListener((type) => {
            this.onchange = true
            this.isMoving = true
        })

        setTimeout(() => { this.onchange = true }, 5000)

        this.changeintervall = setInterval(() => this.intervall(), Math.floor(1000 / 10))
        //this._layer.activate()

    }

    private async intervall() {
        if(this._layer.active){
        if (!this.onchange && this.isMoving) {
            this.onchange = true
        }
        if (!this.onchange && this.suspended) {

            // Chec if any current tile is missing
            for (const key of Array.from(this.currentTiles)) {
                if (!this.tiles.has(key)) {
                    this.currentTiles.delete(key);
                    this.currentTilesLength--;
                    this.onchange = true
                    console.log("TILE ist nicht in TILES")
                }

                //chack if any Shown tile is to much
                const entityToTileIdMap = new Map<cesium.EntityCollection, string>();
                for (const [key, value] of this.tiles.entries()) {
                    entityToTileIdMap.set(value, key);
                }
                for (let i = 0; i < this._layer.entities.getCollectionsLength(); i++) {
                    const tile = this._layer.entities.getCollection(i)
                    const id = entityToTileIdMap.get(tile)
                    if (!id || !this.currentTiles.has(id)) {
                        this._layer.entities.removeCollection(tile)
                        this.onchange = true
                    }
                }

            }
        }

        if (this.onchange) {

            this.onchange = false
            await this.onCameraChanged(VcsGlobalAccess.Camera)

        }


        let update = false
        if (this.loadedtiels.length > 0) {

            update = true
            if (!this.suspended) {
                this._layer.entities.suspendEvents()
                this.suspended = true
            }

            let blocksice = 3
            while (this.loadedtiels.length > 0 && blocksice > 0) {
                blocksice--
                const o = this.loadedtiels.shift()
                if (o) {
                    const { tileid, tile, data, parent } = o
                    if (true) {
                        if (this.removealetiles.length > 0) {
                            const toDeaalatid = this.removealetiles.find((v) => this.currentTiles.has(v))
                            if (toDeaalatid) {
                                const delatetil = this.tiles.get(toDeaalatid)
                                if (delatetil) {
                                    this.createPath(data, tile, parent).then(() => {
                                        if (!this.currentTiles.has(tileid)) {
                                            this.currentTiles.delete(toDeaalatid)
                                            this._layer.entities.removeCollection(delatetil)
                                            this.currentTiles.add(tileid)
                                            this._layer.entities.addCollection(tile)
                                            this.onchange = true
                                        }
                                    })

                                }

                            }

                        }
                        else if (this.currentTilesLength < this.maxCurrentTileLength) {
                            this.currentTilesLength++
                            this.createPath(data, tile, parent).then(() => {
                                if (!this.currentTiles.has(tileid)) {
                                    this.currentTiles.add(tileid)
                                    this._layer.entities.addCollection(tile)
                                    this.onchange = true
                                }
                            })
                        }
                        else {
                            this.loadedtiels.push(o)

                        }
                    } else {
                    }
                }
            }
        }
        if (this.removealetiles.length > 0) {
            const delatetiles = this.removealetiles.filter((v) => !this.currentTiles.has(v))
            if (delatetiles.length > 0) {
                this.onchange = true
                for (let tile of delatetiles) {
                    this.tiles.delete(tile)
                }
            }


        }


        if (!update && this.suspended) {
            this._layer.entities.resumeEvents()
            this.suspended = false
            VcsGlobalAccess.Scene.requestRender()
            VcsGlobalAccess.Scene.render()

        }
    }
    }




    async onCameraChanged(camera: cesium.Camera): Promise<void> {

        if (this._layer.active) {

            const cameraPositionCartographic = camera.positionCartographic
            const diraction = camera.direction
            const origin = camera.position
            const ray = new Cesium.Ray(origin, diraction);
            // Suche nach der ersten Kollision des Rays mit dem Globe
            const globe = VcsGlobalAccess.Scene.globe;
            const intersection = globe.pick(ray, VcsGlobalAccess.Scene);
            if (!intersection) {
                console.warn("Keine Kollision des Rays mit dem Globe gefunden.");
                return;
            }
            const intersectionPositioncartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(intersection);


            const cartographic = easingfromwath(cameraPositionCartographic, intersectionPositioncartographic)

            if (Cesium.Rectangle.contains(AREA_RECTAGLE, cartographic)) {
                const currentTile = this.tilingScheme.positionToTileXY(cartographic, TILE_SICE_LEVEL)
                const currentTileId = getTileNameByCartesian2(currentTile)
                this.lasttile = currentTile
                // if (!this.visiedtilese.has(currentTileId)) {

                //     this.visiedtilese.add(currentTileId)
                // }
                await this.loadtiles(currentTile)

            }



        }
    }


    async loadtiles(currentTile: cesium.Cartesian2) {

        //load tiles
        const loadtiles = getrenderCircle(currentTile, TILE_LOAD_RADIUS)

        for (let i of loadtiles) {
            const id = getTileNameByCartesian2(i)
            if (!this.tiles.has(id)) {
                const rec = this.tilingScheme.tileXYToRectangle(i.x, i.y, TILE_SICE_LEVEL)
                if (Cesium.Rectangle.contains(AREA_RECTAGLE, Cesium.Rectangle.center(rec))) {
                    const collation = new Cesium.EntityCollection(this._layer.entities)
                    collation.suspendEvents();


                    const box = this.createboxfromrec(rec)
                    await collation.add(box)

                    this.getpaths(rec, id, collation, box)
                    this.tiles.set(id, collation)
                }

            }else{
                this.PathWorkerManager.riserequest(id)
            }
        }

        this.requiredTiles = getrenderCircleid(currentTile, TILE_RADIUS)
        // Entferne Tiles, die nicht mehr im benötigten Radius liegen
        const alltiles = Array.from(this.tiles.keys())
        // Nur Tiles entfernen, die nicht im aktuellen Radius sind UND nicht in currentTiles (also wirklich "alt")
        this.removealetiles = alltiles.filter((key) => {
            // Wenn das Tile nicht im aktuellen Radius ist und nicht in den aktuellen Tiles, dann entfernen
            return !this.requiredTiles.includes(key) && !this.currentTiles.has(key)
        })
        this.PathWorkerManager.removeallrequest(this.requiredTiles)

    }
    // async delatetiles(currentTile: cesium.Cartesian2) {
    //     //load tiles
    //     const loadtiles = getrenderCircleid(currentTile, TILE_DELETE_RADIUS)
    //     const alltiles = Array.from(this.tiles.keys())

    //     const delatrile = alltiles.filter((key) => { return !loadtiles.includes(key) })

    //     if (delatrile.length > 0) {
    //         if (!this.suspended) {
    //             this._layer.entities.suspendEvents()
    //             this.suspended = true
    //         }
    //         for (let id of delatrile) {
    //             if (this.tiles.has(id)) {
    //                 const collation = this.tiles.get(id)
    //                 if (collation) {
    //                     this.tiles.delete(id)
    //                     this._layer.entities.removeCollection(collation)
    //                                     }
    //             }

    //         }

    //     }
    // }

    async clearEntities() {
        await this._layer.entities.removeAll()
    }

    createboxfromrec(rec: cesium.Rectangle): cesium.Entity {
        const w = rec.west
        const s = rec.south
        const e = rec.east
        const n = rec.north

        // Korrekte Koordinatenreihenfolge für Rechteck (gegen Uhrzeigersinn)
        const positions = [
            w, s,  // SW
            e, s,  // SE  
            e, n,  // NE
            w, n   // NW
        ];
        //const randomColorComponent = () => 0.5 + 0.125 * Math.random();
        const entity = new Cesium.Entity({
            polygon: {
                hierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromRadiansArray(positions)),
                //material: new Cesium.Color(randomColorComponent(), randomColorComponent(), randomColorComponent(), 0.5),
                material: Cesium.Color.BISQUE.withAlpha(0.0),
                classificationType: Cesium.ClassificationType.BOTH,
                //extrudedHeight: 1000,
                outline: false,
            }
        }) as cesium.Entity
        return entity;
    }
    async getpaths(rec: cesium.Rectangle, tileid: string, collation: cesium.EntityCollection, parent: cesium.Entity): Promise<void> {
        try {
            // Umrechnung von Bogenmaß (Radiant) in Grad
            const w = Cesium.Math.toDegrees(rec.west)
            const s = Cesium.Math.toDegrees(rec.south)
            const e = Cesium.Math.toDegrees(rec.east)
            const n = Cesium.Math.toDegrees(rec.north)

            const data = await this.PathWorkerManager.requestPaths({ n, e, s, w, l: 10 }, tileid) as any

            // for (let water of data as { name: string, path: { from: { lat: number, long: number, ca3: { x: number, y: number, z: number } }, to: { lat: number, long: number, ca3: { x: number, y: number, z: number } }, hatDirektUnten?: string }[] }[]) {
            //     if(!this.tiles.has(tileid)){
            //         throw new Error("not in tiles")
            //     }
            //     if (!this.waterscollor.has(water.name)) {
            //         this.waterscollor.set(water.name, new Cesium.Color(...randomColorComponent(), 1))
            //     }
            //     const color = this.waterscollor.get(water.name)

            //     for (let path of water.path) {
            //         let wgs84degrees = [path.from.long, path.from.lat, path.to.long, path.to.lat]
            //         let positions = Cesium.Cartesian3.fromDegreesArray(wgs84degrees)
            //         this.createPath(positions, collation, color, perent)
            //         // await this.waitForNextFrame();
            //     }

            // }

            this.loadedtiels.push({ tileid, tile: collation, data, parent })

        }
        catch (error) {
            if (this.tiles.has(tileid)) {
                this.tiles.delete(tileid)
                if(this.currentTiles.delete(tileid)){
                    this.currentTilesLength--
                }
                this.onchange = true
            }
        }





    }
    async createPath(data: Array<EntityOptions>, collation: cesium.EntityCollection, parent: cesium.Entity): Promise<void> {
        // if(data.length===0){
        //     collation.removeAll()
        // }
        const promiseOptions: Promise<cesium.Entity.ConstructorOptions>[] = []
        for (let entityOption of data) {
            promiseOptions.push(this.convertEntityOptions(entityOption))
        }
        const entitiesOptions = await Promise.all(promiseOptions)
        const promiseEntity: Promise<void>[] = []
        for (let entityOptions of entitiesOptions) {
            promiseEntity.push(this.addEntityToCollection(entityOptions, collation))

        }
        await Promise.all(promiseEntity)
        collation.resumeEvents()
    }

    async addEntityToCollection(entityOptions: cesium.Entity.ConstructorOptions, collation: cesium.EntityCollection) {
        const entity = new Cesium.Entity(entityOptions);
        collation.add(entity);
    }


    async convertEntityOptions(entityOption: EntityOptions): Promise<cesium.Entity.ConstructorOptions> {
        const { polyline, properties } = entityOption

        const positions = Cesium.Cartesian3.fromDegreesArray(polyline.positions)
        const fromPos = new Cesium.Cartesian3(
            properties.from.x,
            properties.from.y,
            properties.from.z
        );
        const toPos = new Cesium.Cartesian3(
            properties.to.x,
            properties.to.y,
            properties.to.z
        );

        return {
            id: entityOption.id,
            polyline: {
                positions,
                material: new Cesium.Color(0.47, 0.76, 0.91, 1.0),
                clampToGround: true,
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 2500),
                width: 10
            },
            properties: {
                "waters": entityOption.properties.waters,
                "from": fromPos,
                "to": toPos,
            }
        } as cesium.Entity.ConstructorOptions;
    }



}


function getlevel(hieght: number) {
    // return 16
    if (hieght <= 1000) {
        return 17
    } else if (hieght <= 2000) {
        return 16
    } else if (hieght <= 2500) {
        return 15
    } else if (hieght <= 5000) {
        return 14
    } else if (hieght <= 10000) {
        return 14
    } else if (hieght <= 25000) {
        return 13
    } else if (hieght <= 50000) {
        return 12
    } else if (hieght <= 100000) {
        return 11
    } else if (hieght <= 250000) {
        return 10
    } else if (hieght <= 500000) {
        return 9
    }
    return 8
}


function getrenderCircleb(center: cesium.Cartesian2, r: number, offset = 1) {
    const chunks: cesium.Cartesian2[] = [];
    chunks.push(center); // Startpunkt in der Mitte
    offset = Math.max(1, Math.min(offset, r));
    if(r===0){
        return chunks
    }
    for (let radius = offset; radius <= r; radius++) {
        // Obere und untere Kante des Quadrats
        for (let x = -radius; x <= radius; x++) {
            // Obere Kante
            chunks.push(Cesium.Cartesian2.add(center, new Cesium.Cartesian2(x, radius), new Cesium.Cartesian2()));
            // Untere Kante
            if (radius > 0) { // Verhindere doppelte Punkte bei radius = 0
                chunks.push(Cesium.Cartesian2.add(center, new Cesium.Cartesian2(x, -radius), new Cesium.Cartesian2()));
            }
        }
        
        // Linke und rechte Kante des Quadrats (ohne Ecken, da diese bereits oben erfasst wurden)
        for (let y = -radius + 1; y < radius; y++) {
            // Linke Kante
            chunks.push(Cesium.Cartesian2.add(center, new Cesium.Cartesian2(-radius, y), new Cesium.Cartesian2()));
            // Rechte Kante
            chunks.push(Cesium.Cartesian2.add(center, new Cesium.Cartesian2(radius, y), new Cesium.Cartesian2()));
        }
    }

    return chunks;
}
function getrenderCircle(center: cesium.Cartesian2, r: number, offset = 1) {
    const chunks: cesium.Cartesian2[] = [];
    offset = Math.max(1, Math.min(offset, r));
    if(r===0){
        chunks.push(center); // Startpunkt in der Mitte
        return chunks
    }
    
    // Von außen nach innen (r bis offset)
    for (let radius = r; radius >= offset; radius--) {
        // Obere und untere Kante des Quadrats
        for (let x = -radius; x <= radius; x++) {
            // Obere Kante
            chunks.push(Cesium.Cartesian2.add(center, new Cesium.Cartesian2(x, radius), new Cesium.Cartesian2()));
            // Untere Kante
            if (radius > 0) { // Verhindere doppelte Punkte bei radius = 0
                chunks.push(Cesium.Cartesian2.add(center, new Cesium.Cartesian2(x, -radius), new Cesium.Cartesian2()));
            }
        }
        
        // Linke und rechte Kante des Quadrats (ohne Ecken, da diese bereits oben erfasst wurden)
        for (let y = -radius + 1; y < radius; y++) {
            // Linke Kante
            chunks.push(Cesium.Cartesian2.add(center, new Cesium.Cartesian2(-radius, y), new Cesium.Cartesian2()));
            // Rechte Kante
            chunks.push(Cesium.Cartesian2.add(center, new Cesium.Cartesian2(radius, y), new Cesium.Cartesian2()));
        }
    }

    chunks.push(center); // Startpunkt in der Mitte am Ende
    return chunks;
}


function getTileNameByCartesian2(tile: cesium.Cartesian2) {
    return `${tile.x},${tile.y}`
}
function getrenderCircleid(center: cesium.Cartesian2, r: number, offset?: number) {
    const tiles = getrenderCircle(center, r, offset)
    const tilesid = tiles.map((tile) => getTileNameByCartesian2(tile))
    return tilesid
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
    return arra;
}

function easingfromwath(from: cesium.Cartographic, watch: cesium.Cartographic): cesium.Cartographic {
    const min = 2500
    const max = 5000
    if (from.height < min) {
        return from
    } else if (from.height > max) {
        return watch
    }
    else {
        const chiegt = from.height - min
        const cdistance = max - min

        const start = new Cesium.Cartesian2(from.longitude, from.latitude)
        const end = new Cesium.Cartesian2(watch.longitude, watch.latitude)
        const eased = Cesium.Cartesian2.lerp(start, end, Cesium.EasingFunction.ELASTIC_IN_OUT(1 / cdistance * chiegt), new Cesium.Cartesian2())
        return new Cesium.Cartographic(eased.x, eased.y)
    }
}


function calculateAreaRectangle(rec: { w: number, s: number, e: number, n: number }) {
    const { w, s, e, n } = rec;

    const cartographicSouthwest = Cesium.Cartographic.fromDegrees(w, s);
    const cartographicNortheast = Cesium.Cartographic.fromDegrees(e, n);
    const tilingScheme = new Cesium.GeographicTilingScheme();
    const tileSouthwest = tilingScheme.positionToTileXY(cartographicSouthwest, TILE_SICE_LEVEL);
    const tileNortheast = tilingScheme.positionToTileXY(cartographicNortheast, TILE_SICE_LEVEL);
    const recSouthwest = tilingScheme.tileXYToRectangle(tileSouthwest.x, tileSouthwest.y, TILE_SICE_LEVEL);
    const recNortheast = tilingScheme.tileXYToRectangle(tileNortheast.x, tileNortheast.y, TILE_SICE_LEVEL);

    return new Cesium.Rectangle(recSouthwest.west, recSouthwest.south, recNortheast.east, recNortheast.north);
}

function pathid(positions: cesium.Cartesian3[]) {
    let id = "path:"
    for (let c of positions) {
        id += `${c.x}${c.y}${c.z}`
    }
    return id
}

type EntityOptions = {
    id: string;
    polyline: {
        positions: Array<number>;
    };
    properties: {
        waters: string;
        from: { x: number, y: number, z: number };
        to: { x: number, y: number, z: number };
    };
};