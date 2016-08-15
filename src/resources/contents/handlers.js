/**
 * Imports
 */
import {ErrorName} from '../../core/errors';
import {BadRequest} from '../../core/responses';

import log from './logging';
import {Content} from './models';
import {ContentSerializer} from './serializers';

/**
 * API handler for Contents collection endpoint
 */
class ContentsHandler {

    /**
     * Process GET request
     * Return the Contents's collection
     */
    static async get(request, reply) {

        // Only authenticated Admins can see contents that are not enabled
        let isAdmin = request.auth.credentials && request.auth.credentials.scope && request.auth.credentials.scope.indexOf('admin') !== -1;
        let enabled = !isAdmin;

        try {
            return reply({items: await Content.find({
                type: request.query.type || null,
                collections: request.query.collections ? request.query.collections.split(',') : null,
                tags: request.query.tags ? request.query.tags.split(',') : null
            }, enabled)});
        } catch (err) {
            if (err.name === ErrorName.VALIDATION_ERROR) {
                return reply(BadRequest.invalidParameters('query', {[err.param]: [err.message]})).code(400);
            } else {
                log.error(err, 'Unable to create new content');
                return reply().code(500);
            }
        }
    }

    /**
     * Process POST request
     * Create a new content
     */
    static async post(request, reply) {
        try {
            let content = await Content.create(request.payload);
            return reply(content).code(201);
        } catch (err) {
            if (err.name === ErrorName.VALIDATION_ERROR) {
                return reply(BadRequest.invalidParameters('payload', {[err.param]: [err.message]})).code(400);
            } else {
                log.error(err, 'Unable to create new content');
                return reply().code(500);
            }
        }
    }
}

/**
 * API handler for Content ID endpoint
 */
class ContentIdHandler {

    /**
     * Process GET request
     */
    static async get(request, reply) {
        let content = await Content.get(request.params.contentId);
        // Note: Only authenticated Admins can see contents that are not enabled
        let isAdmin = request.auth.credentials && request.auth.credentials.scope && request.auth.credentials.scope.indexOf('admin') !== -1;
        if (content && (content.enabled === true || isAdmin)) {
            return reply(await new ContentSerializer(content).serialize(true));
        } else {
            return reply().code(404);
        }
    }

    /**
     * Process PUT request
     */
    static async put(request, reply) {

        // Check if content with given ID exists
        let content = await Content.get(request.params.contentId);
        if (!content) {
            return reply().code(404);
        }

        // Update content
        content = await Content.update(request.params.contentId, request.payload);
        return reply(content);
    }
}

/**
 * API handler for Content comments endpoint
 */
class ContentCommentsHandler {

    /**
     * Add new comment
     */
    static async post(request, reply) {

        // Check if content with given ID exists
        let content = await Content.get(request.params.contentId);
        if (!content) {
            return reply().code(404);
        } else if (content.enabled !== true) {
            log.warn({user: request.auth.credentials, contentId: request.params.contentId}, 'User tried to add comment to content that is NOT enabled');
            return reply().code(404);
        }

        // Add comment and return latest state of content
        content = await Content.addComment(request.params.contentId, {
            user: request.auth.credentials,
            message: request.payload.message
        });
        return reply(await new ContentSerializer(content).serialize(true));
    }
}

/**
 * Exports
 */
export {
    ContentsHandler,
    ContentIdHandler,
    ContentCommentsHandler
};
