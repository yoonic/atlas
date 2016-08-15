/**
 * Imports
 */
import {BadRequest} from '../../core/responses';
import {hasKeys} from '../../core/utils';
import {Product} from '../products/models';
import {Cart} from './models';
import {CartSerializer} from './serializers';

/**
 * API handler for Carts collection endpoint
 */
class CartsHandler {

    /**
     * Process GET request
     * Return the carts's collection
     */
    static async get(request, reply) {
        return reply({helo: 'world'});
    }

    /**
     * Process POST request
     * Create a new cart
     */
    static async post(request, reply) {
        let userId = request.auth.credentials ? request.auth.credentials.id : null;
        return reply(await Cart.create(userId)).code(201);
    }
}

/**
 * API handler for Cart ID endpoint
 */
class CartIdHandler {

    /**
     * Process GET request
     * Return cart with given ID
     */
    static async get(request, reply) {

        // Appropriate ID/permission validations should have been done in route prerequisites
        return reply(await new CartSerializer(request.pre.cart).serialize());
    }

    /**
     * Process PATCH request
     * Partial updates of a given Cart
     */
    static async patch(request, reply) {

        // Appropriate ID/permission validations should have been done in route prerequisites
        let cartId = request.pre.cart.id;
        let cart;

        // Check if cart is not archived
        if (request.pre.cart.archived === true) {
            return reply(BadRequest.invalidParameters('payload', {cart: ['Archived']})).code(400);
        }

        // Validate payload and make respective updates
        if (hasKeys(request.payload, ['userId'])) {
            if (request.payload.userId === '') {
                return reply(BadRequest.invalidParameters('payload', {userId: ['This field is required']})).code(400);
            } else {
                cart = await Cart.updateUserId(cartId, request.payload.userId);
            }
        } else if (hasKeys(request.payload, ['mergeId'])) {
            if (request.payload.mergeId === '') {
                return reply(BadRequest.invalidParameters('payload', {mergeId: ['This field is required']})).code(400);
            } else {
                let mergeCart = await Cart.get(request.payload.mergeId);
                if (mergeCart.userId !== request.auth.credentials.id) {
                    return reply(BadRequest.invalidParameters('payload', {mergeId: ['Invalid']})).code(400);
                } else if (mergeCart.archived === true) {
                    return reply(BadRequest.invalidParameters('payload', {mergeId: ['Archived']})).code(400);
                } else {
                    cart = await Cart.merge(cartId, mergeCart, true);
                }
            }
        } else if (hasKeys(request.payload, ['archive'])) {
            if (request.payload.archive === true) {
                cart = await Cart.archive(cartId);
            }
        } else if (hasKeys(request.payload, ['product'])) {
            if (!request.payload.product.hasOwnProperty('id') || request.payload.product.id === '') {
                return reply(BadRequest.invalidParameters('payload', {'product.id': ['This field is required']})).code(400);
            } else if (!request.payload.product.hasOwnProperty('quantity') || request.payload.product.quantity === '') {
                return reply(BadRequest.invalidParameters('payload', {'product.quantity': ['This field is required']})).code(400);
            } else if (isNaN(parseInt(request.payload.product.quantity))) {
                return reply(BadRequest.invalidParameters('payload', {'product.quantity': ['Must be an integer']})).code(400);
            } else {
                let product = await Product.get(request.payload.product.id);
                if (!product || product.enabled !== true) {
                    return reply(BadRequest.invalidParameters('payload', {'product.id': ['Invalid']})).code(400);
                } else if (product.stock < request.payload.product.quantity) {
                    return reply(BadRequest.invalidParameters('payload', {'product.quantity': ['Not enough in stock']})).code(400);
                } else {
                    cart = await Cart.updateProduct(cartId, request.payload.product.id, request.payload.product.quantity);
                }
            }
        } else {
            return reply({message: 'Invalid payload'}).code(400);
        }

        // Return
        return reply(await new CartSerializer(cart).serialize());
    }
}

/**
 * Exports
 */
export {CartsHandler, CartIdHandler};
