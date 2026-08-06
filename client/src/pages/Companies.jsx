import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useTranslatedTexts } from '../useTranslatedTexts.js';
import Card from '../components/Card.jsx';
import Badge from '../components/Badge.jsx';

const snippet = (d) => (d ? (d.length > 110 ? `${d.slice(0, 110)}…` : d) : '');

export default function Companies() {
  const [companies, setCompanies] = useState([]);

  useEffect(() => { api.get('/api/companies').then(d => setCompanies(d.companies)); }, []);

  const snippets = useTranslatedTexts(companies.map(c => snippet(c.description)));

  return (
    <main className="container">
      <h1 style={{ fontSize: 30, marginBottom: 6 }}>Explore companies</h1>
      <p className="muted" style={{ marginBottom: 20 }}>Every company here has committed to hiring from LinkWork — approved by the platform admin.</p>

      {companies.length === 0 ? (
        <Card><p className="muted">No approved companies yet.</p></Card>
      ) : (
        <div className="grid cols-3">
          {companies.map((c, i) => (
            <Link key={c.id} to={`/companies/${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <Card>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <span className="company-mono">{c.name.charAt(0).toUpperCase()}</span>
                  <div>
                    <h3 style={{ fontSize: 17 }}>{c.name}</h3>
                    <p className="muted" style={{ marginTop: 2 }}>{c.open_jobs} open position{c.open_jobs === 1 ? '' : 's'}</p>
                  </div>
                </div>
                {c.description && <p className="muted" style={{ marginTop: 12 }}>{snippets[i]}</p>}
                {c.open_jobs > 0 && <Badge variant="verified" style={{ marginTop: 12 }}>Hiring now</Badge>}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
