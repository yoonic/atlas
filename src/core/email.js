/**
 * Imports
 */
import fs from 'fs';
import Handlebars from 'handlebars';
import path from 'path';
import request from 'request';

import config from '../config';
import log from './logging';

/**
 * Enum of available email templates
 */
const EmailTemplate = {
    ACCOUNT_CREATED: {
        id: 'account.created',
        fileName: 'accountCreated.html',
        subject: 'Confirme o seu email'
    },
    ACCOUNT_PASSWORD_RESET: {
        id: 'account.reset',
        fileName: 'accountPasswordReset.html',
        subject: 'Recuperar password'
    },
    ORDER_CREATED: {
        id: 'order.created',
        fileName: 'orderCreated.html',
        subject: 'Obrigado pela sua encomenda!'
    },
    ORDER_PENDING_PAYMENT: {
        id: 'order.pendingPayment',
        fileName: 'orderPendingPayment.html',
        subject: 'Encomenda a aguardar pagamento'
    },
    ORDER_PAID: {
        id: 'order.paid',
        fileName: 'orderPaid.html',
        subject: 'Confirmação de Pagamento'
    }
};

/**
 * Send an email
 */
function sendEmail(from, to, subject, text, html) {
    return new Promise((resolve, reject) => {
        log.debug({mailgun: config.mailgun, arguments}, 'Send email');
        request.post({
            url: `https://api.mailgun.net/v3/${config.mailgun.domain}/messages`,
            json: true,
            headers: {
                'Authorization': 'Basic ' + new Buffer(`api:${config.mailgun.apiKey}`).toString('base64')
            },
            form: {from, to, subject, text, html}
        }, function (err, httpResponse, body) {
            if (err) {
                return reject(err);
            } else if (httpResponse.statusCode !== 200 && httpResponse.statusCode !== 201) {
                return reject({statusCode: httpResponse.statusCode, body});
            }
            log.debug(httpResponse, body);
            return resolve();
        });
    });
}

/**
 * Send an email template
 */
function sendTemplate(template, to, data, subject) {
    return new Promise(function (resolve, reject) {
        log.debug({template, to, data}, 'sendTemplate');
        fs.readFile(path.join(process.cwd(), 'src/templates/email', template.fileName), 'utf8', async function (err, source) {
            if (err) {
                return reject(err);
            }
            try {
                let from = `${config.emails.from.name} <${config.emails.from.email}>`;
                let base = {
                    storefrontLabel: config.storefront.label,
                    storefrontUrl: config.storefront.baseUrl,
                    helpEmailAddress: config.emails.from.email
                };
                let html = Handlebars.compile(source)({base, data});
                await sendEmail(from, to, subject || template.subject, null, html);
                return resolve(html);
            } catch (err) {
                return reject(err);
            }
        });
    });
}

/**
 * Sanitizes a given email address string (e.g. trailing spaces)
 * @param email - the email string
 */
function sanitizeEmailAddress(email) {
    return email.trim().toLowerCase();
}

/**
 * Exports
 */
export {
    sanitizeEmailAddress,
    sendEmail,
    sendTemplate,
    EmailTemplate
};
