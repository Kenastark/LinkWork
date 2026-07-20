// The signature pipeline visual: connected chain of hiring stages
const LABELS = {
  applied: 'Applied',
  skill_test: 'Skill test',
  ai_interview: 'AI interview',
  company_test: 'Company test',
  hr_interview: 'HR interview',
  tech_interview: 'Technical',
  hired: 'Hired',
};
const ORDER = ['applied', 'skill_test', 'ai_interview', 'company_test', 'hr_interview', 'tech_interview', 'hired'];

export default function Chain({ stage }) {
  const rejected = stage === 'rejected';
  const idx = rejected ? -1 : ORDER.indexOf(stage);
  return (
    <div className="chain" role="list" aria-label="Hiring progress">
      {ORDER.map((s, i) => {
        const done = !rejected && i < idx;
        const current = !rejected && i === idx;
        const hiredFinal = s === 'hired' && stage === 'hired';
        return (
          <span key={s} style={{ display: 'contents' }}>
            {i > 0 && <span className={'connector' + (done || current || hiredFinal ? ' done' : '')} />}
            <span role="listitem" className={'node' + (done || hiredFinal ? ' done' : current ? ' current' : '')}>
              <span className="dot">{done || hiredFinal ? '✓' : i + 1}</span>
              <small>{LABELS[s]}</small>
            </span>
          </span>
        );
      })}
      {rejected && <span className="badge danger" style={{ marginLeft: 12 }}>Not selected</span>}
    </div>
  );
}
