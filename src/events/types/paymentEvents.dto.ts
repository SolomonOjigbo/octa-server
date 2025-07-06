/**
 * Event types and payloads for Payments lifecycle events
 */

export enum paymentEvents {
    PAYMENT_CREATED = 'payment.created',
    PAYMENT_UPDATED = 'payment.updated',
    PAYMENT_REVERSED = 'payment.reversed',
    PAYMENT_REFUNDED = 'payment.refunded',

    PAYMENT_COMPLETED = 'payment.completed',
    PAYMENT_FAILED = 'payment.failed',
    PAYMENT_CANCELLED = 'payment.cancelled',
}