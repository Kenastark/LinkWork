// Shared stage/interview helpers used by the company dashboard, applicant review, and student pages.

export const STAGE_LABEL = {
  applied: 'Applied', skill_test: 'Skill test', ai_interview: 'AI interview',
  company_test: 'Company test', hr_interview: 'HR interview', tech_interview: 'Technical interview',
  hired: 'Hired', rejected: 'Not selected',
};

export const KIND_LABEL = { hr_interview: 'HR interview', tech_interview: 'Technical interview' };

export const STAGE_ORDER = ['applied', 'skill_test', 'ai_interview', 'company_test', 'hr_interview', 'tech_interview', 'hired'];
export const reached = (stage, target) => STAGE_ORDER.indexOf(stage) >= STAGE_ORDER.indexOf(target);

export function formatSlot(startAt, durationMin) {
  const d = new Date(startAt);
  return `${d.toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · ${durationMin} min`;
}
