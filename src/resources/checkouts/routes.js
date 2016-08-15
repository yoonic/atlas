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
            validate: {
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
            pre: [routePrerequisites.validCheckoutAndPermissions],
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
            pre: [routePrerequisites.validCheckoutAndPermissions],
            response: {
                schema: CheckoutSerializer.schema
            }
        }
    }
];
