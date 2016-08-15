/**
 * Imports
 */
import config from '../../config';
import {rethinkdb, Decorators as DBDecorators} from '../../core/db';
import {ValidationError} from '../../core/errors';

import log from './logging';

/**
 * Database tables
 */
const tables = {
    Product: 'Products'
};

/**
 * Product model
 */
class Product {

    /**
     * Create a new product
     */
    @DBDecorators.table(tables.Product)
    static async create({sku, name}) {

        // Check if there is already a product with given SKU
        if (await this.table.filter({sku}).count().run() > 0) {
            throw new ValidationError('sku', `SKU "${sku}" already in database`);
        }

        // Insert product into database
        let obj = {
            enabled: false,
            sku,
            name,
            description: {},
            images: [],
            pricing: {
                currency: config.app.defaultCurrency,
                list: 0,
                retail: 0,
                vat: 0
            },
            stock: 0,
            tags: [],
            collections: [],
            metadata: {},
            createdAt: new Date()
        };
        let insert = await this.table.insert(obj).run();

        // Get product object and return it
        return await this.table.get(insert.generated_keys[0]).run();
    }

    /**
     * Return products collection
     */
    @DBDecorators.table(tables.Product)
    static async find({sku=null, collections=null, tags=null, perPage=null, page=null, sort=null}, enabled) {

        // Build query
        let query = this.table.filter((enabled === true) ? {enabled: true} : {});
        if (sku) {
            query = query.filter({sku: sku});
        }
        if (collections) {
            query = query.filter(function (product) {
                return product('collections').contains(...collections);
            });
        }
        if (tags) {
            query = query.filter(function (product) {
                return product('tags').contains(...tags);
            });
        }

        // Sort
        if (sort) {
            switch (sort) {
                case 'sku':
                    query = query.orderBy(rethinkdb.asc('sku'));
                    break;
                case '-sku':
                    query = query.orderBy(rethinkdb.desc('sku'));
                    break;
                case 'alphabetically':
                    query = query.orderBy(rethinkdb.asc('name'));
                    break;
                case '-alphabetically':
                    query = query.orderBy(rethinkdb.desc('name'));
                    break;
                case 'price':
                    query = query.orderBy(rethinkdb.asc(rethinkdb.row('pricing')('retail')));
                    break;
                case '-price':
                    query = query.orderBy(rethinkdb.desc(rethinkdb.row('pricing')('retail')));
                    break;
                case 'date':
                    query = query.orderBy(rethinkdb.asc('updatedAt'));
                    break;
                case '-date':
                    query = query.orderBy(rethinkdb.desc('updatedAt'));
                    break;
                default:
                    break;
            }
        }

        // Count the number of items that match query
        let count = await query.count().run();

        // Paginated query
        if (perPage !== null && page !== null) {
            query = query.skip(page*perPage).limit(perPage);
        }

        // Execute query
        let items = await query.run();

        // Return
        return {
            items: items,
            count: count
        }
    }

    /**
     * Return product with given ID
     */
    @DBDecorators.table(tables.Product)
    static async get(productId) {
        return await this.table.get(productId).run();
    }

    /**
     * Return products with given IDs
     */
    @DBDecorators.table(tables.Product)
    static async getAll(productIds) {
        return await this.table.getAll(...productIds).run();
    }

    /**
     * Return product with given SKU
     */
    @DBDecorators.table(tables.Product)
    static async getBySKU(sku) {

        // Filter database for products with given SKU
        let products = await this.table.filter({sku: sku}).run();

        // Result:
        // a) Single product matches SKU, return it
        // b) More than one product matches SKU, throw an error
        // c) No product matches SKU, return null
        if (products.length == 1) {
            return products[0];
        } else if (products.length > 1) {
            log.error({sku}, 'More than one product with same SKU');
            throw new ValidationError('sku', 'More than one product with same SKU');
        } else {
            return null;
        }
    }

