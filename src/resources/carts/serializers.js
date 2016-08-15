/**
 * Imports
 */
import Joi from 'joi';

import {Product} from '../products/models';

/**
 * Class containing schema details and serializer methods for Cart objects
 */
class CartSerializer {

    static schema = {
        id: Joi.string(),
        mergedWith: Joi.string(),
        archived: Joi.boolean(),
        accessToken: Joi.string(),
        userId: Joi.string(),
        products: Joi.array(),
        createdAt: Joi.date(),
        updatedAt: Joi.date()
    };

    constructor(cart) {
        this.cart = Object.assign({}, cart);
    }

    async serialize() {

        // 1) Fetch product details for each product of the cart
        // 2) Add details to cart products
        let productIds = this.cart.products.map(function (product) { return product.id; });
        if (productIds.length > 0) {
            let products = await Product.getAll(productIds);
            products.forEach((product) => {
                for (let i=0, len=this.cart.products.length; i<len; i++) {
                    if (this.cart.products[i].id === product.id) {
                        this.cart.products[i].details = product;
                    }
                }
            });
        }

        // 3) Return
        return this.cart;
    }
}

/**
 * Exports
 */
export {CartSerializer};
