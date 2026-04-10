export const Footer = () => (
  <footer className="border-t border-border/70 bg-white/60 py-10 backdrop-blur dark:bg-slate-950/40">
    <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1.2fr,1fr,1fr] lg:px-8">
      <div>
        <h3 className="text-xl font-bold text-primary">StayEase</h3>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          A production-ready hotel booking frontend designed for fast discovery, frictionless checkout, and easy backend integration.
        </p>
      </div>
      <div>
        <h4 className="font-semibold">Company</h4>
        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          <p>About</p>
          <p>Careers</p>
          <p>Support</p>
        </div>
      </div>
      <div>
        <h4 className="font-semibold">Destinations</h4>
        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          <p>Bali</p>
          <p>Goa</p>
          <p>New York</p>
        </div>
      </div>
    </div>
  </footer>
);
