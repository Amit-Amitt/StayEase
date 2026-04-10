import { Link } from 'react-router-dom';
import { Seo } from '@/components/Seo';
import { Card } from '@/components/ui/Card';

export default function NotFoundPage() {
  return (
    <>
      <Seo title="Page not found | StayEase" description="The page you requested could not be found." />
      <Card className="mx-auto max-w-2xl p-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">404</p>
        <h1 className="mt-3 text-4xl font-bold">This stay doesn’t exist here</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          The link may be outdated, or the page may have moved as the platform evolves.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Back to home
        </Link>
      </Card>
    </>
  );
}
