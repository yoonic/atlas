/**
 * Imports
 */
import Joi from 'joi';

// API endpoint handlers
import {FileHandlers} from './handlers';

/**
 * Routes
 */
export default [
    {
        path: '',
        method: 'POST',
        config: {
            handler: {async: FileHandlers.post},
            auth: {
                strategy: 'jwt',
                scope: ['admin']
            },
            description: 'Upload file',
            tags: ['api'],
            payload: {
                maxBytes: 10048576,
                output: 'stream',
                parse: true
            },
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().required()
                }).unknown(),
                payload: {
                    file: Joi.object().required(),
                    resource: Joi.string().required()
                }
            }
        }
    }
];
