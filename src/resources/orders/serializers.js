/**
 * Imports
 */
import Joi from 'joi';

import {Checkout} from '../checkouts/models';
import {CheckoutSerializer} from '../checkouts/serializers';
import {Order} from './models';

/**
 * Class containing schema details and serializer methods for Checkout objects
 */
class OrderSerializer {

    static schema = {
        id: Joi.string(),
        checkoutId: Joi.string(),
        status: Joi.string(),
        createdAt: Joi.date()
    };

    constructor(order) {
        this.order = new Order(order);
    }

    async serialize({appendCheckout=false}) {
        let order = Object.assign({}, this.order.model);
        if (appendCheckout === true) {
            let checkout = await Checkout.get(this.order.model.checkoutId);
            order.checkout = await new CheckoutSerializer(checkout).serialize();
        }
        return order;
    }
}

/**
 * Exports
 */
export {OrderSerializer};
