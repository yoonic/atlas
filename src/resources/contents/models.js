/**
 * Imports
 */
import {rethinkdb, Decorators as DBDecorators} from '../../core/db';
import {ValidationError} from '../../core/errors';

/**
 * Database tables
 */
const tables = {
    Content: 'Contents'
};

/**
 * Enum of available content types
 */
const ContentType = {
    ARTICLE: 'article',
    BANNER: 'banner'
};

/**
 * Base object structure for each of the supported content types
 */
const ContentBodyBase = {
    [ContentType.ARTICLE]: {
        markdown: {},
        summary: {}
    },
    [ContentType.BANNER]: {
        image: {},
        link: ''
    }
};

/**
 * Content model
 */
class Content {

    /**
     * Create a new content
     */
    @DBDecorators.table(tables.Content)
    static async create({type, name}) {

        // Validate content type
        if (Object.keys(ContentType).map(function (key) { return ContentType[key]; }).indexOf(type) == -1) {
            throw new ValidationError('type', 'Invalid');
        }

        // Insert content into database
        let obj = {
            enabled: false,
            type,
            name,
            body: ContentBodyBase[type],
            images: [],
            collections: [],
            tags: [],
            metadata: {},
            comments: [],
            createdAt: new Date()
        };
        let insert = await this.table.insert(obj).run();

        // Get content object and return it
        return await this.table.get(insert.generated_keys[0]).run();
    }

    /**
     * Return contents collection
     */
    @DBDecorators.table(tables.Content)
    static async find({type=null, collections=null, tags=null}, enabled) {

        // Build query
        let query = this.table.filter((enabled === true) ? {enabled: true} : {});
        if (type) {
            if (Object.keys(ContentType).map(function (key) { return ContentType[key]; }).indexOf(type) == -1) {
                throw new ValidationError('type', 'Invalid');
            } else {
                query = query.filter({type: type});
            }
        }
        if (collections) {
            query = query.filter(function (content) {
                return content('collections').contains(...collections);
            });
        }
        if (tags) {
            query = query.filter(function (content) {
                return content('tags').contains(...tags);
            });
        }

        // Sort by most recent to older
        query = query.orderBy(rethinkdb.desc('createdAt'));

        // Execute query and return
        return await query.run();
    }

    /**
     * Return content with given ID
     */
    @DBDecorators.table(tables.Content)
    static async get(contentId) {
        return await this.table.get(contentId).run();
    }

    /**
     * Update content
     */
    @DBDecorators.table(tables.Content)
    static async update(contentId, {collections, enabled, images, name, tags, metadata, body}) {

        // Update content
        await this.table.get(contentId).update({
            collections,
            enabled,
            images,
            name,
            tags,
            metadata,
            body,
            updatedAt: new Date()
        }).run();

        // Fetch contents's latest state and return.
        return await Content.get(contentId);
    }

    /**
     * Add a new comment
     */
    @DBDecorators.table(tables.Content)
    static async addComment(contentId, {user, message}) {

        // Append new comment
        let commentId = await rethinkdb.uuid();
        await this.table.get(contentId).update({
            comments: rethinkdb.row('comments').prepend({
                id: commentId,
                userId: user.id,
                message: message,
                createdAt: new Date()
            })
        }).run();

        // Fetch contents's latest state and return.
        return await Content.get(contentId);
    }
}

/**
 * Export
 */
export {tables, Content};
