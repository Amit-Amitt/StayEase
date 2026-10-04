import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { apiClient } from '@/api/client';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

const emailSchema = z.string().trim().email();

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const token = searchParams.get('token');
  const [email, setEmail] = useState(location.state?.email || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [busy, setBusy] = useState(Boolean(token));
  const verificationStarted = useRef(false);

  useEffect(() => {
    if (!token || verificationStarted.current) return;
    verificationStarted.current = true;
    apiClient.post('auth/verify-email', { token })
      .then(({ data }) => setMessage(data.message))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to verify this link.'))
      .finally(() => setBusy(false));
  }, [token]);

  const resend = async (event) => {
    event.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError('Enter a valid email address.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const { data } = await apiClient.post('auth/resend-verification', { email: parsed.data });
      setMessage(data.message);
      setVerificationUrl(data.verificationUrl || '');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to send a verification link.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Seo title="Verify email | StayEase" description="Verify your StayEase account email." />
      <section className="flex min-h-[70vh] items-center justify-center">
        <Card className="w-full max-w-md p-8">
          <h1 className="text-center text-3xl font-bold">Verify your email</h1>
          {busy ? <p className="mt-5 text-center text-sm text-muted-foreground">Checking your link...</p> : null}
          {message ? <p className="mt-5 text-center text-sm text-muted-foreground" role="status">{message}</p> : null}
          {error ? <p className="mt-5 text-center text-sm text-rose-500" role="alert">{error}</p> : null}
          {verificationUrl ? <a className="mt-4 block text-center font-semibold text-primary underline" href={verificationUrl}>Verify email</a> : null}
          {!token ? (
            <form className="mt-6 space-y-4" onSubmit={resend}>
              <label htmlFor="email" className="block text-sm font-medium">Email address</label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              <Button type="submit" className="w-full justify-center" disabled={busy}>Resend verification email</Button>
            </form>
          ) : null}
          <p className="mt-6 text-center text-sm"><Link to="/login" className="font-semibold text-primary">Return to sign in</Link></p>
        </Card>
      </section>
    </>
  );
}
