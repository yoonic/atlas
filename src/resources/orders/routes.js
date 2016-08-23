/**
 * Imports
 */
import Joi from 'joi';

import routePrerequisites from './routePrerequisites';

// Data schemas
import {OrderSerializer} from './serializers';

// API endpoint handlers
import {
    OrdersHandler,
    OrderIdHandler,
    OrderEmailHandler,
    SwitchPaymentsWebhookHandler
} from './handlers';

/**
 * Routes
 */
export default [
    {
        path: '',
        method: 'GET',
        config: {
            handler: {async: OrdersHandler.get},
            auth: {
                strategy: 'jwt'
            },
            description: 'Get orders collection',
            tags: ['api'],
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().required()
                }).unknown(),
            }
        }
    },
    {
        path: '',
        method: 'POST',
        config: {
            handler: {async: OrdersHandler.post},
            auth: {
                mode: 'try',
                strategy: 'jwt'
            },
            description: 'Create a new order',
            tags: ['api'],
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().optional()
                }).unknown(),
                payload: {
                    checkoutId: Joi.string().required()
                }
            },
            response: {
                schema: OrderSerializer.schema
            }
        }
    },
    {
        path: '/{orderId}',
        method: 'GET',
        config: {
            handler: {async: OrderIdHandler.get},
            auth: {
                strategy: 'jwt'
            },
            description: 'Get order',
            tags: ['api'],
            pre: [routePrerequisites.validOrder],
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().required()
                }).unknown(),
                params: {
                    orderId: Joi.string().required().description('the id for the order'),
                }
            }
        }
    },
    {
        path: '/{orderId}',
        method: 'PATCH',
        config: {
            handler: {async: OrderIdHandler.patch},
            auth: {
                strategy: 'jwt',
                scope: ['admin']
            },
            description: 'Update order',
            tags: ['api'],
            pre: [routePrerequisites.validOrder],
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().required()
                }).unknown(),
                params: {
                    orderId: Joi.string().required().description('the id for the order'),
                }
            }
        }
    },
    {
        path: '/{orderId}/email',
        method: 'POST',
        config: {
            handler: {async: OrderEmailHandler.post},
            auth: {
                strategy: 'jwt',
                scope: ['admin']
            },
            description: 'Send transactional email',
            notes: 'This endpoint enables manual triggering of certain transactional emails',
            tags: ['api'],
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().required()
                }).unknown(),
                params: {
                    orderId: Joi.string().required().description('the id for the order'),
                },
                payload: {
                    template: Joi.string().required(),
                    email: Joi.string().required(),
                    subject: Joi.string().required()
                }
            }
        }
    },
    {
        path: '/{orderId}/spwh',
        method: 'POST',
        config: {
            handler: {async: SwitchPaymentsWebhookHandler.post},
            description: 'Switch Payments webhook',
            tags: ['api'],
            validate: {
                params: {
                    orderId: Joi.string().required().description('the id for the order'),
                }
            }

        }
    }
];
