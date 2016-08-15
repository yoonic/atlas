/**
 * Imports
 */
import bcrypt from 'bcrypt';

import {rethinkdb, Decorators as DBDecorators} from '../../core/db';
import {PermissionDenied} from '../../core/errors';

import log from './logging';

/**
 * Database tables
 */
const tables = {
    Cart: 'Carts'
};

/**
 * Cart model
 */
class Cart {

    /**
     * Create a new cart
     */
    @DBDecorators.table(tables.Cart)
    static async create(userId) {

        let obj = {
            products: [],
            createdAt: new Date()
        };

        // Cart can either belong to a User (when respective ID is provided)
        // or be anonymous, where an access token is generated randomly and returned
        // so that the anonymous user can retrieve and update its cart
        if (userId) {
            obj.userId = userId;
        } else {
            let uniqueId = await rethinkdb.uuid();
            let salt = bcrypt.genSaltSync(10);
            obj.accessToken = bcrypt.hashSync(uniqueId, salt);
        }

        // Insert cart into database
        let insert = await this.table.insert(obj).run();

        // Get cart object and return it
        return await this.table.get(insert.generated_keys[0]).run();
    }

    /**
     * Return carts collection
     */
    @DBDecorators.table(tables.Cart)
    static async find({userId=null}, archived) {

        //
        // 1) Build query
        //
        let query = this.table;

        // Archive status
        if (archived === true || archived === false) {
            query = query.filter(function (cart) {
                if (archived === false) {
                    return cart.hasFields('archived').not().or(cart('archived').eq(false));
                } else if (archived === true) {
                    return cart('archived').eq(true);
                }
            });
        }

        // Owner
        if (userId) {
            query = query.filter({userId: userId});
        }

        // Order by most recently created
        query = query.orderBy(rethinkdb.desc('createdAt'));

        //
        // 2) Execute query and return
        //
        return await await query.run();
    }

    /**
     * Return cart with given ID
     */
    @DBDecorators.table(tables.Cart)
    static async get(id) {
        return await this.table.get(id).run();
    }

    /**
     * Return cart with given ID if it exists and belongs to whoever requested it
     * (authenticated user or anonymous user with respective cart credentials)
     */
    @DBDecorators.table(tables.Cart)
    static async getIfAllowed(cartId, user, cartAccessToken) {

        let cart = await Cart.get(cartId);

        // a) Cart with given ID does not exist
        if (!cart) {
            return null;
        }
        // b) Cart belongs to another user
        else if (cart.userId && (!user || user.id !== cart.userId)) {
            throw new PermissionDenied();
        }
        // c) Anonymous cart but invalid access token
        else if (!cart.userId && (!cartAccessToken || cartAccessToken !== cart.accessToken)) {
            throw new PermissionDenied();
        }
        // d) All good, return
        else {
            return cart;
        }
    }

    /**
     * Update the cart's owner
     */
    @DBDecorators.table(tables.Cart)
    static async updateUserId(cartId, userId) {

        // Update cart
        await this.table.get(cartId).update({
            userId: userId,
            updatedAt: new Date()
        }).run();

        // Fetch cart's latest state and return.
        return await Cart.get(cartId);
    }

    /**
     * Merge cart with provided cart data
     */
    @DBDecorators.table(tables.Cart)
    static async merge(cartId, mergeCart, archiveMerged) {

        //
        // 1) Update cart
        //
        let cart = await Cart.get(cartId);
        let newProducts = {};
        let upsertProducts = function (arr) {
            for (let i=0, len=arr.length; i<len; i++) {
                if (!newProducts[arr[i].id]) {
                    newProducts[arr[i].id] = arr[i];
                } else {
                    newProducts[arr[i].id].quantity += arr[i].quantity;
                }
            }
        };
        upsertProducts(mergeCart.products);
        upsertProducts(cart.products);
        await this.table.get(cartId).update({
            products: Object.keys(newProducts).map(function (key) { return newProducts[key]; }),
            updatedAt: new Date()
        }).run();

        //
        // 2) Update merged cart
        //
        let mergedCartUpdate = {
            mergedWith: cartId,
            updatedAt: new Date()
        };
        if (archiveMerged === true) {
            mergedCartUpdate.archived = true;
        }
        await this.table.get(mergeCart.id).update(mergedCartUpdate).run();

        //
        // 3) Fetch cart's latest state and return
        //
        return await Cart.get(cartId);
    }

    /**
     * Archive cart
     */
    @DBDecorators.table(tables.Cart)
    static async archive(cartId) {

        // Update cart
        await this.table.get(cartId).update({
            archived: true,
            updatedAt: new Date()
        }).run();

        // Fetch cart's latest state and return.
        return await Cart.get(cartId);
    }

    /**
     * Update cart product
     */
    @DBDecorators.table(tables.Cart)
    static async updateProduct(cartId, productId, quantity) {

        let cart = await Cart.get(cartId);

        // Update quantity (if product already on cart) or add it to cart
        let index = null;
        for (let i=0; i<cart.products.length; i++) {
            if (cart.products[i].id === productId) {
                index = i;
                break;
            }
        }
        if (index === null && quantity > 0) {
            log.debug({productId, quantity}, 'Adding product to cart');
            cart.products.push({id: productId, quantity: quantity});
        } else {
            if (quantity == 0) { // Remove from cart
                log.debug({productId}, 'Removing product from cart');
                cart.products.splice(index, 1);
            } else {
                log.debug({productId, quantity}, 'Updating product quantity in cart');
                cart.products[index].quantity = quantity;
            }
        }

        // Update cart
        await this.table.get(cartId).update({
            products: cart.products,
            updatedAt: new Date()
        }).run();

        // Fetch cart's latest state and return.
        return await Cart.get(cartId);
    }
}

/**
 * Exports
 */
export {tables, Cart};
