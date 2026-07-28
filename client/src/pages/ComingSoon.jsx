import { Link, useSearchParams } from 'react-router-dom';

export default function ComingSoon() {
  const [params] = useSearchParams();
  const feature = params.get('feature');
  return (
    <main className="container" style={{ maxWidth: 560 }}>
      <h2 style={{ fontSize: 30, marginBottom: 12 }}>{feature || 'Coming soon'}</h2>
      <div className="card">
        <span className="badge pending">Coming soon</span>
        <p className="muted" style={{ marginTop: 12 }}>
          {feature ? `“${feature}” isn't available yet.` : 'This page isn\'t available yet.'} We're
          building it out — check back soon.
        </p>
        <Link to="/" className="btn secondary" style={{ marginTop: 16 }}>Back to home</Link>
      </div>
    </main>
  );
}
