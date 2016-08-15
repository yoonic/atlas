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
            validate: {
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
            validate: {
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
            validate: {
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
            validate: {
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
