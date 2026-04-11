import { useState } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/useAuth';
import { apiClient } from '@/api/client';

export default function RegisterPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
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
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = 'Name is required.';
    }

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
      const response = await apiClient.post('auth/register', {
        name: formData.name.trim(),
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
        form: error.response?.data?.message || error.message || 'Unable to create your account right now.',
      });
      return;
    }

    const redirectTo = location.state?.from?.pathname || '/';
    navigate(redirectTo, { replace: true });
  };

  return (
    <>
      <Seo title="Register | StayEase" description="Create a StayEase account to manage bookings and travel details." />
      <section className="flex min-h-[70vh] items-center justify-center">
        <Card className="w-full max-w-md border border-white/60 bg-white/90 p-8 shadow-soft backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Create account</p>
            <h1 className="mt-3 text-3xl font-bold">Join StayEase</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Set up your account now so backend authentication can plug in here later without changing the UI flow.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
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
