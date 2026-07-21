export const POLICY_VERSION = '2026-07-21';
// TODO: replace with a real contact address before this goes live for real users.
const CONTACT_EMAIL = 'privacy@linkwork.app';

export default function Privacy() {
  return (
    <main className="container" style={{ maxWidth: 720 }}>
      <span className="id-tag">POLICY VERSION {POLICY_VERSION}</span>
      <h2 style={{ fontSize: 30, margin: '8px 0 20px' }}>Privacy &amp; data retention policy</h2>

      <div className="card">
        <h3>What we collect</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          To run the verification chain, LinkWork collects: your name and email address; for students,
          your university, faculty and major, plus identity-verification documents you submit; for companies,
          your company name, website and description; and application data — skill test scores, hiring-stage
          progress, and your written AI interview answers.
        </p>

        <h3 style={{ marginTop: 18 }}>Why we collect it</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          This data exists solely to verify identity, match students to faculty-approved openings, and let
          companies review candidates who've cleared platform verification. We do not sell your data or share
          it with anyone outside the hiring chain for the postings you engage with.
        </p>

        <h3 style={{ marginTop: 18 }}>Retention</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          We keep account and application data for as long as your account is active. If you close your
          account, identifying data is deleted within a reasonable period, except where a hiring record
          (job ID ⟷ candidate ID match) has already been recorded on the public ledger as proof a posting
          was genuinely filled.
        </p>

        <h3 style={{ marginTop: 18 }}>Your rights</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          You can request a copy of your data, ask us to correct it, or request deletion at any time by
          contacting <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>

        <h3 style={{ marginTop: 18 }}>Contact</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          Questions about this policy: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>

        <p className="muted" style={{ marginTop: 18, fontSize: 12.5 }}>
          This is a placeholder policy for an early-stage pilot and is not a substitute for legal advice —
          replace it with counsel-reviewed terms before handling real user data at scale.
        </p>
      </div>
    </main>
  );
}
