/**
 * Imports
 */
import Joi from 'joi';

// Data schemas
import {UserSerializer} from './serializers';

// API endpoint handlers
import {UsersHandler} from './handlers';

export default [
    {
        path: '',
        method: 'GET',
        config: {
            handler: {async: UsersHandler.get},
            auth: {
                strategy: 'jwt',
                scope: 'admin'
            },
            description: 'Get users collection',
            tags: ['api'],
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().required()
                }).unknown()
            },
            response: {
                schema: {
                    items: Joi.array().items(UserSerializer.schema)
                }
            }
        }
    }
];
