# Razorpay setup

StayEase uses Razorpay Standard Checkout. The browser asks the API to create a booking and order; the API calculates the total from the stored room price, creates the Razorpay order, and returns the public Key ID. The browser opens Razorpay Checkout, then sends the returned payment ID, order ID, and signature to the API. The booking is confirmed only after the server validates the signature and confirms the payment is captured.

## Local setup

Copy the Razorpay settings from `.env.example` into `server/.env` and use **test mode** credentials from the Razorpay Dashboard:

```env
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_CURRENCY=USD
```

Set the client currency in `client/.env` to the same value:

```env
VITE_CURRENCY=USD
```

`USD` and `INR` are supported by this integration. Use a currency enabled for your Razorpay account. Prices and the existing 12% taxes and fees shown by the booking summary are used to create the order; the browser cannot set the amount.

Restart the API and Vite after changing environment values. The Razorpay Key Secret must stay on the API and must not use a `VITE_` prefix.

## Webhook setup

The checkout callback verifies payment immediately. A webhook also confirms captured payments if the customer closes the page before the callback reaches StayEase.

Configure a Razorpay webhook at:

```text
https://your-api-host/api/bookings/razorpay/webhook
```

Subscribe to `payment.captured`, choose a webhook signing secret, and set the same value as `RAZORPAY_WEBHOOK_SECRET` in `server/.env`. The endpoint validates the webhook HMAC against the original raw request body and checks its order, amount, currency, and captured status before confirming a booking.

Use Razorpay test keys and test mode webhooks before switching to live credentials. See [Razorpay Standard Checkout integration](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/build-integration/) for the provider's current checkout and payment verification steps.

## PayPal setup

PayPal is available alongside Razorpay when checkout uses USD. Create a PayPal app in the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications), then copy its Sandbox client ID and secret into `server/.env`:

```env
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_secret
PAYPAL_MODE=sandbox
PAYPAL_CURRENCY=USD
```

Set the matching public client ID in `client/.env`:

```env
VITE_PAYPAL_CLIENT_ID=your_sandbox_client_id
VITE_CURRENCY=USD
```

The client ID is public and is used to load PayPal's checkout buttons. Keep `PAYPAL_CLIENT_SECRET` on the server. The API creates each order from the stored room price and captures it after the buyer approves it; it confirms the booking only after PayPal reports a completed capture. PayPal is currently enabled for USD bookings, so use `VITE_CURRENCY=USD` and `PAYPAL_CURRENCY=USD` together.

Use Sandbox buyer and merchant accounts before switching `PAYPAL_MODE` to `live` and replacing both client IDs and secrets with live credentials. Restart the API and Vite after changing environment values. See PayPal's [Standard Checkout integration guide](https://developer.paypal.com/platforms/checkout/standard/integrate/) and [Orders v2 API](https://developer.paypal.com/api/rest/integration/orders-api) for the current order creation and capture flow.
