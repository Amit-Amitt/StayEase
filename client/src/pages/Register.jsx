import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/useAuth';
import { apiClient } from '@/api/client';
import { z } from 'zod';
import { Loader } from '@/components/ui/Loader';

const withinBcryptLimit = (value) => new TextEncoder().encode(value).length <= 72;
const registrationSchema = z.object({
  name: z.string().trim().min(2, 'Enter at least 2 characters.').max(80),
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.').max(128)
    .refine(withinBcryptLimit, 'Password must not exceed 72 UTF-8 bytes.'),
});

export default function RegisterPage() {
  const { user, isReady, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [registered, setRegistered] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState('');

  if (!isReady) return <Loader />;

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: '',
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const parsed = registrationSchema.safeParse(formData);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message])));
      return;
    }

    try {
      const { data } = await apiClient.post('auth/register', parsed.data);
      setVerificationUrl(data.verificationUrl || '');
      setRegistered(true);
    } catch (error) {
      setErrors({
        form: error.response?.data?.message || error.message || 'Unable to create your account right now.',
      });
      return;
    }
  };

  const handleGoogleSignUp = async (credential) => {
    setErrors({});
    try {
      const { data } = await apiClient.post('auth/google', { credential });
      login({ ...data.user, token: data.token });
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (error) {
      setErrors({ form: error.response?.data?.message || error.message || 'Unable to create your account with Google right now.' });
    }
  };

  return (
    <>
      <Seo title="Register | StayEase" description="Create a StayEase account to manage bookings and travel details." />
      <section className="flex min-h-[70vh] items-center justify-center">
        <Card className="w-full max-w-md border border-white/60 bg-white/90 p-8 shadow-soft backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Create account</p>
            <h1 className="mt-3 text-3xl font-bold">Join StayEase</h1>
            <p className="mt-3 text-sm text-muted-foreground">Create an account to save stays and manage your bookings.</p>
          </div>

          {registered ? (
            <div className="mt-8 space-y-4 text-center" role="status">
              <p className="text-sm text-muted-foreground">We sent a verification link to <strong>{formData.email}</strong>. Verify your email before signing in.</p>
              {verificationUrl ? <a className="inline-flex font-semibold text-primary underline" href={verificationUrl}>Verify email</a> : null}
              <p><Link to="/login" state={{ registrationEmail: formData.email }} className="font-semibold text-primary">Continue to sign in</Link></p>
            </div>
          ) : (
          <>
          <div className="mt-8">
            <GoogleSignInButton onCredential={handleGoogleSignUp} onError={(message) => setErrors({ form: message })} text="signup_with" />
          </div>
          <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium">
                Full name
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name ? <p className="mt-2 text-sm text-rose-500">{errors.name}</p> : null}
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email ? <p className="mt-2 text-sm text-rose-500">{errors.email}</p> : null}
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password ? <p className="mt-2 text-sm text-rose-500">{errors.password}</p> : null}
            </div>

            {errors.form ? <p className="text-sm text-rose-500">{errors.form}</p> : null}

            <Button type="submit" className="h-12 w-full justify-center">
              Register
            </Button>
          </form>
          </>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary">
              Sign in
            </Link>
          </p>
        </Card>
      </section>
    </>
  );
}
