/**
 * Imports
 */
import Joi from 'joi';

import {getPaymentOptions} from './billing';
import {isReady} from './helpers';
import {Checkout} from './models';
import {getShippingOptions} from './shipping';

/**
 * Class containing schema details and serializer methods for Checkout objects
 */
class CheckoutSerializer {

    static schema = {
        id: Joi.string(),
        archived: Joi.boolean(),
        cart: Joi.object(),
        subTotal: Joi.number(),
        shippingCost: Joi.number(),
        vatTotal: Joi.number(),
        total: Joi.number(),
        currency: Joi.string(),
        customer: Joi.object(),
        shippingAddress: Joi.object(),
        shippingOptions: Joi.array(),
        shippingMethod: Joi.string(),
        billingAddress: Joi.object(),
        paymentOptions: Joi.array(),
        paymentMethod: Joi.string(),
        ready: Joi.boolean(),
        createdAt: Joi.date(),
        updatedAt: Joi.date()
    };

    constructor(checkout) {
        this.checkout = new Checkout(checkout);
    }

    async serialize() {
        return Object.assign({
            subTotal: this.checkout.getSubTotal(),
            shippingOptions: getShippingOptions(this.checkout.model),
            shippingCost: this.checkout.getShippingDetails().price,
            vatTotal: this.checkout.getVatTotal(),
            total: this.checkout.getTotal(),
            paymentOptions: getPaymentOptions(this.checkout.model),
            ready: await isReady(this.checkout.model)
        }, this.checkout.model);
    }
}

/**
 * Exports
 */
export {CheckoutSerializer};
