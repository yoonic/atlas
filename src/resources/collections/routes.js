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
            description: 'Get all the collections',
            tags: ['api'],
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().optional()
                }).unknown(),
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
            description: 'Create new collection',
            tags: ['api'],
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().required()
                }).unknown(),
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
            },
            description: 'Get collection',
            notes: 'Returns a collection by the id passed in the path',
            tags: ['api'],
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().optional()
                }).unknown(),
                params: {
                    collectionId: Joi.string().required().description('the id for the collection'),
                }
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
            description: 'Update collection',
            tags: ['api'],
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().required()
                }).unknown(),
                params: {
                    collectionId: Joi.string().required().description('the id for the collection'),
                },
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
