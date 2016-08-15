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
            validate: {
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
            pre: [routePrerequisites.validOrder]
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
            pre: [routePrerequisites.validOrder]
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
            validate: {
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
            handler: {async: SwitchPaymentsWebhookHandler.post}
        }
    }
];
