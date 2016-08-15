/**
 * Imports
 */
import Joi from 'joi';

import {sanitizeEmailAddress} from '../../core/email';
import {ErrorName} from '../../core/errors';
import {BadRequest} from '../../core/responses';
import {hasKeys} from '../../core/utils';
import {Cart} from '../carts/models';
import log from './logging';
import {Checkout} from './models';
import {CheckoutSerializer} from './serializers';

import {getShippingOptions} from './shipping';

/**
 * API handler for Checkout collection endpoint
 */
class CheckoutsHandler {

    /**
     * Process GET request
     * Return the checkout's collection
     */
    static async get(request, reply) {
        return reply({helo: 'checkout world'});
    }

    /**
     * Process POST request
     * Create a new checkout
     */
    static async post(request, reply) {

        // Validate cart/permissions
        let cart;
        try {
            cart = await Cart.getIfAllowed(request.payload.cartId, request.auth.credentials, request.query.accessToken);
            if (!cart) {
                return reply(BadRequest.invalidParameters('payload', {cartId: ['Invalid']})).code(400);
            } else if (cart.archived === true) {
                return reply(BadRequest.invalidParameters('payload', {cartId: ['Archived']})).code(400);
            }
        } catch (err) {
            if (err.name === ErrorName.PERMISSION_DENIED) {
                return reply(BadRequest.invalidParameters('payload', {cartId: ['Invalid']})).code(400);
            } else {
                log.error({where: 'CheckoutsHandler.post'}, 'Unable to get cart');
                log.error(err);
                return reply().code(500);
            }
        }

        // Cart must have products
        if (!cart.products || cart.products.length === 0) {
            return reply(BadRequest.invalidParameters('payload', {'cart.products': ['Cannot be empty']})).code(400);
        }

        // Create checkout
        let checkout = await Checkout.create(request.payload);

        // Return
        return reply(await new CheckoutSerializer(checkout).serialize()).code(201);
    }
}

/**
 * API handler for Checkout ID endpoint
 */
class CheckoutIdHandler {

    /**
     * Process GET request
     * Return checkout with given ID
     */
    static async get(request, reply) {

        // Appropriate ID/permission validations should have been done in route prerequisites
        return reply(await new CheckoutSerializer(request.pre.checkout).serialize());
    }

    /**
     * Process PATCH request
     * Partial updates of a given Checkout
     */
    static async patch(request, reply) {

        // Appropriate ID/permission validations should have been done in route prerequisites
        let checkoutId = request.pre.checkout.id;
        let checkout;

        // Check if cart is not archived
        if (request.pre.checkout.archived === true) {
            return reply(BadRequest.invalidParameters('payload', {checkout: ['Archived']})).code(400);
        }

        // Validate payload and make respective updates
        if (hasKeys(request.payload, ['customer'])) {
            if (request.payload.customer === '') {
                return reply(BadRequest.invalidParameters('payload', {customer: ['This field is required']})).code(400);
            } else if (!request.payload.customer.name) {
                return reply(BadRequest.invalidParameters('payload', {'customer.name': ['This field is required']})).code(400);
            } else if (!request.payload.customer.email) {
                return reply(BadRequest.invalidParameters('payload', {'customer.email': ['This field is required']})).code(400);
            } else {
                // Sanitize and validate email
                request.payload.customer.email = sanitizeEmailAddress(request.payload.customer.email);
                if (Joi.string().email().validate(request.payload.customer.email).error) {
                    return reply(BadRequest.invalidParameters('payload', {'customer.email': ['"email" must be a valid email']})).code(400);
                }

                // Carts that belong to registered accounts cannot set customer param
                let cart = await Cart.get(request.pre.checkout.cart.id);
                if (cart.userId) {
                    return reply(BadRequest.invalidParameters('payload', {'customer': ['This field is not allowed']})).code(400);
                } else {
                    checkout = await Checkout.updateCustomerDetails(checkoutId, request.payload);
                }
            }
        } else if (hasKeys(request.payload, ['shippingAddress', 'billingAddress'])) {
            if (request.payload.shippingAddress === '') {
                return reply(BadRequest.invalidParameters('payload', {shippingAddress: ['This field is required']})).code(400);
            } else if (request.payload.billingAddress === '') {
                return reply(BadRequest.invalidParameters('payload', {billingAddress: ['This field is required']})).code(400);
            } else {
                checkout = await Checkout.updateAddresses(checkoutId, request.payload);
            }
        } else if (hasKeys(request.payload, ['shippingMethod'])) {
            if (request.payload.shippingMethod === '') {
                return reply(BadRequest.invalidParameters('payload', {shippingMethod: ['This field is required']})).code(400);
            } else if (getShippingOptions(request.pre.checkout).filter(function (option) { return option.value === request.payload.shippingMethod; }).length === 0) {
                return reply(BadRequest.invalidParameters('payload', {shippingMethod: ['Invalid']})).code(400);
            } else {
                checkout = await Checkout.updateShippingMethod(checkoutId, request.payload);
            }
        } else if (hasKeys(request.payload, ['paymentMethod'])) {
            if (request.payload.paymentMethod === '') {
                return reply(BadRequest.invalidParameters('payload', {paymentMethod: ['This field is required']})).code(400);
            } else {
                checkout = await Checkout.updatePaymentMethod(checkoutId, request.payload);
            }
        } else {
            return reply({message: 'Invalid payload'}).code(400);
        }

        // Return
        return reply(await new CheckoutSerializer(checkout).serialize());
    }
}

/**
 * Exports
 */
export {CheckoutsHandler, CheckoutIdHandler};
