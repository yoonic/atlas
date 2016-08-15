/**
 * Imports
 */
import fs from 'fs';
import path from 'path';
import uuid from 'node-uuid';

import config from '../../config';
import log from './logging';

/**
 * Processes an uploaded file by saving it to the configured place (locally, S3, etc)
 * and by returning the full URL path to it
 * @param resource - The API resource in which context this file was uploaded
 * @param file - The file being uploaded
 */
function processUpload(resource, file) {
    return new Promise(async function (resolve, reject) {

        if (config.uploads.provider !== 'atlas') {
            return reject({
                error: `Unsupported upload provider: ${config.uploads.provider}`
            });
        }

        // Make sure filename is unique
        let name = `${uuid.v4()}-${file.hapi.filename}`;
        let folder = path.join(config.uploads.folder, resource);

        // Open file for writing
        let fileStream = fs.createWriteStream(path.join(folder, name));
        fileStream.on('error', function (err) {
            return reject(err);
        });

        // Wait for stream to return "open" event, before writing to respective file
        fileStream.on('open', function (fd) {
            file.pipe(fileStream);
            file.on('end', function (err) {
                if (err) {
                    return reject(err);
                } else {
                    return resolve({
                        url: path.join(config.uploads.baseUrl, resource, name)
                    });
                }
            });
        });
    });
}

/**
 * Deletes all the files of the given resource
 * @param resource
 */
function deleteAll(resource) {
    return new Promise(async function (resolve, reject) {

        if (config.uploads.provider !== 'atlas') {
            return reject({
                error: `Unsupported upload provider: ${config.uploads.provider}`
            });
        }

        log.warn({resource}, 'Deleting all files');
        fs.readdir(path.join(config.uploads.folder, resource), async function (err, items) {
            if (err) {
                reject(err);
            }
            await * items.map(fileName => fs.unlink(path.join(path.join(config.uploads.folder, resource), fileName)));
            resolve();
        });
    });
}

/**
 * Exports
 */
export {processUpload, deleteAll};
