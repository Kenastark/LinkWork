export default function Inbox() {
  return (
    <main className="container" style={{ maxWidth: 560 }}>
      <h2 style={{ fontSize: 30, marginBottom: 12 }}>Inbox</h2>
      <div className="card">
        <span className="badge pending">Coming soon</span>
        <p className="muted" style={{ marginTop: 12 }}>
          Direct messaging with companies is on the way — you'll be able to hear from a company
          and reply right here once it ships.
        </p>
      </div>
    </main>
  );
}
