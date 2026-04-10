import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { useAppStore } from '@/store/useAppStore';

export const MainLayout = () => {
  const { theme } = useAppStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className="page-shell">
      <Navbar />
      <main className="mx-auto min-h-[calc(100vh-160px)] max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
