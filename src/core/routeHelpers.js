/**
 * Imports
 */
import config from '../config';

/**
 * Processes routes, prepending base URL and making any other necessary
 * arrangements so that a module's routes can be included in the main router.
 * @param routes - an object where the keys are the baseURL and their value the respective routes
 * @returns {Array} - the "final" routes
 */
function buildRoutes(routes) {
    var result = [];
    for (let baseUrl in routes) {
        if (routes.hasOwnProperty(baseUrl)) {  // To make sure it's the object itself that has it and not any prototype
            result = result.concat(
                routes[baseUrl].map(r => {

                    //
                    // 1) BASE URL and PREFIX
                    // Process route URL by adding baseUrl and optional prefix
                    //
                    if (config.prefix) {
                        r.path = config.prefix + baseUrl + r.path;
                    } else {
                        r.path = baseUrl + r.path;
                    }

                    //
                    // 2) REQUEST
                    // If route has request validators, set some defaults
                    //
                    if (r.config && r.config.validate) {

                        // a) JOI
                        if (!r.config.validate.hasOwnProperty('options')) {
                            r.config.validate.options = {
                                abortEarly: false, // Make Joi validate all params, instead of stopping on first failure
                                convert: false // Disable automatic casting of types (e.g. number precision, we don't want this!)
                                //allowUnknown: true
                            };
                        } else {
                            if (!r.config.validate.options.hasOwnProperty('abortEarly')) {
                                r.config.validate.options.abortEarly = false;
                            }
                            /*if (!r.config.validate.options.hasOwnProperty('allowUnknown')) {
                                r.config.validate.options.allowUnknown = true;
                            }*/
                        }

                        // b) FAIL ACTION
                        // Add custom failaction method
                        if (!r.config.validate.hasOwnProperty('failAction')) {
                            r.config.validate.failAction = failAction;
                        }
                    }

                    //
                    // 3) RESPONSE
                    // If route has response validators, set some defaults
                    //
                    if (r.config && r.config.response) {

                        // a) JOI
                        if (!r.config.response.hasOwnProperty('options')) {
                            r.config.response.options = {
                                stripUnknown: true // Configure Joi to strip parameters that are not present in schema
                            }
                        } else if (!r.config.response.options.hasOwnProperty('stripUnknown')) {
                            r.config.response.options.stripUnknown = true;
                        }

                        // b) PAYLOAD
                        // By default, apply the validation rule changes to the response payload
                        if (!r.config.response.hasOwnProperty('modify')) {
                            r.config.response.modify = true;
                        }
                    }

                    return r;
                })
            )
        }
    }
    return result;
}

/**
 * Custom handler for route validations. Changes default response data, adding
 * failure details for each key.
 */
function failAction(request, reply, source, error) {
     let response = Object.assign({}, error.output.payload);
     response.message = 'Invalid parameters';
     if (error.data && error.data.details) {
         let details = {};
         error.data.details.forEach(function (detail) {
            if (!details.hasOwnProperty(detail.path)) {
                details[detail.path] = [];
            }
            details[detail.path].push(detail.message);
         });
         response.validation.details = details;
     }
     return reply(response).code(400);
}

/**
 * Exports
 */
export {buildRoutes};
