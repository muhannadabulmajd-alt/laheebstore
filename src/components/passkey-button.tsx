'use client';

import { browserSupportsWebAuthn, startAuthentication, startRegistration } from '@simplewebauthn/browser';
import type { PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/browser';
import { Fingerprint } from 'lucide-react';
import { useState } from 'react';
import { storeCopy, type StoreLocale } from '@/lib/i18n';

export function PasskeyButton({
  locale,
  mode,
  onAuthenticated,
}: {
  locale: StoreLocale;
  mode: 'register' | 'authenticate';
  onAuthenticated?: () => void;
}) {
  const t = storeCopy(locale);
  const [state, setState] = useState<'idle' | 'working' | 'success' | 'error'>('idle');
  if (typeof window !== 'undefined' && !browserSupportsWebAuthn()) return null;

  const run = async () => {
    setState('working');
    try {
      if (mode === 'register') {
        const optionsResponse = await fetch('/api/customer/passkeys/registration/options', { method: 'POST' });
        const optionsPayload = await optionsResponse.json() as { options?: PublicKeyCredentialCreationOptionsJSON };
        if (!optionsResponse.ok || !optionsPayload.options) throw new Error('passkey_options_failed');
        const response = await startRegistration({ optionsJSON: optionsPayload.options });
        const verifyResponse = await fetch('/api/customer/passkeys/registration/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ challenge: optionsPayload.options.challenge, response }),
        });
        if (!verifyResponse.ok) throw new Error('passkey_verify_failed');
        setState('success');
      } else {
        const optionsResponse = await fetch('/api/customer/passkeys/authentication/options', { method: 'POST' });
        const optionsPayload = await optionsResponse.json() as { options?: PublicKeyCredentialRequestOptionsJSON };
        if (!optionsResponse.ok || !optionsPayload.options) throw new Error('passkey_options_failed');
        const response = await startAuthentication({ optionsJSON: optionsPayload.options });
        const verifyResponse = await fetch('/api/customer/passkeys/authentication/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ challenge: optionsPayload.options.challenge, response }),
        });
        if (!verifyResponse.ok) throw new Error('passkey_verify_failed');
        setState('success');
        onAuthenticated?.();
      }
    } catch {
      setState('error');
    }
  };

  const label = mode === 'register' ? t.enablePasskey : t.usePasskey;
  return <div className="passkey-action">
    <button className="secondary-button full-button" type="button" disabled={state === 'working'} onClick={() => void run()}>
      <Fingerprint size={19} />{state === 'working' ? t.loading : state === 'success' ? t.passkeyReady : label}
    </button>
    {state === 'error' && <span className="inline-error" role="alert">{t.passkeyError}</span>}
  </div>;
}
