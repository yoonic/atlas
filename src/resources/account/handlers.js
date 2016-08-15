/**
 * Imports
 */
import Joi from 'joi';
import JWT from 'jsonwebtoken';

import config from '../../config';
import {BadRequest} from '../../core/responses';
import {sanitizeEmailAddress, sendTemplate as sendEmailTemplate, EmailTemplate} from '../../core/email';
import {hasKeys} from '../../core/utils';
import {JWTAuthentication} from '../../core/authentication';
import {UserStatus, ConfirmationToken, User} from '../../resources/users/models';

import log from './logging';
import {AccountDetailsSerializer} from './serializers'

/**
 * Handlers for the Account "collection" endpoint
 */
class AccountHandlers {

    /**
     * Return the user's account details
     */
    static async get(request, reply) {
        return reply(await new AccountDetailsSerializer(request.auth.credentials).serialize());
    }

    /**
     * Update "blocks" of the account details
     */
    static async patch(request, reply) {

        let userId = request.auth.credentials.id;
        let user;

        // Validate payload and make respective updates
        if (hasKeys(request.payload, ['name'])) {
            if (request.payload.name === '') {
                return reply(BadRequest.invalidParameters('payload', {name: ['This field is required']})).code(400);
            } else {
                user = await User.updateDetails(userId, {name: request.payload.name});
            }
        } else if (hasKeys(request.payload, ['oldPassword', 'newPassword'])) {
            if (request.payload.oldPassword === '') {
                return reply(BadRequest.invalidParameters('payload', {oldPassword: ['This field is required']})).code(400);
            } else if (request.payload.newPassword === '') {
                return reply(BadRequest.invalidParameters('payload', {newPassword: ['This field is required']})).code(400);
            }
            user = await User.getByEmailAndPassword({email: request.auth.credentials.email, password: request.payload.oldPassword});
            if (!user) {
                return reply(BadRequest.invalidParameters('payload', {oldPassword: ['Invalid']})).code(400);
            } else {
                user = await User.updatePassword(userId, request.payload.newPassword);
            }
        } else if (hasKeys(request.payload, ['address'])) {
            if (request.payload.address === '') {
                return reply(BadRequest.invalidParameters('payload', {address: ['This field is required']})).code(400);
            } else {
                user = await User.updateAddress(userId, request.payload.address);
            }
        } else if (hasKeys(request.payload, ['addresses'])) {
            if (!(request.payload.addresses instanceof Array)) {
                return reply(BadRequest.invalidParameters('payload', {addresses: ['Must be an array']})).code(400);
            } else {
                user = await User.updateAddresses(userId, request.payload.addresses);
            }
        } else {
            return reply({message: 'Invalid payload'}).code(400);
        }

        // Return
        return reply(user);
    }
}

/**
 * Handlers for the Account Login endpoint
 */
class AccountLoginHandlers {

    /**
     * Login user
     */
    static async post(request, reply) {

        // 1) Sanitize & validate data
        request.payload.email = sanitizeEmailAddress(request.payload.email);
        if (Joi.string().email().validate(request.payload.email).error) {
            return reply(BadRequest.invalidParameters('payload', {'email': ['"email" must be a valid email']})).code(400);
        }

        // 2) Check if user with given email+password exists
        let user = await User.getByEmailAndPassword(request.payload);
        if (!user) {
            return reply({message: 'Invalid credentials'}).code(400);
        }

        // 3) Check if account is active
        if (user.status !== UserStatus.ACTIVE) {
            log.warn({user}, 'Login attempt of disabled account');
            return reply({message: 'Account is not active', status: user.status}).code(400);
        }

        // 4) If this point is reached, then credentials are valid. Return auth token
        return reply({authToken: JWT.sign({id: user.id}, JWTAuthentication.getPrivateKey())}).code(201);
    }
}

/**
 * Handlers for the Account Register endpoint
 */
class AccountRegisterHandlers {

