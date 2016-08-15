/**
 * Imports
 */
import csv from 'fast-csv';
import fs from 'fs';
import path from 'path';
import request from 'request';

/**
 * Returns the folder's filenames
 * @param folder - full path to the folder
 * @returns {Promise}
 */
async function getFilenames(folder) {
    return new Promise(function (resolve, reject) {
        fs.readdir(folder, function (err, items) {
            if (err) {
                reject(err);
            }
            resolve(items);
        });
    });
}

/**
 * Uploads an image
 * @param apiBaseURL - the base URL of the API host that should be targeted
 * @param jwt - valid credentials for an admin user
 * @param filePath - the full path to the file
 */
async function uploadImage(apiBaseURL, jwt, filePath) {
    return new Promise(function (resolve, reject) {
        console.log('Uploading %s', filePath);
        request.post({
            url:`${apiBaseURL}/v1/files`,
            formData: {
                resource: 'products',
                file: fs.createReadStream(filePath)
            },
            headers: {
                'Authorization': jwt
            }
        }, function optionalCallback(err, httpResponse, body) {
            if (err || httpResponse.statusCode != 201) {
                console.error('upload failed:', body);
                return resolve(null);
            }
            console.log('Upload successful!  Server responded with:', body);
            return resolve(JSON.parse(body));
        });
    });
}

/**
 * Appends the given image URLs to the product's images array
 * @param apiBaseURL - the base URL of the API host that should be targeted
 * @param jwt - valid credentials for an admin user
 * @param product - the API product object
 * @param images - array of the uploaded images objects
 */
async function updateProduct(apiBaseURL, jwt, product, images) {
    return new Promise(function (resolve, reject) {
        console.log('Updating product %s', product.sku);
        images.forEach(image => product.images.push(image));
        request.patch({
            url: `${apiBaseURL}/v1/products/${product.id}`,
            json: true,
            body: {images: product.images},
            headers: {
                'Authorization': jwt
            }
        }, function optionalCallback(err, httpResponse, body) {
            if (err || httpResponse.statusCode != 200) {
                console.error('update failed:', body);
                return resolve(null);
            }
            console.log('Product %s update successful!', product.sku, body);
            return resolve();
        });
    });
}

/**
 * Returns the list of SKUs from the Catalog CSV
 * @param filePath
 */
function getSKUs(filePath) {
    return new Promise(function (resolve, reject) {
        let SKUs = [];
        csv
            .fromPath(filePath, {headers: true})
            .on('data', function (row) {
                if (!row.hasOwnProperty('sku')) {
                    console.log('Row does not have SKU information', row);
                } else if(!row['sku'] || row['sku'] === '') {
                    console.log('Row SKU is empty', row);
                } else if (SKUs.indexOf(row['sku']) !== -1) {
                    console.log(`Duplicated SKU: ${row['sku']}`);
                } else {
                    SKUs.push(row['sku']);
                }
            })
            .on('end', async function () {
                resolve(SKUs);
            })
            .on('error', function () {
                reject();
            });
    });
}

/**
 * Handles uploading of images and product update
 * @param apiBaseURL - the base URL of the API host that should be targeted
 * @param jwt - valid credentials for an admin user
 * @param product - the product object with SKUs and image full paths
 */
async function processProduct(apiBaseURL, jwt, product) {
    return new Promise(function (resolve, reject) {
        let url = `${apiBaseURL}/v1/products?sku=${product.sku}`;
        console.log('Processing %s --> Images: %s', product.sku, product.images.length, url);
        request({
            url: url,
            headers: {
                'Authorization': jwt
            }
        }, async function (error, response, body) {
            let responseJSON = JSON.parse(body);
            if (!error && response.statusCode == 200 && responseJSON.items.length > 0) {
                console.log('SKU %s in database --> Name: %s', product.sku, responseJSON.items[0].name.pt);
                let uploadedImages = await * product.images.map(img => uploadImage(apiBaseURL, jwt, img));
                console.log('Uploaded images for %s', product.sku, uploadedImages);
                await updateProduct(apiBaseURL, jwt, responseJSON.items[0], uploadedImages);
                resolve();
            } else {
                console.log('SKU %s NOT in database', product.sku);
            }
        });
    });
}

/**
 * Script execution handler
 * @param args - required and optional parameters
 */
async function handle(args) {

    //
    // 1) Validate required parameters
    //
    if (args.length < 4) {
        console.log('Usage: uploadImages <csv_with_skus> <path_to_directory> <api_base_url> <jwt>');
        process.exit(1);
    }
    let csvPath = args[0];
    let folderPath = args[1];
    let apiBaseURL = args[2];
    let jwt = args[3];

    //
    // 2) Load SKU information from catalog CSV
    //
    let SKUs;
    try {
        SKUs = await getSKUs(csvPath);
        console.log(SKUs);
        console.log(`Total SKUs: ${SKUs.length}`);
    } catch (err) {
        console.log('ERROR: Unable to fetch SKUs from Catalog CSV', err);
        return;
    }

    //
    // 3) Build list of images for respective SKUs
    //
    let fileNames = await getFilenames(folderPath);
    let products = {};
    try {
        SKUs.forEach(function (sku) {
            if (!products[sku]) {
                products[sku] = {
                    sku: sku,
                    images: []
                }
            }
            fileNames.forEach(function (item) {
                if (item.split(`${sku}`).length > 1) {
                    products[sku].images.push(path.join(folderPath, item));
                }
            });
        });
        products = Object.keys(products).map((key) => products[key]).filter((product) => product.images.length > 0);
        console.log(products);
    } catch (err) {
        console.log('Error processing SKU images', err);
    }

    //
    // 4) Process each of the SKUs
    //   a) Check if exists in DB
    //   b) If it does, upload images
    //   c) Update product with paths of uploaded images
    //
    try {
        await * products.map(product => processProduct(apiBaseURL, jwt, product));
    } catch (err) {
        console.log('Error processing SKUs', err);
    }
}

/**
 * Exports
 */
export default handle;
