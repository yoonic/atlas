/**
 * Imports
 */
import bcrypt from 'bcrypt';

import {rethinkdb, Decorators as DBDecorators} from '../../core/db';
import {sanitizeEmailAddress} from '../../core/email';
import log from './logging';

/**
 * Database tables
 */
const tables = {
    User: 'Users'
};

/**
 * Possible user account states
 */
const UserStatus = {
    CREATED: 'created',
    PENDING_CONFIRMATION: 'pendingConfirmation',
    ACTIVE: 'active',
    DISABLED: 'disabled'
};

/**
 * Types of confirmation tokens
 */
const ConfirmationToken = {
    ACTIVATE_ACCOUNT: 'activateAccount',
    UPDATE_EMAIL: 'updateEmail',
    RESET_PASSWORD: 'resetPassword'
};

/**
 * User model
 */
class User {

    /**
     * Create a new user account
     */
    @DBDecorators.table(tables.User)
    static async create({name, email, password}) {

        // Check if there is already an account with given email address
        if (await this.table.filter({email: sanitizeEmailAddress(email)}).count().run() > 0) {
            throw new Error(`Email "${email}" already registered`);
        }

        // Hash password
        let salt = bcrypt.genSaltSync(10);
        let passwordHash = bcrypt.hashSync(password, salt);

        // Insert user into database
        let obj = {
            status: UserStatus.CREATED,
            name,
            email: sanitizeEmailAddress(email),
            password: passwordHash,
            addresses: [],
            confirmationTokens: [],
            createdAt: new Date()
        };
        let insert = await this.table.insert(obj).run();

        // Get user object and return it
        return await this.table.get(insert.generated_keys[0]).run();
    }

    /**
     * Creates a new confirmation token for given user
     * @param userId - the user's ID
     * @param type - a type from the list of available confirmation tokens
     */
    @DBDecorators.table(tables.User)
    static async createConfirmationToken(userId, type) {
        log.debug({userId, type}, 'Creating confirmation token');
        let token = `${await rethinkdb.uuid().run()}-${new Date().getTime()}`.split('-').join('');
        let now = new Date();
        await this.table.get(userId).update({
            confirmationTokens: rethinkdb.row('confirmationTokens').append({
                type: type,
                token: token,
                createdAt: now,
                usedAt: null
            }),
            updatedAt: now
        }).run();
        return token;
    }

    /**
     * Mark confirmation token as used
     * @param userId
     * @param token
     * @returns {string}
     */
    @DBDecorators.table(tables.User)
    static async markTokenAsUsed(userId, token) {
        log.debug({userId, token}, 'Marking token as used');
        
        let user = await User.get(userId);
        let ct = user.confirmationTokens.find(o => o.token === token);
        if (!ct) {
            throw new Error(`Invalid confirmation token "${token}" for user "${user.email}"`);
        } else if (ct.usedAt !== null) {
            throw new Error(`Token "${token}" for user "${user.email}" was already marked as used`);
        } else {
            ct.usedAt = new Date();
        }
        
        await this.table.get(user.id).update(function (row) {
            return {
                confirmationTokens: row('confirmationTokens').filter(function (confirmationToken) {
                    return confirmationToken('token').ne(token);
                }).append(ct)
            };
        });
    }

    /**
     * Return users collection
     */
    @DBDecorators.table(tables.User)
    static async find() {
        return await this.table.orderBy(rethinkdb.asc('name')).run();
    }

    /**
     * Return user with given ID
     */
    @DBDecorators.table(tables.User)
    static async get(id) {
        return await this.table.get(id).run();
    }

    /**
     * Return user with given email address
     */
    @DBDecorators.table(tables.User)
    static async getByEmail(email) {

        // Filter database for users with given email address
        let users = await this.table.filter({email: email}).run();

        // Result:
        // a) Single user matches email, return it
        // b) More than one user matches email, throw an error
        // c) No user matches email, return null
        if (users.length == 1) {
            return users[0];
        } else if (users.length > 1) {
            throw new Error(`More than one user with "${email}" email address`);
        } else {
            return null;
        }
    }

    /**
     * If email is registered and password matches, return user
     */
    @DBDecorators.table(tables.User)
    static async getByEmailAndPassword({email, password}) {
        let user = await User.getByEmail(email);
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return null;
        } else {
            return user;
        }
    }

    /**
     * Update a user's status
     * @param userId - user ID
     * @param status - new status
     */
    @DBDecorators.table(tables.User)
    static async updateStatus(userId, status) {

        // Validate status
        if (Object.keys(UserStatus).map(function (key) { return UserStatus[key]; }).indexOf(status) == -1) {
            throw new ValidationError('status', 'Invalid');
        }

        // Update status
        let now = new Date();
        await this.table.get(userId).update({status: status, updatedAt: now}).run();

        // Fetch user's latest state and return.
        return await User.get(userId);
    }

    /**
     * Update basic user details
     */
    @DBDecorators.table(tables.User)
    static async updateDetails(userId, {name=null}) {

        let details = {updatedAt: new Date()};
        if (name) {
            details.name = name;
        }

        // Update user
        await this.table.get(userId).update(details).run();

        // Fetch user's latest state and return.
        return await User.get(userId);
    }

    /**
     * Update user password
     */
    @DBDecorators.table(tables.User)
    static async updatePassword(userId, password) {

        // Hash password
        let salt = bcrypt.genSaltSync(10);
        let passwordHash = bcrypt.hashSync(password, salt);

        // Update user
        await this.table.get(userId).update({
            password: passwordHash,
            updatedAt: new Date()
        }).run();

        // Fetch user's latest state and return.
        return await User.get(userId);
    }

    /**
     * Update user address
     * a) Address doesn't have ID: Create an UUID for it and add it to the array
     * b) Address has ID: Find it in the array and, if exists, update it. If not, throw error
     */
    @DBDecorators.table(tables.User)
    static async updateAddress(userId, address) {

        if (!address.id) {
            log.debug({userId, address}, 'Adding user address');
            let id = await rethinkdb.uuid();
            await this.table.get(userId).update({
                addresses: rethinkdb.row('addresses').append(Object.assign({id: id}, address)),
                updatedAt: new Date()
            }).run();
        } else {
            log.debug({userId, address}, 'Updating user address');
            let user = await User.get(userId);
            let addresses = user.addresses.map(function (userAddress) {
                return (userAddress.id !== address.id) ? userAddress : address;
            });
            await this.table.get(userId).update({
                addresses: addresses,
                updatedAt: new Date()
            }).run();
        }

        // Fetch user's latest state and return.
        return await User.get(userId);
    }

    /**
     * Update the user's addresses array
     */
    @DBDecorators.table(tables.User)
    static async updateAddresses(userId, addresses) {

        // Update user
        await this.table.get(userId).update({
            addresses: addresses,
            updatedAt: new Date()
        }).run();

        // Fetch user's latest state and return.
        return await User.get(userId);
    }
}

/**
 * Export
 */
export {
    tables,
    UserStatus,
    ConfirmationToken,
    User
};