    /**
     * Create new user account
     */
    static async post(request, reply) {

        // 1) Sanitize data
        request.payload.email = sanitizeEmailAddress(request.payload.email);

        // 2) Validate payload data
        if (Joi.string().email().validate(request.payload.email).error) {
            return reply(BadRequest.invalidParameters('payload', {'email': ['"email" must be a valid email']})).code(400);
        } else if (await User.getByEmail(request.payload.email)) {
            return reply(BadRequest.invalidParameters('payload', {email: ['"email" is already registered']})).code(400);
        }

        // 3) If everything checks, create a user account and return HTTP response immediately
        let user = await User.create(request.payload);
        reply().code(201);

        // 4) Create activation token and send respective email
        try {
            let activationToken = JWT.sign({
                email: user.email,
                token: await User.createConfirmationToken(user.id, ConfirmationToken.ACTIVATE_ACCOUNT)
            }, JWTAuthentication.getPrivateKey());
            sendEmailTemplate(EmailTemplate.ACCOUNT_CREATED, request.payload.email, {
                name: user.name,
                url: `${config.storefront.baseUrl}/${config.storefront.defaultLocale}/register/confirm/${activationToken}`
            }).then(function () {
                User.updateStatus(user.id, UserStatus.PENDING_CONFIRMATION);
            }, function (err) {
                log.error(err, 'Unable to send account confirmation email');
            });
        } catch (err) {
            log.error(err, 'Unable to create activation token');
        }
    }

    /**
     * Confirm email address
     */
    static async patch(request, reply) {

        //
        // 1) Decode confirmation JWT
        //
        let decodedToken;
        try {
            decodedToken = JWT.verify(request.payload.token, JWTAuthentication.getPrivateKey());
        } catch (err) {
            log.warn(err, 'Unable to decode account confirmation JWT');
            return reply(BadRequest.invalidParameters('payload', {token: ['Invalid']})).code(400);
        }

        //
        // 2) Process user activation
        //
        let user = await User.getByEmail(decodedToken.email);

        // a) If a valid JWT token was created, then a respective user MUST exist
        if (!user) {
            log.error({decodedToken}, 'Unable to find user of given JWT confirmation!');
            return reply().code(500);
        }
        // b) User must be pending activation
        else if (user.status !== UserStatus.PENDING_CONFIRMATION) {
            log.warn({decodedToken}, 'Confirmation requested but user account is not pending activation');
            return reply({message: 'User account is not pending confirmation'}).code(400);
        }
        // c) Validate token
        else {
            var confirmationToken = user.confirmationTokens.find(at => at.token === decodedToken.token);
            if (!confirmationToken) {
                log.error({decodedToken}, 'Confirmation token not found in user!');
                return reply().code(500);
            } else if (confirmationToken.type !== ConfirmationToken.ACTIVATE_ACCOUNT) {
                log.warn({decodedToken}, 'Attempt to confirm account with invalid token type');
                return reply(BadRequest.invalidParameters('payload', {token: ['Invalid type']})).code(400);
            } else if (confirmationToken.usedAt !== null) {
                log.warn({decodedToken}, 'Account confirmation token already used');
                return reply(BadRequest.invalidParameters('payload', {token: ['Already used']})).code(400);
            }
        }

        //
        // 3) Activate account, mark token as used and return valid JWT session
        //
        await User.markTokenAsUsed(user.id, confirmationToken.token);
        await User.updateStatus(user.id, UserStatus.ACTIVE);
        return reply({authToken: JWT.sign({id: user.id}, JWTAuthentication.getPrivateKey())}).code(200);
    }
}

/**
 * Handlers for the Account Password Reset endpoint
 */
class AccountResetHandlers {

