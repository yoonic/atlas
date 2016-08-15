/**
 * Imports
 */
import Hapi from 'hapi';
import Inert from 'inert';

import config from './config';
import log from './logging';
import routes from './routes';
import * as db from './core/db';
import {JWTAuthentication} from './core/authentication';

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
    path: '/',
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
            log.info('Atlas running at:', server.info.uri);
        }
    });
}, function errorFn(err) {
    log.fatal(err, 'Database init failed');
    process.exit(1);
});
