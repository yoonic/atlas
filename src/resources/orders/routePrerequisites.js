import {Order} from './models';

export default {
    validOrder: {
        method: async function (request, reply) {
            // Check if order with given ID exists
            let order = await Order.get(request.params.orderId);
            if (!order) {
                return reply().code(404).takeover();
            } else {
                return reply(order);
            }
        },
        assign: 'order'
    }
};
