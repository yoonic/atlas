/**
 * Imports
 */
import Joi from 'joi';

/**
 * Class containing schema details and serializer methods for Product objects
 */
class ProductSerializer {

    static schema = {
        enabled: Joi.boolean(),
        sku: Joi.string(),
        name: Joi.object({
            en: Joi.string(),
            pt: Joi.string()
        }),
        description: Joi.object({
            en: Joi.string(),
            pt: Joi.string()
        }),
        images: Joi.array({
            url: Joi.string()
        }),
        pricing: Joi.object({
            currency: Joi.string(),
            list: Joi.number().precision(2), // Manufacturer's suggested retail price (MSRP)
            retail: Joi.number().precision(2) // The price of a good or product when it is sold to the end user for consumption, not for resale through a third-party distribution channel
        }),
        stock: Joi.number(),
        tags: Joi.array(),
        collections: Joi.array(),
        metadata: Joi.object()
    };

    constructor(product) {
        this.product = Object.assign({}, product);
    }

    async serialize() {
        return this.product;
    }
}

/**
 * Exports
 */
export {ProductSerializer};
