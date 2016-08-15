/**
 * Imports
 */
import {rethinkdb, Decorators as DBDecorators} from '../../core/db';
import {ValidationError} from '../../core/errors';

/**
 * Database tables
 */
const tables = {
    Order: 'Orders'
};

/**
 * Possible order states
 */
const OrderStatus = {
    CREATED: 'created',
    PENDING_PAYMENT: 'pendingPayment',
    PAYMENT_ERROR: 'paymentError',
    PAID: 'paid',
    CANCELED: 'canceled',
    PROCESSING: 'processing',
    READY: 'ready',
    SHIPPED: 'shipped'
};

/**
 * Available payment providers
 */
const PaymentProvider = {
    SWITCH_PAYMENTS: 'switch'
};

/**
 * Order model
 */
class Order {

    /**
     * Constructor
     * @param obj - order database document
     */
    constructor(obj) {
        this.model = obj;
    }

    /**
     * Return orders collection
     */
    @DBDecorators.table(tables.Order)
    static async find({userId=null, open=null}) {

        // Build query
        let query = this.table.filter({});
        if (userId) {
            query = this.table.filter({customer: {userId: userId}});
        }
        if (open === true) {
            query = this.table.filter(function (order) {
                return rethinkdb.not(rethinkdb.expr([OrderStatus.CANCELED, OrderStatus.SHIPPED]).contains(order('status')));
            });
        } else if (open === false) {
            query = this.table.filter(function (order) {
                return rethinkdb.expr([OrderStatus.CANCELED, OrderStatus.SHIPPED]).contains(order('status'));
            });
        }

        // Sort by most recent to older
        query = query.orderBy(rethinkdb.desc('createdAt'));

        // Count the number of items that match query
        let count = await query.count().run();

        // Execute query
        let items = await query.run();

        // Return
        return {
            items: items,
            count: count
        };
    }

    /**
     * Create a new order
     */
    @DBDecorators.table(tables.Order)
    static async create({checkoutId, customer}) {

        let obj = {
            status: OrderStatus.CREATED,
            checkoutId: checkoutId,
            customer: customer,
            paymentLog: [],
            statusLog: [],
            createdAt: new Date()
        };

        // Insert order into database
        let insert = await this.table.insert(obj).run();

        // Get order object and return
        return await this.table.get(insert.generated_keys[0]).run();
    }

    /**
     * Return order with given ID
     */
    @DBDecorators.table(tables.Order)
    static async get(orderId) {
        return await this.table.get(orderId).run();
    }

    /**
     * Add details to payment log
     * @param orderId
     * @param data
     */
    @DBDecorators.table(tables.Order)
    static async updatePaymentLog(orderId, data) {
        return await this.table.get(orderId).update({paymentLog: rethinkdb.row('paymentLog').append(data)}).run();
    }

    /**
     * Update an order's status
     * @param orderId - order ID
     * @param status - new status
     * @param description - (string, optional) describe status change
     * @param details - (object, optional) specific details about the status update
     */
    @DBDecorators.table(tables.Order)
    static async updateStatus(orderId, status, description, details) {
        
        // Validate status
        if (Object.keys(OrderStatus).map(function (key) { return OrderStatus[key]; }).indexOf(status) == -1) {
            throw new ValidationError('status', 'Invalid');
        }
        
        // Update status
        let now = new Date();
        await this.table.get(orderId).update({
            status: status,
            statusLog: rethinkdb.row('statusLog').append({
                status: status,
                description: description,
                details: details,
                date: now
            }),
            updatedAt: now
        }).run();

        // Fetch orders's latest state and return.
        return await Order.get(orderId);
    }
}

/**
 * Exports
 */
export {
    tables,
    OrderStatus,
    PaymentProvider,
    Order
};
