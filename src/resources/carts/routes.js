/**
 * Imports
 */
import Joi from 'joi';

import routePrerequisites from './routePrerequisites';

// Data schemas
import {CartSerializer} from './serializers';

// API endpoint handlers
import {
    CartsHandler,
    CartIdHandler
} from './handlers';

/**
 * Routes
 */
export default [
    {
        path: '',
        method: 'GET',
        config: {
            handler: {async: CartsHandler.get}
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
            handler: {async: CartsHandler.post},
            auth: {
                mode: 'try',
                strategy: 'jwt'
            },
            description: 'Create a new shopping cart',
            tags: ['api'],
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().optional()
                }).unknown()
            },
            response: {
                schema: CartSerializer.schema
            }
        }
    },
    {
        path: '/{cartId}',
        method: 'GET',
        config: {
            handler: {async: CartIdHandler.get},
            auth: {
                mode: 'try',
                strategy: 'jwt'
            },
            description: 'Get cart',
            notes: 'Returns a cart by the id passed in the path',
            tags: ['api'],
            pre: [routePrerequisites.validCartAndPermissions],
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().optional()
                }).unknown(),
                params: {
                    cartId: Joi.string().required().description('the id for the cart'),
                }
            },
            response: {
                schema: CartSerializer.schema
            }
        }
    },
    {
        path: '/{cartId}',
        method: 'PATCH',
        config: {
            handler: {async: CartIdHandler.patch},
            auth: {
                mode: 'try',
                strategy: 'jwt'
            },
            description: 'Update cart',
            tags: ['api'],
            pre: [routePrerequisites.validCartAndPermissions],
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().optional()
                }).unknown(),
                params: {
                    cartId: Joi.string().required().description('the id for the cart'),
                }
            },
            response: {
                schema: CartSerializer.schema
            }
        }
    }
];
