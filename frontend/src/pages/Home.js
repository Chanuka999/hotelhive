import { Link } from "react-router-dom";

function Home() {
  return (
    <section className="container-pad py-10 md:py-16">
      <div className="panel grid items-center gap-8 overflow-hidden p-8 md:grid-cols-2 md:p-12">
        <div className="space-y-5">
          <p className="inline-block rounded-full bg-brand-coral/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-coral">
            Stay Curated
          </p>
          <h1 className="font-display text-4xl leading-tight md:text-6xl">
            Book hotels with confidence and style.
          </h1>
          <p className="max-w-xl text-brand-ink/75">
            Search destinations, compare room options, and reserve in minutes
            with a clean booking flow.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/hotels" className="btn-primary">
              Explore Hotels
            </Link>
            <Link to="/register" className="btn-secondary">
              Create Account
            </Link>
          </div>
        </div>
        <div className="min-h-80 rounded-3xl bg-gradient-to-br from-brand-moss via-brand-clay to-brand-coral p-6 text-white">
          <h2 className="font-display text-3xl">Popular This Week</h2>
          <ul className="mt-6 space-y-3 text-sm">
            <li>Bali Ocean View Suites</li>
            <li>Tokyo Skyline Residency</li>
            <li>Alpine Mist Lodge</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default Home;
