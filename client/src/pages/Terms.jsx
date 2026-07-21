import { POLICY_VERSION } from './Privacy.jsx';

export default function Terms() {
  return (
    <main className="container" style={{ maxWidth: 720 }}>
      <span className="id-tag">POLICY VERSION {POLICY_VERSION}</span>
      <h2 style={{ fontSize: 30, margin: '8px 0 20px' }}>Terms of service</h2>

      <div className="card">
        <h3>Eligibility</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          Student accounts require a valid university email address at a partnered university. Company
          accounts require a work email address — personal/free-mail domains are not accepted.
        </p>

        <h3 style={{ marginTop: 18 }}>Postings are commitments</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          Companies that publish an opening on LinkWork commit to hiring for that role from the platform.
          Postings are removed once every position is filled and the hire is recorded on the match ledger.
        </p>

        <h3 style={{ marginTop: 18 }}>Fair use</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          Accounts are for individual/organizational use only. Misrepresenting your identity, faculty,
          employer, or interview answers is grounds for account termination.
        </p>

        <h3 style={{ marginTop: 18 }}>Termination</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          We may suspend or remove accounts that violate these terms. You may close your account at any
          time; see our <a href="/privacy">Privacy Policy</a> for what happens to your data afterward.
        </p>
      </div>
    </main>
  );
}
