/**
 * Imports
 */
import config from '../config';
import log from './logging';
import {UserStatus, User} from '../resources/users/models';

/**
 * JWT Authentication
 */
class JWTAuthentication {

    /**
     * Returns the secret key used to check the signature of the token or a key lookup function.
     */
    static getPrivateKey() {
        return config.app.jwtKey;
    }

    /**
     * Validates if the given JWT (e.g. user exists, session hasn't expired, etc)
     */
    static async validate(decoded, request, callback) {
        try {
            var user = await User.get(decoded.id);
        } catch (err) {
            log.error(err, 'Unable to validate JWT');
            return callback(null, false);
        }

        if (!user || user.status !== UserStatus.ACTIVE) {
          return callback(null, false);
        } else {
          return callback(null, true, user);
        }
    };
}

/**
 * Export
 */
export {JWTAuthentication};
