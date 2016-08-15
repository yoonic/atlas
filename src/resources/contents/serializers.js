/**
 * Imports
 */
import Joi from 'joi';

import {User} from '../users/models';

/**
 * Class containing schema details and serializer methods for Content objects
 */
class ContentSerializer {

    static schema = {
        id: Joi.string(),
        enabled: Joi.boolean(),
        type: Joi.string(),
        name: Joi.object(),
        body: Joi.object(),
        images: Joi.array(),
        collections: Joi.array(),
        tags: Joi.array(),
        metadata: Joi.object(),
        comments: Joi.array(),
        createdAt: Joi.date(),
        updatedAt: Joi.date()
    };

    constructor(content) {
        this.content = Object.assign({}, content);
    }

    /**
     * Serialize data
     * @param expandComments - (boolean) if true, then user details will be added to each of the comments
     * @returns {*}
     */
    async serialize(expandComments) {
        if (expandComments && this.content.comments && this.content.comments.length > 0) {
            let uniqueUserIds = this.content.comments.map(c => c.userId).filter((value, index, self) => self.indexOf(value) === index);
            let userDetails = await Promise.all(uniqueUserIds.map(User.get));
            userDetails = userDetails.reduce((result, user) => {
                result[user.id] = user;
                return result;
            }, {});
            this.content.comments.forEach(function (comment) {
                comment.user = {name: userDetails[comment.userId].name};
            });
        }
        return this.content;
    }
}

/**
 * Exports
 */
export {ContentSerializer};
