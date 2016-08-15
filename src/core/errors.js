/**
 * ENUM of custom Errors and Exceptions
 */
const ErrorName = {
    PERMISSION_DENIED: 'PermissionDenied',
    VALIDATION_ERROR: 'ValidationError'
};

/**
 * Custom Error to be thrown when validations such as updating a model field
 * (e.g. check if SKU is being used) fail and should be propagated to the API response
 */
class ValidationError extends Error {
    constructor(param, message) {
        super(message);
        this.name = ErrorName.VALIDATION_ERROR;
        this.param = param;
        this.message = message;
    }
}

/**
 * Custom Error to be thrown when user does not have the required permissions to do
 * whatever he is attempting to do (e.g. fetching a checkout that does not belong to him)
 */
class PermissionDenied extends Error {
    constructor(message) {
        super(message);
        this.name = ErrorName.PERMISSION_DENIED;
        this.message = message;
    }
}

/**
 * Exports
 */
export {ErrorName, ValidationError, PermissionDenied};
