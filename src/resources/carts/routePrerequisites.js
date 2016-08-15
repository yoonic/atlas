import {ErrorName} from '../../core/errors';
import {Cart} from './models';
import log from './logging';

export default {
    validCartAndPermissions: {
        method: async function (request, reply) {
            try {
                let cart = await Cart.getIfAllowed(request.params.cartId, request.auth.credentials, request.query.accessToken);
                if (!cart) {
                    return reply().code(404).takeover();
                } else {
                    return reply(cart);
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
        assign: 'cart'
    }
};
