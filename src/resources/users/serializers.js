/**
 * Imports
 */
import Joi from 'joi';

/**
 * Class containing schema details and serializer methods for User objects
 */
class UserSerializer {

    static schema = {
        id: Joi.string(),
        name: Joi.string(),
        email: Joi.string().email(),
        status: Joi.string(),
        createdAt: Joi.date()
    };

    constructor(user) {
        this.user = Object.assign({}, user);
    }

    async serialize() {
        return this.user;
    }
}

/**
 * Exports
 */
export {UserSerializer};
