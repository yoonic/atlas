/**
 * Imports
 */
import Hapi from 'hapi';
import HapiSwagger from 'hapi-swagger';
import Inert from 'inert';
import Vision from 'vision';

import config from './config';
import log from './logging';
import routes from './routes';
import * as db from './core/db';
import {JWTAuthentication} from './core/authentication';

const Pack = require('../package');

/**
 * Server setup
 */
const server = new Hapi.Server({
    connections: {
        router: {
            stripTrailingSlash: true
        }
    }
});

server.connection({
    host: config.app.host,
    port: config.app.port,
    routes: {
        cors: {
            additionalHeaders: [
                'Origin'
            ]
        }
    }
});

// Swagger API Documentation
if (process.env.NODE_ENV !== 'production') {
    const documentationPath = `${config.app.routePrefix || ''}/docs`;
    log.info(`Initializing Swagger API documentation at: ${documentationPath}`);
    server.register([Inert, Vision, {
        register: HapiSwagger,
        options: {
            info: {
                title: 'Atlas eCommerce API',
                version: Pack.version,
            },
            documentationPath: documentationPath,
            pathReplacements: [{
                replaceIn: 'groups',
                pattern: /v([0-9]+)\//,
                replacement: ''
            }],
            tags: [{
                name: 'account',
                description: 'Customer accounts'
            }, {
                name: 'carts',
                description: 'Product shopping carts'
            }, {
                name: 'checkouts',
                description: 'Checkout a cart'
            }, {
                name: 'collections',
                description: 'Group of products'
            }, {
                name: 'contents',
                description: 'Generic content'
            }, {
                name: 'files',
                description: 'Manage files'
            }, {
                name: 'orders',
                description: 'Customer orders'
            }, {
                name: 'products',
                description: 'Manage products'
            }, {
                name: 'users',
                description: 'Manage users'
            }]
        }
    }], function (err) {
        if (err) {
            log.warn(err, 'Unable to setup Swagger API documentation');
        }
    });
}

// Enable async/await handlers
server.register(require('hapi-async-handler'), function (err) {
    if (err) {
        log.fatal(err, 'Unable to register async handlers plugin');
        process.exit(1);
    }
});

// Setup JWT authentication
server.register(require('hapi-auth-jwt2'), function (err) {
    if (err) {
        log.fatal(err, 'Unable to register JWT plugin');
        process.exit(1);
    } else {
        server.auth.strategy('jwt', 'jwt', {
            key: JWTAuthentication.getPrivateKey(),
            validateFunc: JWTAuthentication.validate,
            verifyOptions: {algorithms: ['HS256']}
        });
    }
});

/**
 * Log server errors
 */
server.on('request-error', function (request, err) {
    log.error(err, 'Server Error');
});

/**
 * Routes
 */
server.route({
    method: 'GET',
    path: config.app.routePrefix || '/',
    handler: function (request, reply) {
        reply('oh, hai');
    }
});

server.route(routes);

// Serve Static Files
// *** WARNING ***
// This should only be used for development. In production
// static files should not be served by this application but something
// like nginx.
if (process.env.NODE_ENV !== 'production' && config.uploads.provider === 'atlas') {
    server.register(Inert, function () {});
    server.route({
        method: 'GET',
        path: '/uploads/{fileName*}',
        handler: {
            directory: {
                path: 'uploads',
                redirectToSlash: true,
                listing: true
            }
        }
    });
}

/**
 * Start server
 * a) If database connection was successful and database exists, start application server
 * b) Test fails, abort server init
 */
db.testDatabase().then(function successFn() {
    server.start(function (err) {
        if (err) {
            log.fatal(err, 'Unable to start Atlas server');
        } else {
            log.info(`Atlas running at: ${server.info.uri}${config.app.routePrefix || ''}`);
        }
    });
}, function errorFn(err) {
    log.fatal(err, 'Database init failed');
    process.exit(1);
});
