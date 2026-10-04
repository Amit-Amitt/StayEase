const { createHmac, timingSafeEqual } = require('node:crypto');
const Razorpay = require('razorpay');

class PaymentConfigurationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'PaymentConfigurationError';
    }
}

let razorpayClient;
let configuredKeyId;

const getRazorpayConfig = () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const currency = (process.env.RAZORPAY_CURRENCY || 'USD').toUpperCase();
    if (!keyId || !keySecret) {
        throw new PaymentConfigurationError('Razorpay keys are not configured');
    }
    if (!['USD', 'INR'].includes(currency)) {
        throw new PaymentConfigurationError('Razorpay currency must be USD or INR');
    }
    if (!razorpayClient || configuredKeyId !== keyId) {
        razorpayClient = new Razorpay({ key_id: keyId, key_secret: keySecret });
        configuredKeyId = keyId;
    }
    return { client: razorpayClient, keyId, currency };
};

const isValidSignature = (expected, received) => {
    if (typeof received !== 'string' || !/^[a-f\d]{64}$/i.test(received)) return false;
    const expectedBuffer = Buffer.from(expected, 'hex');
    const receivedBuffer = Buffer.from(received, 'hex');
    return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
};

const verifyCheckoutSignature = ({ orderId, paymentId, signature, secret }) => {
    const expected = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
    return isValidSignature(expected, signature);
};

const verifyWebhookSignature = ({ rawBody, signature, secret }) => {
    if (!Buffer.isBuffer(rawBody) || !secret) return false;
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    return isValidSignature(expected, signature);
};

module.exports = {
    PaymentConfigurationError,
    getRazorpayConfig,
    verifyCheckoutSignature,
    verifyWebhookSignature
};
