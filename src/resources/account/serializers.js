/**
 * Imports
 */
import Joi from 'joi';

import {Cart} from '../carts/models';

/**
 * Class containing schema details and serializer methods for User Account objects
 */
class AccountDetailsSerializer {

    static schema = {
        id: Joi.string(),
        name: Joi.string(),
        email: Joi.string().email(),
        addresses: Joi.array(),
        carts: Joi.array(),
        scope: Joi.array(),
        createdAt: Joi.date()
    };

    constructor(user) {
        this.user = Object.assign({}, user);
    }

    async serialize() {
        let carts = await Cart.find({userId: this.user.id}, false);
        return Object.assign({carts: carts}, this.user);
    }
}

/**
 * Exports
 */
export {AccountDetailsSerializer};
