class PaymentConfigurationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'PaymentConfigurationError';
    }
}

class PaypalApiError extends Error {
    constructor(message, { status, issue, debugId } = {}) {
        super(message);
        this.name = 'PaypalApiError';
        this.status = status;
        this.issue = issue;
        this.debugId = debugId;
    }
}

let cachedAccessToken;
let cachedTokenExpiry = 0;
let cachedConfigKey;

const getPaypalConfig = () => {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const mode = (process.env.PAYPAL_MODE || 'sandbox').toLowerCase();
    const currency = (process.env.PAYPAL_CURRENCY || 'USD').toUpperCase();

    if (!clientId || !clientSecret) {
        throw new PaymentConfigurationError('PayPal credentials are not configured');
    }
    if (!['sandbox', 'live'].includes(mode)) {
        throw new PaymentConfigurationError('PAYPAL_MODE must be sandbox or live');
    }
    if (currency !== 'USD') {
        throw new PaymentConfigurationError('PayPal checkout currently supports USD only');
    }

    return {
        clientId,
        clientSecret,
        currency,
        baseUrl: mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'
    };
};

const fetchJson = async (url, options) => {
    const response = await fetch(url, options);
    const text = await response.text();
    let data = {};
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        throw new PaypalApiError('PayPal returned an invalid response');
    }
    if (!response.ok) {
        const detail = data.details?.[0]?.description || data.error_description || data.message || data.error || data.name;
        throw new PaypalApiError(detail || `PayPal API request failed (${response.status})`, {
            status: response.status,
            issue: data.details?.[0]?.issue || data.error || data.name,
            debugId: data.debug_id
        });
    }
    return data;
};

const getAccessToken = async (config) => {
    const configKey = `${config.baseUrl}:${config.clientId}:${config.clientSecret}`;
    if (cachedConfigKey === configKey && cachedAccessToken && Date.now() < cachedTokenExpiry - 60_000) {
        return cachedAccessToken;
    }

    const response = await fetchJson(`${config.baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });
    if (!response.access_token || !Number.isFinite(response.expires_in)) {
        throw new PaypalApiError('PayPal did not return an access token');
    }

    cachedConfigKey = configKey;
    cachedAccessToken = response.access_token;
    cachedTokenExpiry = Date.now() + response.expires_in * 1000;
    return cachedAccessToken;
};

const paypalRequest = async (path, options = {}) => {
    const config = getPaypalConfig();
    const accessToken = await getAccessToken(config);
    const headers = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...(options.requestId ? { 'PayPal-Request-Id': options.requestId } : {})
    };
    return fetchJson(`${config.baseUrl}${path}`, {
        method: options.method || 'GET',
        headers,
        ...(options.body ? { body: JSON.stringify(options.body) } : {})
    });
};

const createOrder = (bookingId, amount) => paypalRequest('/v2/checkout/orders', {
    method: 'POST',
    requestId: `booking-${bookingId}`,
    body: {
        intent: 'CAPTURE',
        purchase_units: [{
            reference_id: String(bookingId),
            custom_id: String(bookingId),
            amount: { currency_code: 'USD', value: amount }
        }]
    }
});

const getOrder = (orderId) => paypalRequest(`/v2/checkout/orders/${encodeURIComponent(orderId)}`);

const captureOrder = (orderId, bookingId) => paypalRequest(
    `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    { method: 'POST', requestId: `capture-${bookingId}`, body: {} }
);

module.exports = {
    PaymentConfigurationError,
    PaypalApiError,
    getPaypalConfig,
    createOrder,
    getOrder,
    captureOrder
};
