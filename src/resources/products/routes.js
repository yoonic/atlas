/**
 * Imports
 */
import Joi from 'joi';

// API endpoint handlers
import {
    ProductsHandler,
    ProductIdHandler,
    ProductsUploadHandler
} from './handlers';

/**
 * Routes
 */
export default [
    {
        path: '',
        method: 'GET',
        config: {
            handler: {async: ProductsHandler.get},
            auth: {
                mode: 'try',
                strategy: 'jwt'
            },
            validate: {
                query: {
                    sku: Joi.string().optional(),
                    collections: Joi.string().optional(),
                    tags: Joi.string().optional(),
                    sort: Joi.string().optional(),
                    perPage: Joi.string().optional(),
                    page: Joi.string().optional()
                }
            }
        }
    },
    {
        path: '',
        method: 'POST',
        config: {
            handler: {async: ProductsHandler.post},
            auth: {
                strategy: 'jwt',
                scope: ['admin']
            },
            validate: {
                payload: {
                    sku: Joi.string().required(),
                    name: Joi.object({
                        en: Joi.string().required(),
                        pt: Joi.string().required()
                    }).required()
                }
            }
        }
    },
    {
        path: '/{productId}',
        method: 'GET',
        config: {
            handler: {async: ProductIdHandler.get},
            auth: {
                mode: 'try',
                strategy: 'jwt'
            }
        }
    },
    {
        path: '/{productId}',
        method: 'PUT',
        config: {
            handler: {async: ProductIdHandler.put},
            auth: {
                strategy: 'jwt',
                scope: ['admin']
            },
            validate: {
                payload: {
                    enabled: Joi.boolean().required(),
                    sku: Joi.string().required(),
                    name: Joi.object({
                        en: Joi.string().required(),
                        pt: Joi.string().required()
                    }).required(),
                    description: Joi.object({
                        en: Joi.string().required(),
                        pt: Joi.string().required()
                    }).required(),
                    images: Joi.array({
                        url: Joi.string().required()
                    }).required(),
                    pricing: Joi.object({
                        currency: Joi.string().required(),
                        list: Joi.number().precision(2).required(),
                        retail: Joi.number().precision(2).required(),
                        vat: Joi.number().required()
                    }).required(),
                    stock: Joi.number().required(),
                    tags: Joi.array().required(),
                    collections: Joi.array().required(),
                    metadata: Joi.object().required()
                }
            }
        }
    },
    {
        path: '/{productId}',
        method: 'PATCH',
        config: {
            handler: {async: ProductIdHandler.patch},
            auth: {
                strategy: 'jwt',
                scope: ['admin']
            }
        }
    },
    {
        path: '/upload',
        method: 'POST',
        config: {
            handler: {async: ProductsUploadHandler.post},
            auth: {
                strategy: 'jwt',
                scope: ['admin']
            },
            payload: {
                output: 'stream',
                parse: true
            },
            validate: {
                payload: {
                    resource: Joi.string().required(),
                    file: Joi.object().optional(),
                    action: Joi.string().optional()
                }
            }
        }
    }
];
