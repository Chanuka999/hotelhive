import { Link } from "react-router-dom";

function NotFound() {
  return (
    <section className="container-pad py-16 text-center">
      <h1 className="font-display text-6xl">404</h1>
      <p className="mt-2 text-brand-ink/75">
        The page you are trying to reach does not exist.
      </p>
      <Link to="/" className="btn-primary mt-6 inline-block">
        Back Home
      </Link>
    </section>
  );
}

export default NotFound;
