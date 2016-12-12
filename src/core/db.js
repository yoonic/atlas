/**
 * Imports
 */
import config from '../config';
import log from './logging';

/**
 * Import and initialize RethinkDB connection pool
 */
const rethinkdb = require('rethinkdbdash')({servers: config.database.servers});

/**
 * Test if application's database exists
 */
async function testDatabase() {
    return new Promise(async function (resolve, reject) {
        try {
            let dbExists = !!(await rethinkdb.dbList()).includes(config.database.name);
            if (!dbExists) {
                log.info(`No Database found, creating a new one.`);
                rethinkdb.dbCreate(config.database.name).run();
                rethinkdb.db(config.database.name).tableCreate("Carts").run();
                rethinkdb.db(config.database.name).tableCreate("Checkouts").run();
                rethinkdb.db(config.database.name).tableCreate("Collections").run();
                rethinkdb.db(config.database.name).tableCreate("Contents").run();
                rethinkdb.db(config.database.name).tableCreate("Orders").run();
                rethinkdb.db(config.database.name).tableCreate("Products").run();
                rethinkdb.db(config.database.name).tableCreate("Users").run();
                return resolve();
            } else {
                return resolve();
            }
        } catch (err) {
            reject(err);
        }

    });
}

/**
 * Decorators
 */
class Decorators {

    /**
     * @param tableName
     * @returns {Function}
     */
    static table(tableName) {
        let wrapper = function (tableName, method) {
            if (typeof method != 'function') {
                throw {
                    message: 'decorator must be applied to a function'
                }
            }
            return async function () {
                try {
                    let method_ = method.bind({
                        table: rethinkdb.db(config.database.name).table(tableName)
                    });
                    var result = await method_.call(this, ...arguments); // call method
                } catch (err) {
                    throw err;
                }
                return result;
            }
        };
        return function decorator(target, key, descriptor) {
            descriptor.value = wrapper(tableName, descriptor.value);
            return descriptor;
        };
    }
}

/**
 * Exports
 */
export {rethinkdb, testDatabase, Decorators};
