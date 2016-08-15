/**
 * Imports
 */
import {Product} from '../products/models';

import log from './logging';

/**
 * Returns whether or not the given checkout is ready to finish and create an order
 * @param checkout - checkout object
 */
async function isReady(checkout) {

    // Checkpoints
    let hasCustomerDetails = false;
    let hasShippingInformation = false;
    let hasBillingInformation = false;

    // Check customer detail
    if (checkout.userId || (checkout.customer && checkout.customer.name && checkout.customer.email)) {
        hasCustomerDetails = true;
    }

    // Check shipping information
    if (Object.keys(checkout.shippingAddress).length > 0 && checkout.shippingMethod && checkout.shippingMethod !== '') {
        hasShippingInformation = true;
    }

    // Check billing information
    if (Object.keys(checkout.billingAddress).length > 0 && checkout.paymentMethod && checkout.paymentMethod !== '') {
        hasBillingInformation = true;
    }
    
    // Check product availability
    let hasStock = await Product.hasStock(checkout.cart);

    // Return result
    log.debug({
        checkoutId: checkout.id,
        hasCustomerDetails,
        hasShippingInformation,
        hasBillingInformation,
        hasStock}, 'isReady');
    return hasCustomerDetails && hasShippingInformation && hasBillingInformation && hasStock;
}

/**
 * Exports
 */
export {isReady};
