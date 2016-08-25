/**
 * Imports
 */
import {rethinkdb, Decorators as DBDecorators} from '../../core/db';

/**
 * Database tables
 */
const tables = {
    Collection: 'Collections'
};

/**
 * Collection model
 */
class Collection {

    /**
     * Create a new collection
     */
    @DBDecorators.table(tables.Collection)
    static async create({name, tags}) {

        // Insert collection into database
        let obj = {
            name,
            tags,
            images: [],
            enabled: false,
            parentId: null,
            metadata: {},
            createdAt: new Date()
        };
        let insert = await this.table.insert(obj).run();

        // Get collection object and return it
        return await this.table.get(insert.generated_keys[0]).run();
    }

    /**
     * Return collections collection
     */
    @DBDecorators.table(tables.Collection)
    static async find({tags=null}, enabled) {

        // Build query
        let query = this.table.filter((enabled === true) ? {enabled: true} : {});

        // Default sorting: alphabetically
        query = query.orderBy(rethinkdb.asc('name'));

        // Filter by those that contain given tags
        if (tags) {
            query = query.filter(function (collection) {
                return collection('tags').contains(...tags);
            });
        }

        // Execute query and return
        return await query.run();
    }

    /**
     * Return collection with given ID
     */
    @DBDecorators.table(tables.Collection)
    static async get(collectionId) {
        return await this.table.get(collectionId).run();
    }

    /**
     * Update collection
     */
    @DBDecorators.table(tables.Collection)
    static async update(collectionId, {enabled, images, name, tags, metadata, parentId, description=null}) {
        let obj = {
            enabled,
            images,
            name,
            tags,
            metadata,
            updatedAt: new Date()
        };
        if (description != null) {
            obj.description = description;
        }
        if (parentId !== undefined) {
            obj.parentId = parentId;
        }

        // Update collection
        await this.table.get(collectionId).update(obj).run();

        // Fetch collection's latest state and return.
        return await Collection.get(collectionId);
    }
}

/**
 * Export
 */
export {tables, Collection};
