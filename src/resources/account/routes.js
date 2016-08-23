/**
 * Imports
 */
import Joi from 'joi';

// Data schemas
import {AccountDetailsSerializer} from './serializers';

// API endpoint handlers
import {
    AccountHandlers,
    AccountLoginHandlers,
    AccountRegisterHandlers,
    AccountResetHandlers
} from './handlers';

/**
 * Routes
 */
export default [
    {
        path: '',
        method: 'GET',
        config: {
            handler: {async: AccountHandlers.get},
            auth: {strategy: 'jwt'},
            description: 'Get user account details',
            tags: ['api'],
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().required()
                }).unknown()
            },
            response: {
                schema: AccountDetailsSerializer.schema
            }
        }
    },
    {
        path: '',
        method: 'PATCH',
        config: {
            handler: {async: AccountHandlers.patch},
            auth: {strategy: 'jwt'},
            description: 'Update account details',
            tags: ['api'],
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().required()
                }).unknown()
            },
            response: {
                schema: AccountDetailsSerializer.schema
            }
        }
    },
    {
        path: '/login',
        method: 'POST',
        config: {
            handler: {async: AccountLoginHandlers.post},
            description: 'Create login session',
            tags: ['api'],
            validate: {
                payload: {
                    email: Joi.string().required(),
                    password: Joi.string().required()
                }
            }
        }
    },
    {
        path: '/register',
        method: 'POST',
        config: {
            handler: {async: AccountRegisterHandlers.post},
            description: 'Register a new account',
            tags: ['api'],
            validate: {
                payload: {
                    name: Joi.string().required(),
                    email: Joi.string().required(),
                    password: Joi.string().min(6).required()
                }
            }
        }
    },
    {
        path: '/register',
        method: 'PATCH',
        config: {
            handler: {async: AccountRegisterHandlers.patch},
            description: 'Activate account',
            notes: 'When an account is registered, an email is sent with a link to confirm the user\'s email. ' +
                'That link contains a token used to activate the newly registered account.',
            tags: ['api'],
            validate: {
                payload: {
                    token: Joi.string().required()
                }
            },
            response: {
                schema: {
                    authToken: Joi.string()
                }
            }
        }
    },
    {
        path: '/reset',
        method: 'POST',
        config: {
            handler: {async: AccountResetHandlers.post},
            description: 'Request password reset',
            tags: ['api'],
            validate: {
                payload: {
                    email: Joi.string().required()
                }
            }
        }
    },
    {
        path: '/reset',
        method: 'PATCH',
        config: {
            handler: {async: AccountResetHandlers.patch},
            description: 'Reset password',
            tags: ['api'],
            validate: {
                payload: {
                    token: Joi.string().required(),
                    password: Joi.string().min(6).required()
                }
            }
        }
    }
];
