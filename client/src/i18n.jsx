import { createContext, useContext, useEffect, useState } from 'react';
import hu from './locales/hu.json';
import fr from './locales/fr.json';

export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hu', label: 'Magyar', flag: '🇭🇺' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

// Some translation values embed a `||` delimiter marking a styling boundary
// (e.g. where <em> or <b> starts) inside an otherwise whole, translatable
// sentence — splitT() below breaks the value into the two parts at render time.
export function splitT(value, delimiter = '||') {
  const i = value.indexOf(delimiter);
  return i === -1 ? [value, ''] : [value.slice(0, i), value.slice(i + delimiter.length)];
}

// Coverage: shared chrome (nav / account menu / footer), the full homepage, and
// (phase 6a) Resources/ComingSoon/Terms/Privacy/Settings/Alerts/Dashboard/Meeting/
// Companies. Remaining pages fall back to hard-coded English until translated.
const translations = {
  en: {
    'nav.findAJob': `Find a job`,
    'nav.findInternship': `Find an internship`,
    'nav.exploreCompanies': `Explore companies`,
    'nav.resources': `Resources`,
    'nav.dashboard': `Dashboard`,
    'nav.admin': `Admin`,
    'nav.applications': `Applications`,
    'nav.inbox': `Inbox`,
    'nav.signIn': `Sign in`,
    'nav.mySpace': `My space`,
    'nav.signOut': `Sign out`,
    'nav.register': `Register`,
    'nav.joinAsStudent': `Join as a student`,
    'nav.joinAsCompany': `Join as a company`,
    'nav.skipToContent': `Skip to content`,
    'nav.openMenu': `Open menu`,
    'nav.closeMenu': `Close menu`,
    'nav.menu': `Menu`,
    'theme.label': `Theme`,
    'theme.light': `Light`,
    'theme.dark': `Dark`,
    'theme.system': `System`,
    'brand.label': `Brand`,
    'brand.blue': `Blue`,
    'brand.green': `Green`,
    'brand.switchTo': `Switch brand colours`,

    'footer.forStudents': `For students`,
    'footer.hireTalent': `Hire the right talent`,
    'footer.welcomeHiringSuite': `Welcome Hiring Suite`,
    'footer.employerBranding': `Employer branding`,
    'footer.pricing': `Pricing`,
    'footer.testimonials': `Clients' testimonials`,
    'footer.needHelp': `Need help?`,
    'footer.haveAccount': `Have an account? Log in`,
    'footer.about': `About`,
    'footer.privacyPolicy': `Privacy Policy`,
    'footer.termsOfService': `Terms of Service`,
    'footer.followUs': `Follow us on:`,
    'footer.tagline': `Every posting is real. Every hire is on the ledger.`,

    'hero.eyebrow': `University of Debrecen · Pilot`,
    'hero.title': `Real companies. Open roles. ||Actual hires.`,
    'hero.lede': `LinkWork only lists internships and entry-level roles that companies have committed to filling — most of them negotiated directly with your faculty. No fake listings, no pre-filled positions. If you see it here, someone is getting hired for it.`,
    'hero.ctaJoinStudent': `Join with your university email`,
    'hero.ctaHireStudents': `Hire students`,
    'hero.chainFacultyTitle': `Faculty`,
    'hero.chainFacultyBody': `Your coordinator negotiates real openings with companies`,
    'hero.chainCompanyTitle': `Company`,
    'hero.chainCompanyBody': `Commits to hiring from LinkWork — verified by the admin`,
    'hero.chainYouTitle': `You`,
    'hero.chainYouBody': `Verified profile, merit-based tests, and a real shot at the role`,

    'stats.openPostings': `Verified postings open right now`,
    'stats.hires': `Students hired through the chain`,
    'stats.companies': `Companies committed to hiring here`,

    'matchPitch.eyebrow': `Built for students, not recruiters`,
    'matchPitch.title': `Finally, a job search that works for you.`,
    'matchPitch.subtitle': `Looking for the right role?`,
    'matchPitch.body': `Every posting on LinkWork is scoped to your university and, often, your faculty — so you're only ever looking at roles you're actually eligible for. A skill test based on your major and a structured interview qualify you before a company ever opens your file. No cover-letter guessing games, no ghost listings — just real openings matched to what you're studying.`,
    'matchPitch.ctaBrowse': `Browse openings`,
    'matchPitch.ctaGetStarted': `Get started`,

    'feature.trackTitle': `Track your application`,
    'feature.trackBody': `Finally, real-time, step-by-step visibility. Apply now, and you'll be notified as soon as we have any updates on the progress of your application!`,
    'feature.trackCta': `View my applications`,
    'feature.offersTitle': `Offers that hide nothing`,
    'feature.offersBody': `Salary, remote work… Don't go into the unknown when choosing your future job.`,
    'feature.transparentTitle': `Transparent companies`,
    'feature.transparentBody': `Recruitment process, response time, benefits… You deserve real answers, not to waste time.`,
    'feature.transparentCta': `View companies`,

    'mock.trackRole': `Software Engineering Intern`,
    'mock.trackCompany': `DataTech Hungary · Faculty of Informatics`,
    'mock.trackStep1': `Application received`,
    'mock.trackStep2': `Skill test passed`,
    'mock.trackStep3': `AI interview in review`,
    'mock.trackStep4': `Company review`,
    'mock.trackStep5': `Hired`,
    'mock.trackTag': `Application update`,
    'mock.offersRole': `Data Analyst Intern`,
    'mock.offersCompany': `Voltix Electronics · Debrecen`,
    'mock.chipHybrid': `Hybrid`,
    'mock.chipInternship': `Internship`,
    'mock.chip6Months': `6 months`,
    'mock.tagSalary': `Salary shown upfront`,
    'mock.tagRemote': `Remote-friendly`,
    'mock.whatToExpect': `What to expect`,
    'mock.factVerified': `★ Faculty-verified|| partnership`,
    'mock.factResponse': `~3 days|| average response time`,
    'mock.factSteps': `5 steps||, all shown before you apply`,
    'mock.chipMentorship': `Mentorship`,
    'mock.chipPaid': `Paid`,
    'mock.tagCommitted': `Committed to hire`,

    'landJob.title': `Prepare yourself to||Land your job!`,
    'landJob.card1': `Verified roles are open right now — ||be the next hire.`,
    'landJob.card2Title': `Make yourself visible to companies`,
    'landJob.card2Cta': `Upload my CV`,
    'landJob.card3': `Companies are committed to hiring here. ||Want the roles that match your major?`,
    'landJob.card4Title': `Be alerted quickly`,
    'landJob.card4Cta': `Create my alert`,

    'how.eyebrow': `The chain`,
    'how.title': `How it works`,
    'how.subtitle': `It shouldn't matter whether you know someone inside the company. On LinkWork, everyone walks the same chain — and when a posting closes, the hire is recorded openly.`,
    'how.step1Title': `Verify who you are`,
    'how.step1Body': `Sign up with your university email, submit your student documents, and get verified once — then apply to anything.`,
    'how.step2Title': `Prove what you know`,
    'how.step2Body': `A skill test based on your major and a structured interview qualify you before the company ever sees your file. Same test, same bar, for everyone.`,
    'how.step3Title': `The hire goes on the ledger`,
    'how.step3Body': `When a company hires, the job ID and candidate ID are matched publicly and the posting is taken down. Proof the job was real.`,

    'testimonials.eyebrow': `From the chain`,
    'testimonials.title': `Students are already in the chain.`,
    'testimonials.quote1': `"I didn't have to wonder if the internship was already filled before I even applied. Applied, tested, hired — no guessing games."`,
    'testimonials.author1': `— Computer Science student`,
    'testimonials.quote2': `"The skill test gave me a real shot without needing an inside connection at the company."`,
    'testimonials.author2': `— Business Administration student`,
    'testimonials.stat100Label': `Faculty-verified process — same test, same bar, for everyone`,

    'companyShowcase.eyebrow': `Trusted employers`,
    'companyShowcase.title': `Companies hiring on LinkWork`,
    'companyShowcase.punch': `Every company here has committed to hiring, not just posting.`,

    // Pipeline stage names. Keys match applications.stage in the database.
    'stage.applied': `Applied`,
    'stage.skill_test': `Skill test`,
    'stage.ai_interview': `AI interview`,
    'stage.company_test': `Company test`,
    'stage.hr_interview': `HR interview`,
    'stage.tech_interview': `Technical interview`,
    'stage.hired': `Hired`,
    'stage.rejected': `Not selected`,

    'chain.label': `Hiring progress`,
    'chain.position': `Stage {n} of {total}, {label}, {state}`,
    'chain.stateCurrent': `in progress`,
    'chain.stateDone': `completed`,
    'chain.stateFailed': `application not selected`,
    'ledger.facultyVerified': `Faculty verified`,

    'notFound.title': `That record does not exist.`,
    'notFound.body': `The page you asked for is not on the register. It may have been filled and taken down, or the address may be wrong.`,
    'notFound.home': `Go to the homepage`,
    'notFound.jobs': `Browse open roles`,
    'ledger.mono': `Hires recorded: {n} · Postings unaccounted for: 0`,
    'ledger.monoNoCount': `Postings unaccounted for: 0`,
    'ledger.empty': `Nothing has been hired here yet. When it is, it appears here and the posting comes down.`,
    'ledger.panelTitle': `The hire ledger`,
    'ledger.unavailable': `The ledger is unavailable right now. The postings above are unaffected.`,

    'problem.eyebrow': `The ghost job problem`,
    'problem.title': `Three kinds of job that waste your time`,
    'problem.card1Title': `Already filled`,
    'problem.card1Body': `The role went to someone internal weeks ago. The posting is still up.`,
    'problem.card2Title': `Posted for appearances`,
    'problem.card2Body': `Hiring signals growth. Some companies advertise roles they have no budget to fill.`,
    'problem.card3Title': `Farming CVs`,
    'problem.card3Body': `The posting exists to collect candidates for a vacancy that might open later. Or never.`,
    'problem.punch': `You cannot tell which is which from the outside. That is the whole problem.`,

    'trust.eyebrow': `The trust chain`,
    'trust.title': `Four checks before a posting reaches you`,
    'trust.n1Title': `The faculty negotiates`,
    'trust.n1Body': `Most openings are agreed directly between a faculty coordinator and company leadership, not scraped from a job board.`,
    'trust.n2Title': `The admin reviews the company`,
    'trust.n2Body': `A platform admin approves every company before it can publish anything at all.`,
    'trust.n3Title': `The posting is a commitment`,
    'trust.n3Body': `A role exists here because the company committed to hiring from it. When it is filled, it comes down.`,
    'trust.n4Title': `You are verified once`,
    'trust.n4Body': `Register with your official university email and verify your student status once. Then apply to anything you are eligible for.`,

    'ledgerSection.eyebrow': `On the record`,
    'ledgerSection.title': `Every hire is written down`,
    'ledgerSection.body': `When a company hires through LinkWork, the posting and the date are recorded here. Nothing is added by hand and nothing can be edited afterwards.`,
    'ledgerSection.punch': `Every hire made through LinkWork has a permanent record here.\nNothing gets lost. Nothing gets erased.`,
    'ledgerSection.empty': `No hires are on the register yet.`,

    'faq.eyebrow': `Before you ask`,
    'faq.title': `Questions worth answering`,
    'faq.q1': `Who can join?`,
    'faq.a1': `Students with an official University of Debrecen email address, and companies approved by a platform admin. The pilot is scoped to one university on purpose.`,
    'faq.q2': `What does verification involve?`,
    'faq.a2': `You register with your university email and submit your student details once. An admin confirms them before you can apply to anything.`,
    'faq.q3': `What does the gold star mean?`,
    'faq.a3': `It marks a posting negotiated directly with your faculty. Every posting here is a commitment; a starred one was arranged by your coordinator.`,
    'faq.q4': `What does it cost?`,
    'faq.a4': `Nothing for students, ever. Companies are not charged during the pilot either.`,
    'faq.q5': `Are other universities coming?`,
    'faq.a5': `The database supports many universities and postings are already scoped per university. Adding a second one is a decision, not a rebuild.`,
    'faq.q6': `What happens to my data?`,
    'faq.a6': `Your application history stays between you and the company you applied to. The public ledger shows the posting and the date, never your student ID.`,

    'cta.title': `Every posting here is real. See for yourself.`,
    'cta.body': `Register with your university email and apply to something that is actually open.`,
    'cta.student': `Join with your university email`,
    'cta.company': `Hire students`,
    'cta.browse': `Browse open roles`,

    'resources.title': `Resources`,
    'resources.badge': `Coming soon`,
    'resources.body': `We're building a library of resume tips, interview prep, and career guidance for students and hiring guides for companies. Check back soon.`,

    'comingSoon.title': `Coming soon`,
    'comingSoon.badge': `Coming soon`,
    'comingSoon.bodyWithFeature': `“{feature}” isn't available yet.`,
    'comingSoon.bodyGeneric': `This page isn't available yet.`,
    'comingSoon.bodySuffix': `We're building it out — check back soon.`,
    'comingSoon.backHome': `Back to home`,

    'terms.policyVersionLabel': `POLICY VERSION`,
    'terms.title': `Terms of service`,
    'terms.eligibilityTitle': `Eligibility`,
    'terms.eligibilityBody': `Student accounts require a valid university email address at a partnered university. Company accounts require a work email address — personal/free-mail domains are not accepted.`,
    'terms.commitmentsTitle': `Postings are commitments`,
    'terms.commitmentsBody': `Companies that publish an opening on LinkWork commit to hiring for that role from the platform. Postings are removed once every position is filled and the hire is recorded on the match ledger.`,
    'terms.fairUseTitle': `Fair use`,
    'terms.fairUseBody': `Accounts are for individual/organizational use only. Misrepresenting your identity, faculty, employer, or interview answers is grounds for account termination.`,
    'terms.terminationTitle': `Termination`,
    'terms.termination': `We may suspend or remove accounts that violate these terms. You may close your account at any time; see our||Privacy Policy||for what happens to your data afterward.`,

    'privacy.policyVersionLabel': `POLICY VERSION`,
    'privacy.title': `Privacy & data retention policy`,
    'privacy.collectTitle': `What we collect`,
    'privacy.collectBody': `To run the verification chain, LinkWork collects: your name and email address; for students, your university, faculty and major, plus identity-verification documents you submit; for companies, your company name, website and description; and application data — skill test scores, hiring-stage progress, and your written AI interview answers.`,
    'privacy.whyTitle': `Why we collect it`,
    'privacy.whyBody': `This data exists solely to verify identity, match students to faculty-approved openings, and let companies review candidates who've cleared platform verification. We do not sell your data or share it with anyone outside the hiring chain for the postings you engage with.`,
    'privacy.retentionTitle': `Retention`,
    'privacy.retentionBody': `We keep account and application data for as long as your account is active. If you close your account, identifying data is deleted within a reasonable period, except where a hiring record (job ID ⟷ candidate ID match) has already been recorded on the public ledger as proof a posting was genuinely filled.`,
    'privacy.rightsTitle': `Your rights`,
    'privacy.rightsBodyPre': `You can request a copy of your data, ask us to correct it, or request deletion at any time by contacting`,
    'privacy.contactTitle': `Contact`,
    'privacy.contactBodyPre': `Questions about this policy:`,
    'privacy.disclaimer': `This is a placeholder policy for an early-stage pilot and is not a substitute for legal advice — replace it with counsel-reviewed terms before handling real user data at scale.`,

    'settings.title': `Settings`,
    'settings.passwordUpdated': `Password updated.`,
    'settings.changePasswordTitle': `Change password`,
    'settings.staySignedIn': `You'll stay signed in on this device.`,
    'settings.currentPasswordLabel': `Current password`,
    'settings.newPasswordLabel': `New password`,
    'settings.newPasswordHint': `(8+ characters)`,
    'settings.updateButton': `Update password`,

    'alerts.title': `Alerts`,
    'alerts.subtitle': `Follow companies from their profile page to see their new openings here.`,
    'alerts.empty': `You're not following any companies yet.`,
    'alerts.exploreCompanies': `Explore companies`,
    'alerts.openPositionOne': `{n} open position`,
    'alerts.openPositionOther': `{n} open positions`,
    'alerts.unfollow': `Unfollow`,

    'dashboard.greeting': `Hello, {name}`,
    'dashboard.idLine': `{major} · University of Debrecen`,
    'dashboard.docsMsg': `Documents submitted. The admin will verify them shortly — you can apply once verified.`,
    'dashboard.docsStepTitle': `One step before you can apply:`,
    'dashboard.docsStepBody': `submit your student documents (student ID + enrollment certificate) so the admin can verify your identity.`,
    'dashboard.submitDocuments': `Submit documents`,
    'dashboard.docsUnderReview': `Your documents are under review. You can browse openings meanwhile.`,
    'dashboard.docsRejected': `Your documents were rejected.`,
    'dashboard.resubmit': `Resubmit`,
    'dashboard.identityVerified': `Identity verified`,
    'dashboard.verifiedBadge': `✓ Verified student`,
    'dashboard.applicationsTitle': `Your applications`,
    'dashboard.ongoing': `ONGOING`,
    'dashboard.offers': `OFFERS`,
    'dashboard.rejected': `REJECTED`,

    'meeting.kindHrInterview': `HR interview`,
    'meeting.kindTechInterview': `Technical interview`,
    'meeting.liveVideoComingSoon': `Live video — coming soon`,
    'meeting.roomReadyTitle': `Your meeting room is ready`,
    'meeting.roomReadyBody': `Scheduling is live. The in-browser audio and video call will run right here on this page once the video provider is connected — no downloads, no external app.`,
    'meeting.inThisMeeting': `In this meeting`,
    'meeting.hostLabel': `{name} (host)`,
    'meeting.candidateLabel': `{name} (candidate)`,
    'meeting.moreParticipantsHint': `The hiring team can add more participants (e.g. technical interviewers) from the applicant's card.`,
    'meeting.leaveRoom': `Leave room`,

    'companies.title': `Explore companies`,
    'companies.subtitle': `Every company here has committed to hiring from LinkWork — approved by the platform admin.`,
    'companies.empty': `No approved companies yet.`,
    'companies.openPositionOne': `{n} open position`,
    'companies.openPositionOther': `{n} open positions`,
    'companies.hiringNow': `Hiring now`,
  },

  hu,
  fr,
};

const I18nCtx = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('linkwork_lang') || 'en'; } catch { return 'en'; }
  });

  useEffect(() => {
    try { localStorage.setItem('linkwork_lang', lang); } catch { /* ignore */ }
  }, [lang]);

  // vars is optional: t('chain.position', { n: 3, total: 6 }) fills {n}/{total}.
  // Interpolation rather than concatenation because hu and fr order the ordinal
  // and the count differently from en.
  const t = (key, vars) => {
    const s = translations[lang]?.[key] ?? translations.en[key] ?? key;
    return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : s;
  };

  return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>;
}

export const useI18n = () => useContext(I18nCtx);
