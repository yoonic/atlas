/**
 * Imports
 */
import csv from 'fast-csv';

import {ErrorName} from '../../core/errors';
import {BadRequest} from '../../core/responses';
import {hasKeys, hasValue} from '../../core/utils';
import {deleteAll as deleteAllFiles} from '../files/utils';

import log from './logging';
import {Product} from './models';
import {ProductSerializer} from './serializers';

/**
 * API handler for Products collection endpoint
 */
class ProductsHandler {

    /**
     * Process GET request
     * Return the products's collection
     */
    static async get(request, reply) {

        //
        // Only authenticated Admins can see products that are not enabled
        //
        let isAdmin = request.auth.credentials && request.auth.credentials.scope && request.auth.credentials.scope.indexOf('admin') !== -1;
        let enabled = !isAdmin;

        //
        // Pagination
        //
        let perPage = 200; // Default
        let page = 0; // Default (IMPORTANT: 0 internally corresponds to 1 in request!)

        if (request.query.perPage) {
            if (isNaN(parseInt(request.query.perPage))) {
                return reply(BadRequest.invalidParameters('query', {perPage: 'Must be an integer'})).code(400);
            } else if (parseInt(request.query.perPage) < 1 || parseInt(request.query.perPage) > perPage) {
                return reply(BadRequest.invalidParameters('query', {perPage: 'Invalid'})).code(400);
            } else {
                perPage = parseInt(request.query.perPage);
            }
        }

        if (request.query.page) {
            if (isNaN(parseInt(request.query.page))) {
                return reply(BadRequest.invalidParameters('query', {page: 'Must be an integer'})).code(400);
            } else if (parseInt(request.query.page) < 1) {
                return reply(BadRequest.invalidParameters('query', {page: 'Invalid'})).code(400);
            } else {
                page = parseInt(request.query.page) - 1; // Because page 1 requested is equivalent to 0 internally
            }
        }

        //
        // Sorting
        //
        let sort = null;
        if (request.query.sort && request.query.sort !== '') {
            if (['sku', '-sku', 'alphabetically', '-alphabetically', 'price', '-price', 'date', '-date'].indexOf(request.query.sort) === -1) {
                return reply(BadRequest.invalidParameters('query', {sort: 'Invalid'})).code(400);
            } else {
                sort = request.query.sort;
            }
        }

        //
        // Fetch items
        //
        let results = await Product.find({
            sku: (request.query.sku !== '') ? request.query.sku : null,
            collections: request.query.collections ? request.query.collections.split(',') : null,
            tags: request.query.tags ? request.query.tags.split(',') : null,
            perPage: perPage,
            page: page,
            sort: sort
        }, enabled);

        // Return
        let serializedItems = await * results.items.map(product => new ProductSerializer(product).serialize());
        return reply({
            items: serializedItems,
            pagination: {
                totalItems: results.count,
                totalPages: Math.ceil(results.count / perPage),
                perPage: perPage,
                page: page+1 // Because page 1 requested is equivalent to 0 internally
            }
        });
    }

    /**
     * Process POST request
     * Create a new product
     */
    static async post(request, reply) {
        try {
            let product = await Product.create(request.payload);
            return reply(await new ProductSerializer(product).serialize()).code(201);
        } catch (err) {
            if (err.name === ErrorName.VALIDATION_ERROR) {
                return reply(BadRequest.invalidParameters('payload', {[err.param]: [err.message]})).code(400);
            } else {
                log.error(err, 'Unable to create product');
                return reply().code(500);
            }
        }

    }
}

/**
 * API handler for Product ID endpoint
 */
class ProductIdHandler {

    /**
     * Process GET request
     */
    static async get(request, reply) {
        let product = await Product.get(request.params.productId);
        // Note: Only authenticated Admins can see products that are not enabled
        let isAdmin = request.auth.credentials && request.auth.credentials.scope && request.auth.credentials.scope.indexOf('admin') !== -1;
        if (product && (product.enabled === true || isAdmin)) {
            return reply(await new ProductSerializer(product).serialize());
        } else {
            return reply().code(404);
        }
    }

    /**
     * Process PUT request
     */
    static async put(request, reply) {

        // Check if product with given ID exists
        let product = await Product.get(request.params.productId);
        if (!product) {
            return reply().code(404);
        }

        // Update product
        try {
            product = await Product.update(request.params.productId, request.payload);
            return reply(await new ProductSerializer(product).serialize());
        } catch (err) {
            if (err.name === ErrorName.VALIDATION_ERROR) {
                return reply(BadRequest.invalidParameters('payload', {[err.param]: [err.message]})).code(400);
            } else {
                log.error(err, 'Unable to update product');
                return reply().code(500);
            }
        }
    }

    /**
     * Process PATCH request
     */
    static async patch(request, reply) {

        // Check if product with given ID exists
        let product = await Product.get(request.params.productId);
        if (!product) {
            return reply().code(404);
        }

        // Validate payload and make respective updates
        if (hasKeys(request.payload, ['images'])) {
            if (!Array.isArray(request.payload.images)) {
                return reply(BadRequest.invalidParameters('payload', {images: ['Must be an array']})).code(400);
            } else {
                product = await Product.updateImages(product.id, request.payload.images);
            }
        } else {
            return reply({message: 'Invalid payload'}).code(400);
        }

        // Return
        return reply(await new ProductSerializer(product).serialize());
    }
}

/**
 * API handler for Products Upload
 */
class ProductsUploadHandler {

    /**
     * Process POST request
     */
    static async post (request, reply) {

        // a) Process catalog upload
        if (request.payload.resource === 'catalog') {
            if (!request.payload.file) {
                return reply(BadRequest.invalidParameters('payload', {file: ['Required']})).code(400);
            }

            let products = [];
            let keys = ['sku', 'name', 'description', 'currency', 'vat', 'listPrice', 'retailPrice', 'stock', 'enabled'];
            let csvStream = csv({headers: true})
                .on('data', function (row) {
                    if (!hasKeys(row, keys, true)) {
                        log.warn({row}, 'Row does not have required keys');
                    } else if(!hasValue(row, keys)) {
                        log.warn({row}, 'Row does not have value for all required keys');
                    } else {
                        products.push({
                            enabled: row['enabled'].toLowerCase() === 'true',
                            sku: row['sku'],
                            name: {
                                en: row['name'],
                                pt: row['name']
                            },
                            description: {
                                en: row['description'],
                                pt: row['description']
                            },
                            pricing: {
                                currency: row['currency'],
                                list: parseFloat(row['listPrice']),
                                retail: parseFloat(row['retailPrice']),
                                vat: parseInt(row['vat'])
                            },
                            stock: parseInt(row['stock'])
                        });
                    }
                })
                .on('end', async function () {
                    return reply(await Product.processCatalogUpload(products)).code(201);
                })
                .on('error', function () {
                    return reply(BadRequest.invalidParameters('payload', {file: ['Invalid']})).code(400);
                });
            request.payload.file.pipe(csvStream);
        }

        // b) Process images upload
        else if (request.payload.resource === 'images') {
            if (request.payload.action !== 'clear') {
                return reply(BadRequest.invalidParameters('payload', {action: ['Invalid']})).code(400);
            }
            await deleteAllFiles('products');
            await Product.clearImages();
            return reply().code(201);
        }

        // c) Unknown upload type
        else {
            return reply(BadRequest.invalidParameters('payload', {resource: ['Invalid']})).code(400);
        }
    }
}

/**
 * Exports
 */
export {
    ProductsHandler,
    ProductIdHandler,
    ProductsUploadHandler
};
