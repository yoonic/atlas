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
            description: 'Get products collection',
            tags: ['api'],
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().optional()
                }).unknown(),
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
            description: 'Create new product',
            tags: ['api'],
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().required()
                }).unknown(),
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
            },
            description: 'Get product',
            tags: ['api'],
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().optional()
                }).unknown(),
                params: {
                    productId: Joi.string().required().description('the id for the product'),
                }
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
            description: 'Update all product details',
            tags: ['api'],
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().required()
                }).unknown(),
                params: {
                    productId: Joi.string().required().description('the id for the product'),
                },
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
            },
            description: 'Partial product update',
            tags: ['api'],
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().required()
                }).unknown(),
                params: {
                    productId: Joi.string().required().description('the id for the product'),
                }
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
            description: 'Upload catalog information',
            notes: 'Product content CSV and bulk image operations can be done using this endpoint',
            tags: ['api'],
            payload: {
                output: 'stream',
                parse: true
            },
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().required()
                }).unknown(),
                payload: {
                    resource: Joi.string().required(),
                    file: Joi.object().optional(),
                    action: Joi.string().optional()
                }
            }
        }
    }
];
