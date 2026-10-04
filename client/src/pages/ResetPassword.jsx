import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { apiClient } from '@/api/client';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

const passwordSchema = z.object({
  password: z.string().min(8, 'Use at least 8 characters.').max(128)
    .refine((value) => new TextEncoder().encode(value).length <= 72, 'Password must not exceed 72 UTF-8 bytes.'),
  confirmation: z.string(),
}).refine((values) => values.password === values.confirmation, {
  path: ['confirmation'],
  message: 'Passwords do not match.',
});

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState(token ? '' : 'This reset link is missing its token.');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const parsed = passwordSchema.safeParse({ password, confirmation });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setError('');
    setBusy(true);
    try {
      const { data } = await apiClient.post('auth/reset-password', { token, password: parsed.data.password });
      setMessage(data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update your password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Seo title="Choose a new password | StayEase" description="Set a new password for your StayEase account." />
      <section className="flex min-h-[70vh] items-center justify-center">
        <Card className="w-full max-w-md p-8">
          <h1 className="text-center text-3xl font-bold">Choose a new password</h1>
          {message ? (
            <div className="mt-6 text-center" role="status">
              <p className="text-sm text-muted-foreground">{message}</p>
              <Link to="/login" className="mt-4 inline-block font-semibold text-primary">Sign in</Link>
            </div>
          ) : (
            <form className="mt-7 space-y-5" onSubmit={submit}>
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium">New password</label>
                <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>
              <div>
                <label htmlFor="confirmation" className="mb-2 block text-sm font-medium">Confirm password</label>
                <Input id="confirmation" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
              </div>
              {error ? <p className="text-sm text-rose-500" role="alert">{error}</p> : null}
              <Button type="submit" className="w-full justify-center" disabled={busy || !token}>{busy ? 'Updating...' : 'Update password'}</Button>
            </form>
          )}
        </Card>
      </section>
    </>
  );
}
