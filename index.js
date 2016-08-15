/**
 * Automatically hook babel into all node requires.
 */
require('babel/register')({
    optional: ['es7.asyncFunctions', 'es7.classProperties', 'es7.decorators']
});

/**
 * Start application server.
 */
require('./src/server');
