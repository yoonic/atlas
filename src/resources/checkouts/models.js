/**
 * Imports
 */
import {Decorators as DBDecorators} from '../../core/db';
import {PermissionDenied} from '../../core/errors';
import {Cart} from '../carts/models';
import {CartSerializer} from '../carts/serializers';
import {User} from '../users/models';

import log from './logging';
import {getShippingOptions} from './shipping';

/**
 * Database tables
 */
const tables = {
    Checkout: 'Checkouts'
};

/**
 * Checkout model
 */
class Checkout {

    /**
     * Constructor
     * @param checkoutObj - checkout database document
     */
    constructor(checkoutObj) {
        this.model = checkoutObj;
    }

    /**
     * Create a new checkout
     */
    @DBDecorators.table(tables.Checkout)
    static async create({cartId, shippingAddress=null, billingAddress=null}) {

        let obj = {
            currency: 'EUR',
            shippingAddress: shippingAddress || {},
            billingAddress: billingAddress || {},
            createdAt: new Date()
        };

        // Fetch cart and
        // 1) Add its state
        // 2) Add respective ownership of order (registered user OR anonymous via token)
        let cart = await Cart.get(cartId);
        obj.cart = await new CartSerializer(cart).serialize();
        if (cart.userId) {
            obj.userId = cart.userId;
        } else {
            obj.accessToken = cart.accessToken;
        }

        // If there is only one shipping option, set it by default
        let shippingOptions = getShippingOptions(obj);
        if (shippingOptions.length === 1) {
            log.debug({shippingMethod: shippingOptions[0].value}, 'Only one shipping option, setting it by default');
            obj.shippingMethod = shippingOptions[0].value;
        }

        // Insert checkout into database
        let insert = await this.table.insert(obj).run();

        // Get checkout object and return it
        return await this.table.get(insert.generated_keys[0]).run();
    }

    /**
     * Return checkout with given ID
     */
    @DBDecorators.table(tables.Checkout)
    static async get(id) {
        return await this.table.get(id).run();
    }

    /**
     * Return checkout with given ID if it exists and belongs to whoever requested it
     * (authenticated user or anonymous user with respective cart credentials)
     */
    @DBDecorators.table(tables.Checkout)
    static async getIfAllowed(checkoutId, user, cartAccessToken) {

        let checkout = await Checkout.get(checkoutId);

        // a) Checkout with given ID does not exist
        if (!checkout) {
            return null;
        }
        // b) Checkout belongs to another user
        else if (checkout.userId && (!user || user.id !== checkout.userId)) {
            throw new PermissionDenied();
        }
        // c) Anonymous Checkout but invalid access token
        else if (!checkout.userId && (!cartAccessToken || cartAccessToken !== checkout.accessToken)) {
            throw new PermissionDenied();
        }
        // d) All good, return
        else {
            return checkout;
        }
    }

    /**
     * Update anonymous cart's customer details
     */
    @DBDecorators.table(tables.Checkout)
    static async updateCustomerDetails(checkoutId, {customer}) {

        // Update checkout
        await this.table.get(checkoutId).update({
            customer: customer,
            updatedAt: new Date()
        }).run();

        // Fetch checkout's latest state and return.
        return await Checkout.get(checkoutId);
    }

    /**
     * Update checkout's addresses
     */
    @DBDecorators.table(tables.Checkout)
    static async updateAddresses(checkoutId, {shippingAddress, billingAddress}) {

        // Update checkout
        await this.table.get(checkoutId).update({
            shippingAddress: shippingAddress,
            billingAddress: billingAddress,
            updatedAt: new Date()
        }).run();

        // Fetch checkout's latest state and return.
        return await Checkout.get(checkoutId);
    }

    /**
     * Update checkout's shipping method
     */
    @DBDecorators.table(tables.Checkout)
    static async updateShippingMethod(checkoutId, {shippingMethod}) {

        // Update checkout
        await this.table.get(checkoutId).update({
            shippingMethod: shippingMethod,
            updatedAt: new Date()
        }).run();

        // Fetch checkout's latest state and return.
        return await Checkout.get(checkoutId);
    }

    /**
     * Update checkout's payment method
     */
    @DBDecorators.table(tables.Checkout)
    static async updatePaymentMethod(checkoutId, {paymentMethod}) {

        // Update checkout
        await this.table.get(checkoutId).update({
            paymentMethod: paymentMethod,
            updatedAt: new Date()
        }).run();

        // Fetch checkout's latest state and return.
        return await Checkout.get(checkoutId);
    }

    /**
     * Archive checkout
     */
    @DBDecorators.table(tables.Checkout)
    static async archive(checkoutId) {

        // Update checkout
        await this.table.get(checkoutId).update({
            archived: true,
            updatedAt: new Date()
        }).run();

        // Fetch checkout's latest state and return.
        return await Checkout.get(checkoutId);
    }

    /**
     * Returns the customer details (name, email)
     */
    async getCustomerDetails() {
        if (this.model.userId) {
            let user = await User.get(this.model.userId);
            return {
                userId: user.id,
                name: user.name,
                email: user.email
            }
        } else {
            return this.model.customer;
        }
    }

    /**
     * Returns the shipping details
     */
    getShippingDetails() {
        if (this.model.shippingMethod) {
            return getShippingOptions(this.model).find(opt => opt.value === this.model.shippingMethod);
        }
        return {};
    }

    /**
     * Returns the checkout's subTotal amount value
     */
    getSubTotal() {
        let amount = 0;
        this.model.cart.products.forEach(function (product) {
            amount += product.quantity * product.details.pricing.retail;
        });
        return amount;
    }

    /**
     * Returns the total amount of VAT
     */
    getVatTotal() {
        let amount = 0;
        this.model.cart.products.forEach(function (product) {
            let productTotal = product.quantity * product.details.pricing.retail;
            amount += productTotal - (productTotal/(1+product.details.pricing.vat/100));
        });
        let shippingDetails = this.getShippingDetails();
        if (Object.keys(shippingDetails).length > 0) {
            amount += shippingDetails.price - (shippingDetails.price/(1+shippingDetails.vat/100));
        }
        return parseFloat(amount).toFixed(2);
    }

    /**
     * Returns the total amount for the given checkout (products + shipping + discounts, etc)
     */
    getTotal() {
        let subTotal = this.getSubTotal();
        let shippingCost = this.getShippingDetails().price;
        return (shippingCost) ? subTotal + shippingCost : subTotal;
    }
}

/**
 * Exports
 */
export {tables, Checkout};
