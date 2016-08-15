/**
 * Automatically hook babel into all node requires.
 */
require('babel/register')({
    optional: ['es7.asyncFunctions', 'es7.classProperties', 'es7.decorators']
});

/**
 * Execute requested script
 */
var resource = process.argv[2];
var script = process.argv[3] || '';
try {
    require('./src/resources/' + resource + '/scripts/' + script)(process.argv.slice(4));
} catch (err) {
    console.log('Invalid script');
}
