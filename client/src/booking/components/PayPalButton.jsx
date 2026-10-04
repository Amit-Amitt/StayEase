import { useEffect, useRef, useState } from 'react';
import { currencyCode } from '@/utils/currency';

const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID?.trim();
let sdkPromise;

const loadPayPalSdk = (id, currency) => {
  if (window.paypal) return Promise.resolve(window.paypal);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const params = new URLSearchParams({
      'client-id': id,
      currency,
      intent: 'capture',
      components: 'buttons',
    });
    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    script.async = true;
    script.dataset.stayeasePaypal = 'true';
    script.onload = () => window.paypal ? resolve(window.paypal) : reject(new Error('PayPal Checkout could not be loaded.'));
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error('Unable to load PayPal Checkout. Please check your connection and try again.'));
    };
    document.body.appendChild(script);
  });

  return sdkPromise;
};

export function PayPalButton({ createOrder, onApprove, onCancel, onError }) {
  const containerRef = useRef(null);
  const callbacksRef = useRef({ createOrder, onApprove, onCancel, onError });
  const [loadError, setLoadError] = useState('');
  callbacksRef.current = { createOrder, onApprove, onCancel, onError };

  useEffect(() => {
    if (!clientId) return undefined;
    if (currencyCode !== 'USD') {
      setLoadError('PayPal is available when checkout currency is USD.');
      return undefined;
    }

    let active = true;
    let buttons;
    loadPayPalSdk(clientId, currencyCode)
      .then((paypal) => {
        if (!active || !containerRef.current) return;
        buttons = paypal.Buttons({
          style: { layout: 'vertical', shape: 'rect', label: 'paypal', height: 45 },
          createOrder: () => callbacksRef.current.createOrder(),
          onApprove: ({ orderID }) => callbacksRef.current.onApprove(orderID),
          onCancel: () => callbacksRef.current.onCancel(),
          onError: (error) => callbacksRef.current.onError(error),
        });
        if (!buttons.isEligible()) {
          setLoadError('PayPal Checkout is unavailable for this account or location.');
          return;
        }
        return buttons.render(containerRef.current);
      })
      .catch((error) => {
        if (active) setLoadError(error.message || 'Unable to load PayPal Checkout.');
      });

    return () => {
      active = false;
      buttons?.close?.();
    };
  }, []);

  if (!clientId) {
    return <p className="mt-3 text-xs text-muted-foreground">PayPal is temporarily unavailable. Please choose another payment method.</p>;
  }

  return (
    <div>
      {loadError && <p className="mb-2 text-xs text-muted-foreground">{loadError}</p>}
      <div ref={containerRef} />
    </div>
  );
}
