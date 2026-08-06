// Shared stage/interview helpers used by the company dashboard, applicant review, and student pages.

export const STAGE_LABEL = {
  applied: 'Applied', skill_test: 'Skill test', ai_interview: 'AI interview',
  company_test: 'Company test', hr_interview: 'HR interview', tech_interview: 'Technical interview',
  hired: 'Hired', rejected: 'Not selected',
};

export const KIND_LABEL = { hr_interview: 'HR interview', tech_interview: 'Technical interview' };

export const STAGE_ORDER = ['applied', 'skill_test', 'ai_interview', 'company_test', 'hr_interview', 'tech_interview', 'hired'];

// What the Chain renders. 'applied' is in the database enum and is the column
// default, but no row is ever created at it: /api/jobs/:id/apply inserts
// straight to 'skill_test'. Showing it would mean a node that is permanently
// complete and never current. STAGE_ORDER stays a faithful mirror of the server
// enum so reached() and the company-side recruitment strip are unaffected.
export const CHAIN_STAGES = STAGE_ORDER.filter(s => s !== 'applied');
export const reached = (stage, target) => STAGE_ORDER.indexOf(stage) >= STAGE_ORDER.indexOf(target);

export function formatSlot(startAt, durationMin) {
  const d = new Date(startAt);
  return `${d.toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · ${durationMin} min`;
}
