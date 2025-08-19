import type * as cesium from "@vcmap/cesium"
import EntityCollection from "cesium/Source/DataSources/EntityCollection"

export default class EnhancedCompositeEntityCollection extends Cesium.CompositeEntityCollection {
    private _show = true
    private _isSuperEventActive = false
    private _hidden :EntityCollection[]=[]
    private _collections :EntityCollection[]=[]


    constructor(collections?: cesium.EntityCollection[], owner?: cesium.DataSource) {
        super(collections, owner)


    }
    //active collection methods
    activeCollection(collection: cesium.EntityCollection) {
        if (this.containsCollection(collection)) {
            this.lowerCollectionToBottom(collection)
            return true
        }
        return false
    }
    activeCollectionById(id: string) {
        const collection = this.getCollectionById(id)
        if (collection) {
            this.activeCollection(collection)
            return true
        }
        return false


    }
    getCollectionById(id: string) {
        let responce = null
        const length = this.getCollectionsLength()
        for (let i = 0; i < length; i++) {
            const collection = this.getCollection(i) as cesium.EntityCollection
            if (collection.id === id)
                responce = collection
            break
        }
        return responce

    }

    /**
     * Adds an entity to the active entity collection.
     * @param entity The entity or entity options to add.
     * @returns cesium.Entity
     */
    add(entity: cesium.Entity | cesium.Entity.ConstructorOptions): cesium.Entity {
        const entities = this.activeEntityCollection
        return entities.add(entity)
    }
    /**
     * Gets an existing entity by ID or creates a new one if it doesn't exist in the active entity collection.
     * @param id The unique identifier for the entity.
     * @returns cesium.Entity
     */
    getOrCreateEntity(id: string): cesium.Entity {
        const entities = this.activeEntityCollection
        return entities.getOrCreateEntity(id)
    }
    /**
     * Removes all entities from the active entity collection.
     * @returns boolean indicating success
     */
    removeAll() {
        const entities = this.activeEntityCollection
        return entities.removeAll()
    }

    //global collection methods

    /**
     * Removes an entity from all collections that contain it.
     * @param entity The entity to remove from all collections.
     * @returns boolean indicating if the entity was successfully removed.
    */
    remove(entity: cesium.Entity) {
        let responce = false
        const length = this.getCollectionsLength()
        for (let i = 0; i < length; i++) {
            const entityCollection = this.getCollection(i)
            if (entityCollection.contains(entity)) {
                responce = entityCollection.remove(entity)
            }
        }
        return responce
    }     /**
      * Removes an entity by ID from all collections that contain it.
      * @param id The unique identifier of the entity to remove from all collections.
      * @returns boolean indicating if the entity was successfully removed.
     */
    removeById(id: string): boolean {
        let responce = false
        const length = this.getCollectionsLength()
        for (let i = 0; i < length; i++) {
            const entityCollection = this.getCollection(i)
            if (entityCollection.getById(id)) {
                responce = entityCollection.removeById(id)
            }
        }
        return responce
    }
    /**
      * Removes an entity from the first collection that contains it (stops after first match).
      * @param entity The entity to remove from the first collection containing it.
      * @returns boolean indicating if the entity was successfully removed.
     */
    removeFirst(entity: cesium.Entity) {
        let responce = false
        const length = this.getCollectionsLength()
        for (let i = 0; i < length; i++) {
            const entityCollection = this.getCollection(i)
            if (entityCollection.contains(entity)) {
                responce = entityCollection.remove(entity)
                break
            }
        }
        return responce
    }
    /**
      * Removes an entity by ID from the first collection that contains it (stops after first match).
      * @param id The unique identifier of the entity to remove from the first collection containing it.
      * @returns boolean indicating if the entity was successfully removed.
     */
    removeFirstById(id: string): boolean {
        let responce = false
        const length = this.getCollectionsLength()
        for (let i = 0; i < length; i++) {
            const entityCollection = this.getCollection(i)
            if (entityCollection.getById(id)) {
                responce = entityCollection.removeById(id)
                break
            }
        }
        return responce
    }
    /**
      * Gets an entity by ID from the first collection that contains it (stops after first match).
      * @param id The unique identifier of the entity to get from the first collection containing it.
      * @returns The entity if found, undefined otherwise.
     */
    getFirstById(id: string): cesium.Entity | undefined {
        let responce = undefined
        const length = this.getCollectionsLength()
        for (let i = 0; i < length; i++) {
            const entityCollection = this.getCollection(i)
            responce = entityCollection.getById(id)
            if (responce) {
                break
            }
        }
        return responce
    }
    /**
     * Gets the first collection that contains an entity with the specified ID.
     * @param id The unique identifier of the entity to search for.
     * @returns The first collection containing the entity, or undefined if not found.
     */
    getFirstCollectionById(id: string): cesium.EntityCollection | undefined {
        let responce = undefined
        const length = this.getCollectionsLength()
        for (let i = 0; i < length; i++) {
            const entityCollection = this.getCollection(i)

            if (entityCollection.getById(id)) {
                responce = entityCollection
                break
            }
        }
        return responce
    }



    get activeEntityCollection(): cesium.EntityCollection {
        if (this.getCollectionsLength() === 0) {
            this.addCollection(new Cesium.EntityCollection(this));
        }
        return this.getCollection(0);
    }

    suspendEvents() {
        if (!this._isSuperEventActive) {
            this._isSuperEventActive = true
            super.suspendEvents()
        }
    }

    resumeEvents() {
        if (this._isSuperEventActive) {
            this._isSuperEventActive = false
            super.resumeEvents()
        }
    }

    get show() {
        return this._show
    }
    set show(show: boolean) {
        this._show = show
        this.updateshow()
    }
    updateshow() {

    }

    addCollection(collection: EntityCollection, index?: number) {
            if(!this.containsCollection(collection)){
                super.addCollection(collection, index)
            }
            
    }

}