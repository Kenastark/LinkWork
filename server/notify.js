const db = require('./db');

// Records a notification in-app. This is also the scaffold for future email:
// the subject/body written here are exactly what would be emailed. Real delivery
// (SendGrid/Resend/SMTP) can be added later — set emailed_at when that happens.
function notify(userId, { kind, subject, body, link }) {
  db.prepare(`INSERT INTO notifications (user_id, kind, subject, body, link) VALUES (?,?,?,?,?)`)
    .run(userId, kind, subject, body, link || null);
  // TODO: when an email provider is configured, send `subject`/`body` to the
  // user's email here and stamp emailed_at.
}

const KIND_LABEL = { hr_interview: 'HR interview', tech_interview: 'technical interview' };

// ---- Email/notification templates (generic copy, filled with real details) ----

// Sent to the student when HR proposes interview slots for a stage.
function interviewProposed({ studentName, companyName, roleTitle, kind, link }) {
  const label = KIND_LABEL[kind] || 'interview';
  return {
    kind: `${kind}_proposed`,
    subject: `Next step: pick a time for your ${label} with ${companyName}`,
    body:
`Hi ${studentName},

Congratulations on progressing to the ${label} stage for the ${roleTitle} role at ${companyName}.

The hiring team has proposed a few dates and times. Please open your application and pick the slot that works best for you — you can also choose your preferred duration.

Once you've picked a time, ${companyName} will be notified and your live interview will take place right here on LinkWork.

Open your application to choose a time: ${link}

Good luck,
The LinkWork team`,
    link,
  };
}

// Sent to the company owner when the student picks a slot.
function slotPicked({ studentName, roleTitle, kind, whenText, link }) {
  const label = KIND_LABEL[kind] || 'interview';
  return {
    kind: `${kind}_scheduled`,
    subject: `${studentName} picked a ${label} time`,
    body:
`${studentName} has chosen a time for their ${label} for the ${roleTitle} role.

Scheduled for: ${whenText}

You and any participants you've added will join the live meeting from the applicant's card on your dashboard.

Open the interview: ${link}

— LinkWork`,
    link,
  };
}

// Sent to the student when a company rejects their application.
function applicationRejected({ studentName, roleTitle, companyName }) {
  return {
    kind: 'application_rejected',
    subject: `Update on your application for ${roleTitle}`,
    body:
`Hi ${studentName},

Thank you for your interest in the ${roleTitle} role at ${companyName} and for the time you put into the process.

After careful consideration, the team has decided not to move forward with your application at this time. This decision is final for this posting.

Please don't be discouraged — new verified roles are posted regularly, and you're welcome to apply to any that match your skills. We wish you the very best in your search.

— The LinkWork team`,
    link: '/my-applications',
  };
}

module.exports = { notify, interviewProposed, slotPicked, applicationRejected };
