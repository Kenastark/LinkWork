import { Fragment } from 'react';
import { CHAIN_STAGES } from '../stages.js';
import { useI18n } from '../i18n.jsx';

// The signature pipeline visual: connected chain of hiring stages.
//
// Labels and order come from stages.js. This component used to carry its own
// LABELS and ORDER, which had drifted: it spelled tech_interview "Technical"
// while the rest of the app says "Technical interview".
//
// A rejected application cannot show WHERE it failed. All three rejection paths
// run `UPDATE applications SET stage='rejected'`, overwriting the previous
// stage, and there is no history table — so the failure point is unrecoverable
// on the client. Rather than invent one, the whole track goes muted and a
// terminal failed node is appended. See BRANDING.md section 7.
export default function Chain({ stage }) {
  const { t } = useI18n();

  const rejected = stage === 'rejected';
  // 'applied' is the column default but no row is ever created at it. If one
  // somehow is, treat it as the first real stage rather than rendering nothing.
  const effective = stage === 'applied' ? 'skill_test' : stage;
  const idx = rejected ? -1 : CHAIN_STAGES.indexOf(effective);
  const total = CHAIN_STAGES.length;

  const announce = (i, label, state) =>
    t('chain.position', { n: i + 1, total, label, state: t(state) });

  return (
    <div
      className={'chain' + (rejected ? ' rejected' : '')}
      role="list"
      aria-label={t('chain.label')}
    >
      {CHAIN_STAGES.map((s, i) => {
        const hiredFinal = s === 'hired' && effective === 'hired';
        const done = (!rejected && i < idx) || hiredFinal;
        const current = !rejected && i === idx && !hiredFinal;
        const label = t(`stage.${s}`);
        return (
          <Fragment key={s}>
            {i > 0 && (
              <span
                className={'connector' + (done || current ? ' done' : '')}
                aria-hidden="true"
              />
            )}
            <span
              role="listitem"
              className={'node' + (done ? ' done' : current ? ' current' : '')}
              {...(current ? { 'aria-current': 'step' } : {})}
            >
              <span className="dot" aria-hidden="true">{done ? '✓' : i + 1}</span>
              <small>{label}</small>
              {(current || hiredFinal) && (
                <span className="sr-only">
                  {announce(i, label, current ? 'chain.stateCurrent' : 'chain.stateDone')}
                </span>
              )}
            </span>
          </Fragment>
        );
      })}

      {rejected && (
        <>
          <span className="connector" aria-hidden="true" />
          <span role="listitem" className="node failed">
            <span className="dot" aria-hidden="true">✕</span>
            <small>{t('stage.rejected')}</small>
            <span className="sr-only">{t('chain.stateFailed')}</span>
          </span>
        </>
      )}
    </div>
  );
}
