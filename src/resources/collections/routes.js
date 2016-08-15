/**
 * Imports
 */
import Joi from 'joi';

// API endpoint handlers
import {
    CollectionsHandler,
    CollectionIdHandler
} from './handlers';

/**
 * Routes
 */
export default [
    {
        path: '',
        method: 'GET',
        config: {
            handler: {async: CollectionsHandler.get},
            auth: {
                mode: 'try',
                strategy: 'jwt'
            },
            validate: {
                query: {
                    tags: Joi.string().optional()
                }
            }
        }
    },
    {
        path: '',
        method: 'POST',
        config: {
            handler: {async: CollectionsHandler.post},
            auth: {
                strategy: 'jwt',
                scope: ['admin']
            },
            validate: {
                payload: {
                    name: Joi.object().required(),
                    tags: Joi.array().required()
                }
            },
            response: {
                schema: {
                    id: Joi.string(),
                    name: Joi.object(),
                    tags: Joi.array()
                }
            }
        }
    },
    {
        path: '/{collectionId}',
        method: 'GET',
        config: {
            handler: {async: CollectionIdHandler.get},
            auth: {
                mode: 'try',
                strategy: 'jwt'
            }
        }
    },
    {
        path: '/{collectionId}',
        method: 'PUT',
        config: {
            handler: {async: CollectionIdHandler.put},
            auth: {
                strategy: 'jwt',
                scope: ['admin']
            },
            validate: {
                payload: {
                    enabled: Joi.boolean().required(),
                    name: Joi.object({
                        en: Joi.string().required(),
                        pt: Joi.string().required()
                    }).required(),
                    description: Joi.object().optional(),
                    tags: Joi.array().required(),
                    images: Joi.array({
                        url: Joi.string().required()
                    }).required(),
                    parentId: Joi.any().optional(),
                    metadata: Joi.object().required()
                }
            }
        }
    }
];
