/**
 * Imports
 */
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
            pre: [routePrerequisites.validCartAndPermissions],
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
            pre: [routePrerequisites.validCartAndPermissions],
            response: {
                schema: CartSerializer.schema
            }
        }
    }
];
