/**
 * Imports
 */
import {BadRequest} from '../../core/responses';
import log from './logging';
import {processUpload} from './utils';

/**
 * Handlers for the Files "collection" endpoint
 */
class FileHandlers {

    /**
     * Process file upload
     */
    static async post(request, reply) {

        // Validate payload
        if (['collections', 'contents', 'products'].indexOf(request.payload.resource) === -1) {
            return reply(BadRequest.invalidParameters('payload', {resource: ['Invalid']})).code(400);
        }

        // Process upload and return accordingly
        try {
            let result = await processUpload(request.payload.resource, request.payload.file);
            return reply(result).code(201);
        } catch (err) {
            log.error(err, 'Unable to process file upload');
            return reply().code(500);
        }
    }
}

/**
 * Exports
 */
export {FileHandlers};
