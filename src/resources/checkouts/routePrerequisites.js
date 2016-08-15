import {ErrorName} from '../../core/errors';
import {Cart} from '../carts/models';
import log from './logging';
import {Checkout} from './models';

export default {
    validCheckoutAndPermissions: {
        method: async function (request, reply) {

            // Check if checkout with given ID exists
            let checkout = await Checkout.get(request.params.checkoutId);
            if (!checkout) {
                return reply().code(404).takeover();
            }

            // Check if user has permission
            // (permissions are "inherited" from cart, since all checkouts require one cart)
            try {
                let cart = await Cart.getIfAllowed(checkout.cart.id, request.auth.credentials, request.query.accessToken);
                if (!cart) {
                    return reply().code(404).takeover();
                } else {
                    return reply(checkout);
                }
            } catch (err) {
                if (err.name === ErrorName.PERMISSION_DENIED) {
                    return reply().code(403).takeover();
                } else {
                    log.error(err, 'Unable to get cart');
                    return reply().code(500).takeover();
                }
            }
        },
        assign: 'checkout'
    }
};
