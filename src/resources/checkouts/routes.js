/**
 * Imports
 */
import Joi from 'joi';

import routePrerequisites from './routePrerequisites';

// Data schemas
import {CheckoutSerializer} from './serializers';

// API endpoint handlers
import {
    CheckoutsHandler,
    CheckoutIdHandler
} from './handlers';

/**
 * Routes
 */
export default [
    {
        path: '',
        method: 'GET',
        config: {
            handler: {async: CheckoutsHandler.get},
            /*auth: {
                strategy: 'jwt',
                scope: ['admin']
            },*/
        }
    },
    {
        path: '',
        method: 'POST',
        config: {
            handler: {async: CheckoutsHandler.post},
            auth: {
                mode: 'try',
                strategy: 'jwt'
            },
            description: 'Create a new checkout',
            tags: ['api'],
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().optional()
                }).unknown(),
                payload: {
                    cartId: Joi.string().required(),
                    shippingAddress: Joi.object().optional(),
                    billingAddress: Joi.object().optional()
                }
            },
            response: {
                schema: CheckoutSerializer.schema
            }
        }
    },
    {
        path: '/{checkoutId}',
        method: 'GET',
        config: {
            handler: {async: CheckoutIdHandler.get},
            auth: {
                mode: 'try',
                strategy: 'jwt'
            },
            description: 'Get checkout',
            notes: 'Returns a checkout by the id passed in the path',
            tags: ['api'],
            pre: [routePrerequisites.validCheckoutAndPermissions],
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().optional()
                }).unknown(),
                params: {
                    checkoutId: Joi.string().required().description('the id for the checkout'),
                }
            },
            response: {
                schema: CheckoutSerializer.schema
            }
        }
    },
    {
        path: '/{checkoutId}',
        method: 'PATCH',
        config: {
            handler: {async: CheckoutIdHandler.patch},
            auth: {
                mode: 'try',
                strategy: 'jwt'
            },
            description: 'Update checkout',
            tags: ['api'],
            pre: [routePrerequisites.validCheckoutAndPermissions],
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().optional()
                }).unknown(),
                params: {
                    checkoutId: Joi.string().required().description('the id for the checkout'),
                }
            },
            response: {
                schema: CheckoutSerializer.schema
            }
        }
    }
];
