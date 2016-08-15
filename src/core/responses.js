/**
 * This class contains helper methods for building Bad Request API responses
 * so that there is a uniform response/structure through the application
 */
class BadRequest {

    /**
     * When the one or more parameters fail validation
     * @param source - Data source (payload, params, headers, etc)
     * @param detail - An object where each key is the parameter that failed validation
     *                 and, for each one, and array of detail messages
     */
    static invalidParameters(source, detail) {
        return {
            statusCode: 400,
            error: 'BadRequest',
            message: 'Invalid parameters',
            validation: {
                source: source,
                keys: Object.keys(detail),
                details: detail
            }
        };
    }
}

/**
 * Exports
 */
export {BadRequest};