    /**
     * Trigger a reset request
     */
    static async post(request, reply) {

        // 1) Sanitize data
        request.payload.email = sanitizeEmailAddress(request.payload.email);

        // 2) Validate payload data (i.e. check if email is registered)
        let user = await User.getByEmail(request.payload.email);
        if (Joi.string().email().validate(request.payload.email).error) {
            return reply(BadRequest.invalidParameters('payload', {'email': ['"email" must be a valid email']})).code(400);
        } else if (!user || user.status !== UserStatus.ACTIVE) {
            return reply(BadRequest.invalidParameters('payload', {email: ['Invalid']})).code(400);
        }

        // 3) Check if a recent reset request was made
        let resetRequests = user.confirmationTokens.filter(o => o.type === ConfirmationToken.RESET_PASSWORD);
        resetRequests.sort(function (a, b) {
            return b.createdAt - a.createdAt;
        });
        log.debug({resetRequests}, 'User password reset requests');
        if (resetRequests.length > 0 && resetRequests[0].createdAt > new Date(new Date().getTime() - 5*60000)) { // 5 minutes
            return reply(BadRequest.invalidParameters('payload', {email: ['Please wait until making a new reset request']})).code(400);
        }

        // 4) Return HTTP response immediately
        reply().code(201);

        // 5) Create activation token and send respective email
        try {
            let resetToken = JWT.sign({
                email: user.email,
                token: await User.createConfirmationToken(user.id, ConfirmationToken.RESET_PASSWORD)
            }, JWTAuthentication.getPrivateKey());
            sendEmailTemplate(EmailTemplate.ACCOUNT_PASSWORD_RESET, request.payload.email, {
                name: user.name,
                url: `${config.storefront.baseUrl}/${config.storefront.defaultLocale}/reset/confirm/${resetToken}`
            }).then(function () {}, function (err) {
                log.error(err, 'Unable to send account reset email');
            });
        } catch (err) {
            log.error(err, 'Unable to create reset token');
        }
    }

    /**
     * Use password reset token and change the user's password
     */
    static async patch(request, reply) {

        //
        // 1) Decode reset JWT
        //
        let decodedToken;
        try {
            decodedToken = JWT.verify(request.payload.token, JWTAuthentication.getPrivateKey());
        } catch (err) {
            log.warn(err, 'Unable to decode account reset JWT');
            return reply(BadRequest.invalidParameters('payload', {token: ['Invalid']})).code(400);
        }

        //
        // 2) Validate token
        //
        let user = await User.getByEmail(decodedToken.email);

        // a) If a valid JWT token was created, then a respective user MUST exist
        if (!user) {
            log.error({decodedToken}, 'Unable to find user of given JWT password reset!');
            return reply().code(500);
        }
        // b) User must be active
        else if (user.status !== UserStatus.ACTIVE) {
            log.warn({decodedToken}, 'Password reset requested but account is not active');
            return reply({message: 'Account is not active'}).code(400);
        }
        // c) Validate token
        else {
            var resetToken = user.confirmationTokens.find(at => at.token === decodedToken.token);
            if (!resetToken) {
                log.error({decodedToken}, 'Reset token not found in user!');
                return reply().code(500);
            } else if (resetToken.type !== ConfirmationToken.RESET_PASSWORD) {
                log.warn({decodedToken}, 'Attempt to reset account with invalid token type');
                return reply(BadRequest.invalidParameters('payload', {token: ['Invalid type']})).code(400);
            } else if (resetToken.usedAt !== null) {
                log.warn({decodedToken}, 'Account reset token already used');
                return reply(BadRequest.invalidParameters('payload', {token: ['Already used']})).code(400);
            } else if (new Date(resetToken.createdAt.getTime() + 10*60000) < new Date()) { // 10 minutes expiration date
                return reply(BadRequest.invalidParameters('payload', {token: ['Expired']})).code(400);
            }
        }

        //
        // 3) Reset password and return
        //
        await User.markTokenAsUsed(user.id, resetToken.token);
        await User.updatePassword(user.id, request.payload.password);
        return reply().code(200);
    }
}

/**
 * Exports
 */
export {
    AccountHandlers,
    AccountLoginHandlers,
    AccountRegisterHandlers,
    AccountResetHandlers
};
