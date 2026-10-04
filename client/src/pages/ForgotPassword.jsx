import { useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { apiClient } from '@/api/client';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

const emailSchema = z.string().trim().email();

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError('Enter a valid email address.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const { data } = await apiClient.post('auth/forgot-password', { email: parsed.data });
      setMessage(data.message);
      setResetUrl(data.resetUrl || '');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to request a reset link.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Seo title="Forgot password | StayEase" description="Request a secure StayEase password reset link." />
      <section className="flex min-h-[70vh] items-center justify-center">
        <Card className="w-full max-w-md p-8">
          <h1 className="text-center text-3xl font-bold">Reset your password</h1>
          <p className="mt-3 text-center text-sm text-muted-foreground">Enter your account email and we’ll send a reset link.</p>
          <form className="mt-7 space-y-5" onSubmit={submit}>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">Email address</label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            {error ? <p className="text-sm text-rose-500" role="alert">{error}</p> : null}
            {message ? <p className="text-sm text-muted-foreground" role="status">{message}</p> : null}
            {resetUrl ? <a className="block text-center font-semibold text-primary underline" href={resetUrl}>Continue to password reset</a> : null}
            <Button type="submit" className="w-full justify-center" disabled={busy}>{busy ? 'Sending...' : 'Send reset link'}</Button>
          </form>
          <p className="mt-6 text-center text-sm"><Link to="/login" className="font-semibold text-primary">Return to sign in</Link></p>
        </Card>
      </section>
    </>
  );
}
