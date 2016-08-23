/**
 * Imports
 */
import Joi from 'joi';

// Data schemas
import {ContentSerializer} from './serializers';

// API endpoint handlers
import {
    ContentsHandler,
    ContentIdHandler,
    ContentCommentsHandler
} from './handlers';

/**
 * Routes
 */
export default [
    {
        path: '',
        method: 'GET',
        config: {
            handler: {async: ContentsHandler.get},
            auth: {
                mode: 'try',
                strategy: 'jwt'
            },
            description: 'Get contents collection',
            tags: ['api'],
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().optional()
                }).unknown(),
                query: {
                    type: Joi.string().optional(),
                    tags: Joi.string().optional(),
                    collections: Joi.string().optional()
                }
            }
        }
    },
    {
        path: '',
        method: 'POST',
        config: {
            handler: {async: ContentsHandler.post},
            auth: {
                strategy: 'jwt',
                scope: ['admin']
            },
            description: 'Create new content',
            tags: ['api'],
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().required()
                }).unknown(),
                payload: {
                    type: Joi.string().required(),
                    name: Joi.object().required()
                }
            },
            response: {
                schema: {
                    id: Joi.string(),
                    type: Joi.string(),
                    name: Joi.object()
                }
            }
        }
    },
    {
        path: '/{contentId}',
        method: 'GET',
        config: {
            handler: {async: ContentIdHandler.get},
            auth: {
                mode: 'try',
                strategy: 'jwt'
            },
            description: 'Get content',
            tags: ['api'],
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().optional()
                }).unknown(),
                params: {
                    contentId: Joi.string().required().description('the id for the content'),
                },
            },
            response: {
                schema: ContentSerializer.schema
            }
        }
    },
    {
        path: '/{contentId}',
        method: 'PUT',
        config: {
            handler: {async: ContentIdHandler.put},
            auth: {
                strategy: 'jwt',
                scope: ['admin']
            },
            description: 'Update content',
            tags: ['api'],
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().required()
                }).unknown(),
                params: {
                    contentId: Joi.string().required().description('the id for the content'),
                },
                payload: {
                    enabled: Joi.boolean().required(),
                    collections: Joi.array().required(),
                    name: Joi.object({
                        en: Joi.string().required(),
                        pt: Joi.string().required()
                    }).required(),
                    tags: Joi.array().required(),
                    metadata: Joi.object().required(),
                    body: Joi.object().required(),
                    images: Joi.array({
                        url: Joi.string().required()
                    }).required()
                }
            }
        }
    },
    {
        path: '/{contentId}/comments',
        method: 'POST',
        config: {
            handler: {async: ContentCommentsHandler.post},
            auth: {
                strategy: 'jwt'
            },
            description: 'Add user comment',
            tags: ['api'],
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().required()
                }).unknown(),
                params: {
                    contentId: Joi.string().required().description('the id for the content'),
                },
                payload: {
                    message: Joi.string().required()
                }
            },
            response: {
                schema: ContentSerializer.schema
            }
        }
    }
];
