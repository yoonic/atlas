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
            validate: {
                payload: {
                    token: Joi.string().required(),
                    password: Joi.string().min(6).required()
                }
            }
        }
    }
];
