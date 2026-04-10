import { MoonStar, SunMedium } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';

export const Navbar = () => {
  const { theme, toggleTheme } = useAppStore();
  const { user, logout } = useAuth();

  const navLinks = [
    ['/', 'Home'],
    ['/search', 'Explore'],
    ...(user?.role === 'admin' ? [['/admin', 'Admin Dashboard']] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/30 bg-white/75 backdrop-blur-xl dark:bg-slate-950/55">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-2xl font-extrabold tracking-tight text-primary">
          StayEase
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map(([path, label]) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `text-sm font-medium transition ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={toggleTheme} className="h-11 w-11 rounded-full px-0">
            {theme === 'light' ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
          </Button>
          {user ? (
            <>
              <Link
                to="/profile"
                className="inline-flex rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:bg-muted sm:px-5 sm:py-3"
              >
                Profile
              </Link>
              <Button type="button" variant="secondary" className="px-4 py-2 sm:px-5 sm:py-3" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex text-sm font-semibold text-muted-foreground transition hover:text-primary"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="inline-flex rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:bg-muted sm:px-5 sm:py-3"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