    /**
     * Returns whether or not there is stock to fulfill the order
     * @param cart - the cart object
     */
    @DBDecorators.table(tables.Product)
    static async hasStock(cart) {
        let products = await Product.getAll(cart.products.map(function (product) { return product.id; }));
        let allProductsHaveStock = true;
        products.forEach(function (dbProduct) {
            let requestedQuantity = cart.products.filter(function (cartProduct) {
                return cartProduct.id === dbProduct.id
            })[0].quantity;
            if (dbProduct.stock < requestedQuantity) {
                allProductsHaveStock = false;
            }
        });
        return allProductsHaveStock;
    }

    /**
     * Update product
     */
    @DBDecorators.table(tables.Product)
    static async update(productId, {enabled, sku, name, description, images, pricing, stock, tags, collections, metadata}) {

        // Validate that SKU does not belong to another product
        if (sku) {
            let product = await Product.getBySKU(sku);
            if (product && product.id !== productId) {
                throw new ValidationError('sku', `The SKU "${sku}" is already registered with another product`);
            }
        }

        // Update product
        await this.table.get(productId).update({
            enabled,
            sku,
            name,
            description,
            images,
            pricing,
            stock,
            tags,
            collections,
            metadata,
            updatedAt: new Date()
        }).run();

        // Fetch product's latest state and return.
        return await Product.get(productId);
    }

    /**
     * Update product images
     * @param productId - the product unique ID
     * @param images - an array of image objects (that contain URL and other info)
     * @returns the saved product object
     */
    @DBDecorators.table(tables.Product)
    static async updateImages(productId, images) {

        // Update product
        await this.table.get(productId).update({images, updatedAt: new Date()}).run();

        // Fetch product's latest state and return.
        return await Product.get(productId);
    }

    /**
     * Remove images from all products
     */
    @DBDecorators.table(tables.Product)
    static async clearImages() {
        return await this.table.update({images: [], updatedAt: new Date()}).run();
    }

    /**
     * Process catalog upload
     */
    @DBDecorators.table(tables.Product)
    static async processCatalogUpload(products) {

        let SKUs = products.map(p => p.sku);

        //
        // 1) Disable all products not in this list
        //
        log.debug('Disabling SKUs not in catalog');
        let disabledSKUs = await this.table.filter(function (product) {
            return rethinkdb.not(rethinkdb.expr(SKUs).contains(product('sku')));
        }).pluck('sku').run().map(p => p.sku);
        await this.table.filter(function (product) {
            return rethinkdb.not(rethinkdb.expr(SKUs).contains(product('sku')));
        }).update({enabled: false});
        log.debug({disabledSKUs}, 'Disabled SKUs');

        //
        // 2) Update products already in the database
        //
        log.debug('Updating existing products');
        let SKUsToUpdate = await this.table.filter(function (product) {
            return rethinkdb.expr(SKUs).contains(product('sku'))
        }).pluck('sku').run().map(p => p.sku);
        let productsToUpdate = products.filter(function (product) {
            return SKUsToUpdate.indexOf(product.sku) !== -1;
        });
        await * productsToUpdate.map(product => {
            this.table.filter({sku: product.sku}).update({
                enabled: product.enabled,
                pricing: product.pricing,
                stock: product.stock,
                updatedAt: new Date()
            }).run();
        });
        log.debug({SKUsToUpdate},'Updated');

        //
        // 3) Add new products
        //
        log.debug('Adding new products');
        let productsToAdd = products.filter(function (product) {
            return SKUsToUpdate.indexOf(product.sku) === -1;
        });
        await this.table.insert(productsToAdd.map(function (product) {
            return {
                enabled: product.enabled,
                sku: product.sku,
                name: product.name,
                description: product.description || {},
                images: [],
                pricing: product.pricing,
                stock: product.stock,
                tags: [],
                collections: [],
                metadata: {},
                createdAt: new Date()
            };
        })).run();
        log.debug({productsToAdd}, 'Products added');

        //
        // 4) Return stats
        //
        return {
            disabled: disabledSKUs,
            updated: SKUsToUpdate,
            added: productsToAdd.map(p => p.sku)
        };
    }
}

/**
 * Exports
 */
export {tables, Product};
