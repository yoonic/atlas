/**
 * Imports
 */
import {Checkout} from './models';

/**
 * Return the available shipping options for given checkout
 */
function getShippingOptions(checkout) {

    let options = [];

    if (new Checkout(checkout).getSubTotal() <= 19.90) {
        options.push({
            value: 'standard',
            name: {
                en: 'CTT Expresso, 2 to 3 workdays after shipping',
                pt: 'CTT Expresso, 2 a 3 dias úteis após envio'
            },
            price: 3.40,
            vat: 23,
            currency: 'EUR'
        });
    } else {
        options.push({
            value: 'free',
            name: {
                en: 'Free! CTT Expresso, 2 to 3 workdays after shipping',
                pt: 'Grátis! CTT Expresso, 2 a 3 dias úteis após envio'
            },
            price: 0,
            vat: 23,
            currency: 'EUR'
        });
    }

    return options;
}

/**
 * Exports
 */
export {getShippingOptions};
