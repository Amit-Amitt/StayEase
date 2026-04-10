import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/useAuth';
import { apiClient } from '@/api/client';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: location.state?.registrationEmail || '',
    password: '',
  });
  const [errors, setErrors] = useState({});

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
      form: '',
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required.';
    }

    if (!formData.password.trim()) {
      nextErrors.password = 'Password is required.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      const response = await apiClient.post('/auth/login', {
        email: formData.email.trim(),
        password: formData.password
      });
      
      const data = response.data;

      login({
        email: data.email,
        name: data.name,
        role: data.role,
        token: data.token
      });

    } catch (error) {
      setErrors({
        form: error.response?.data?.message || error.message || 'Unable to sign you in right now.',
      });
      return;
    }

    const redirectTo = location.state?.from?.pathname || '/';
    navigate(redirectTo, { replace: true });
  };

  return (
    <>
      <Seo title="Login | StayEase" description="Sign in to manage your stays, bookings, and profile." />
      <section className="flex min-h-[70vh] items-center justify-center">
        <Card className="w-full max-w-md border border-white/60 bg-white/90 p-8 shadow-soft backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Welcome back</p>
            <h1 className="mt-3 text-3xl font-bold">Sign in to StayEase</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Continue with your existing account to view trips and finish booking faster.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
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
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password ? <p className="mt-2 text-sm text-rose-500">{errors.password}</p> : null}
            </div>

            {errors.form ? <p className="text-sm text-rose-500">{errors.form}</p> : null}

            <Button type="submit" className="h-12 w-full justify-center">
              Login
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to StayEase?{' '}
            <Link to="/register" className="font-semibold text-primary">
              Create an account
            </Link>
          </p>
        </Card>
      </section>
    </>
  );
}
