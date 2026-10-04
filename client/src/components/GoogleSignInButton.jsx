import { useEffect, useRef, useState } from 'react';

const GOOGLE_SCRIPT_ID = 'google-identity-services';

export const GoogleSignInButton = ({ onCredential, onError, text = 'continue_with' }) => {
  const containerRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  const [loadError, setLoadError] = useState('');
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    onCredentialRef.current = onCredential;
    onErrorRef.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    if (!clientId) {
      setLoadError('Google sign-in is not configured.');
      return undefined;
    }

    let active = true;
    const container = containerRef.current;
    const renderButton = () => {
      if (!active || !container || !window.google?.accounts?.id) return;
      setLoadError('');
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: ({ credential }) => {
          if (credential) onCredentialRef.current(credential);
          else onErrorRef.current?.('Google did not return a sign-in credential. Try again.');
        },
      });
      container.replaceChildren();
      window.google.accounts.id.renderButton(container, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text,
        shape: 'rectangular',
        width: Math.min(container.clientWidth || 400, 400),
        logo_alignment: 'left',
      });
    };

    const script = document.getElementById(GOOGLE_SCRIPT_ID);
    if (window.google?.accounts?.id) {
      renderButton();
    } else if (script) {
      script.addEventListener('load', renderButton);
      script.addEventListener('error', handleScriptError);
    } else {
      const newScript = document.createElement('script');
      newScript.id = GOOGLE_SCRIPT_ID;
      newScript.src = 'https://accounts.google.com/gsi/client';
      newScript.async = true;
      newScript.defer = true;
      newScript.addEventListener('load', renderButton);
      newScript.addEventListener('error', handleScriptError);
      document.head.appendChild(newScript);
    }

    function handleScriptError() {
      if (active) setLoadError('Unable to load Google sign-in. Check your connection and try again.');
    }

    return () => {
      active = false;
      const currentScript = document.getElementById(GOOGLE_SCRIPT_ID);
      currentScript?.removeEventListener('load', renderButton);
      currentScript?.removeEventListener('error', handleScriptError);
      container?.replaceChildren();
    };
  }, [clientId, text]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span>or continue with</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div ref={containerRef} className="flex min-h-10 justify-center" />
      {loadError ? <p className="text-center text-xs text-muted-foreground" role="status">{loadError}</p> : null}
    </div>
  );
};
