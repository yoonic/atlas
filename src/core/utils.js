/**
 * Imports
 */
import crypto from 'crypto';

/**
 * Returns whether the given object contains a set of keys
 * @param obj - The object being evaluated
 * @param keys - The array of keys
 * @param ignoreUnknown (optional, default: false)
 *     - If true, ignore any unknown keys
 *     - If false, fail if there are keys not present in the keys array
 */
function hasKeys(obj, keys, ignoreUnknown) {
    if (!obj) {
        return false;
    }
    let objectKeys = Object.keys(obj);
    let validateFn = function (item) {
        return keys.indexOf(item) !== -1;
    };
    if (ignoreUnknown) {
        return objectKeys.filter(validateFn).length === keys.length;
    } else {
        return objectKeys.length === keys.length && objectKeys.every(validateFn);
    }
}

/**
 * Returns whether or not a given object has values for a set of keys (i.e. not null or empty string)
 * @param obj - the object to analyze
 * @param keys - the array of keys
 */
function hasValue(obj, keys) {
    let result = true;
    keys.forEach(function (key) {
        if (!obj.hasOwnProperty(key) || obj[key] == '') {
            result = false;
        }
    });
    return result;
}

/**
 * Return a randomly generated string
 * @param len - the length of the string, must be a positive integer
 * @returns {string}
 */
function getRandomString(len) {
    if (len <= 0) {
        throw new Error('Length must be a positive integer');
    }
    let possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = crypto.randomBytes(Math.floor(len/2)).toString('hex');
    for(let i=0; i < len%2; i++) {
        result += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
    }
    return result;
}

/**
 * Exports
 */
export {
    hasKeys,
    hasValue,
    getRandomString
};
