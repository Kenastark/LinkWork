require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const db = require('./db');

const MODEL = 'claude-opus-4-8';

const FEATURE_ENABLED = !!process.env.ANTHROPIC_API_KEY;

const SCORE_TOOL = {
  name: 'submit_interview_scores',
  description: 'Submit a confidence score and rationale for each interview question/answer pair.',
  input_schema: {
    type: 'object',
    properties: {
      scores: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            answer_id: { type: 'integer', description: 'The ai_answers row id this score is for.' },
            confidence_score: { type: 'integer', description: 'Confidence (0-100) that this answer reflects genuine, relevant competence.' },
            rationale: { type: 'string', description: 'One or two sentences explaining the score.' },
          },
          required: ['answer_id', 'confidence_score', 'rationale'],
          additionalProperties: false,
        },
      },
    },
    required: ['scores'],
    additionalProperties: false,
  },
  strict: true,
};

// Not wired into any student/company-facing flow — invoked only from the
// admin-only /api/admin/applications/:id/score-ai-interview route.
async function scoreApplication(applicationId) {
  if (!FEATURE_ENABLED) {
    throw new Error('ANTHROPIC_API_KEY not configured — scoring is disabled.');
  }

  const answers = db.prepare('SELECT id, question, answer FROM ai_answers WHERE application_id = ?').all(applicationId);
  if (!answers.length) {
    throw new Error('No AI interview answers found for this application.');
  }

  const client = new Anthropic();

  const prompt = answers
    .map((a) => `Answer ID ${a.id}\nQuestion: ${a.question}\nAnswer: ${a.answer}`)
    .join('\n\n');

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: 'You evaluate candidate interview answers for an entry-level/internship hiring platform. '
      + 'Score each answer on how confidently it demonstrates genuine, specific, relevant competence '
      + '(not just length or polish). Be skeptical of generic or evasive answers.',
    tools: [SCORE_TOOL],
    tool_choice: { type: 'tool', name: 'submit_interview_scores' },
    messages: [{ role: 'user', content: `Score these interview answers:\n\n${prompt}` }],
  });

  const toolUse = response.content.find((b) => b.type === 'tool_use' && b.name === 'submit_interview_scores');
  if (!toolUse) {
    throw new Error('Model did not return structured scores.');
  }

  const update = db.prepare(
    `UPDATE ai_answers SET confidence_score=?, confidence_rationale=?, scored_at=datetime('now') WHERE id=? AND application_id=?`
  );
  const results = [];
  for (const s of toolUse.input.scores) {
    update.run(s.confidence_score, s.rationale, s.answer_id, applicationId);
    results.push(s);
  }
  return results;
}

module.exports = { FEATURE_ENABLED, scoreApplication };
