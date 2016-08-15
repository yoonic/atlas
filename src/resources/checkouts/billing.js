/**
 * Return the available payment options for given checkout
 */
function getPaymentOptions(checkout) {
    return [
        {
            id: 'bankTransfer',
            label: {
                en: 'Bank Transfer',
                pt: 'Transferência Bancária'
            }
        }
    ];
}

/**
 * Exports
 */
export {getPaymentOptions};
