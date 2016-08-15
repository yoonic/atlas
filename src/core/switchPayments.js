/**
 * Imports
 */
import request from 'request';

import log from './logging';

/**
 * Possible events enumerator
 */
const Events = {
    CHARGE_CREATED: 'charge.created',
    INSTRUMENT_SUCCESS: 'instrument.success',
    INSTRUMENT_ERROR: 'instrument.error',
    PAYMENT_SUCCESS: 'payment.success',
    PAYMENT_ERROR: 'payment.error'
};

/**
 * Switch Payments API wrapper
 */
class SwitchPayments {
    
    constructor(baseUrl, accountId, privateKey) {
        this.baseUrl = baseUrl;
        this.accountId = accountId;
        this.privateKey = privateKey;
    }
    
    processEvent(eventId, handlers) {
        request.get({
            url: `${this.baseUrl}/events/${eventId}`,
            json: true,
            headers: {
                'Authorization': 'basic ' + new Buffer(`${this.accountId}:${this.privateKey}`).toString('base64')
            }
        }, function (err, httpResponse, body) {
            if (err) {
                log.error(err, 'Error fetching Switch Payments event');
            } else if (httpResponse.statusCode !== 200) {
                log.warn({eventId, statusCode: httpResponse.statusCode}, 'Unable to fetch Switch Payments event');
            } else if (handlers.hasOwnProperty(body.type)) {
                handlers[body.type](body);
            } else {
                log.warn({body}, 'No handler provided for Switch Payment event');
            }
        });
    }

    confirmCharge(chargeId) {
        return new Promise((resolve, reject) => {
            log.debug({chargeId}, 'Confirming charge');
            request.post({
                url: `${this.baseUrl}/charges/${chargeId}/confirm`,
                json: true,
                headers: {
                    'Authorization': 'basic ' + new Buffer(`${this.accountId}:${this.privateKey}`).toString('base64')
                },
                body: {}
            }, function (err, httpResponse, body) {
                if (err) {
                    reject(err);
                } else if (httpResponse.statusCode !== 201) {
                    reject({statusCode: httpResponse.statusCode, body});
                } else {
                    resolve({statusCode: httpResponse.statusCode, body});
                }
            });
        });
    }

    /**
     * Returns instrument details that should be presented to the user, if applicable (e.g. Multibanco, MBWay)
     */
    static getInstrumentDisplay(instrumentDetails) {
        log.debug({instrumentDetails}, 'Get instrument details');
        if (instrumentDetails.type === 'multibanco') {
            let reference = '';
            for (let i=0, len=instrumentDetails.parameters.reference.length; i<len; i++) {
                reference += instrumentDetails.parameters.reference[i];
                if ((i+1)%3 === 0) {
                    reference += ' ';
                }
            }
            return [
                {label: 'Entidade', value: instrumentDetails.parameters.entity},
                {label: 'Referência', value: reference},
                {label: 'Montante', value: instrumentDetails.parameters.value}
            ];
        } else if (instrumentDetails.type === 'mbway') {
            return [
                {label: 'Referência', value: instrumentDetails.parameters.reference},
                {label: 'Montante', value: instrumentDetails.parameters.value}
            ];
        }
        return null;
    }
}

/**
 * Exports
 */
export {
    Events,
    SwitchPayments
};
