import { useState } from 'react';

// A date + time + duration picker, styled after the reference mockup (month
// calendar, hour/minute steppers, AM/PM). Uses the app's green accent instead
// of the reference's blue, to stay consistent with the design system.
// onAdd({ start_at, duration_min }) is called when the user confirms a slot.

const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DURATIONS = [15, 30, 45, 60, 90];

function startOfMonth(y, m) { return new Date(y, m, 1); }
function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function sameDay(a, b) { return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

export default function DateTimePicker({ onAdd }) {
  const today = new Date();
  const [viewY, setViewY] = useState(today.getFullYear());
  const [viewM, setViewM] = useState(today.getMonth());
  const [selDate, setSelDate] = useState(null);
  const [hour12, setHour12] = useState(9);   // 1..12
  const [minute, setMinute] = useState(0);   // 0..59
  const [ampm, setAmpm] = useState('AM');
  const [duration, setDuration] = useState(45);

  const prevMonth = () => { const m = viewM - 1; if (m < 0) { setViewM(11); setViewY(viewY - 1); } else setViewM(m); };
  const nextMonth = () => { const m = viewM + 1; if (m > 11) { setViewM(0); setViewY(viewY + 1); } else setViewM(m); };

  const firstDow = startOfMonth(viewY, viewM).getDay();
  const total = daysInMonth(viewY, viewM);
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(new Date(viewY, viewM, d));

  const step = (val, setVal, min, max, delta) => {
    let n = val + delta;
    if (n > max) n = min;
    if (n < min) n = max;
    setVal(n);
  };

  const pad = (n) => String(n).padStart(2, '0');
  const isPastDay = (d) => d < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const confirm = () => {
    if (!selDate) return;
    let h = hour12 % 12;
    if (ampm === 'PM') h += 12;
    const start = new Date(selDate.getFullYear(), selDate.getMonth(), selDate.getDate(), h, minute, 0);
    onAdd({ start_at: start.toISOString(), duration_min: duration });
  };

  return (
    <div className="dtp">
      <div className="dtp-card dtp-calendar">
        <div className="dtp-cal-head">
          <button type="button" className="dtp-nav" onClick={prevMonth} aria-label="Previous month">‹</button>
          <span>{MONTHS[viewM]} {viewY}</span>
          <button type="button" className="dtp-nav" onClick={nextMonth} aria-label="Next month">›</button>
        </div>
        <div className="dtp-grid dtp-dow">{DOW.map(d => <span key={d}>{d}</span>)}</div>
        <div className="dtp-grid">
          {cells.map((d, i) => d === null
            ? <span key={`e${i}`} />
            : (
              <button
                type="button"
                key={d.toISOString()}
                className={`dtp-day${sameDay(d, selDate) ? ' selected' : ''}${sameDay(d, today) ? ' today' : ''}`}
                disabled={isPastDay(d)}
                onClick={() => setSelDate(d)}
              >{d.getDate()}</button>
            ))}
        </div>
      </div>

      <div className="dtp-card dtp-time">
        <div className="dtp-time-title">Time</div>
        <div className="dtp-steppers">
          {[['Hour', hour12, setHour12, 1, 12], ['Min', minute, setMinute, 0, 59]].map(([label, val, setVal, min, max]) => (
            <div className="dtp-stepper" key={label}>
              <button type="button" className="dtp-arrow" onClick={() => step(val, setVal, min, max, 1)} aria-label={`${label} up`}>⌃</button>
              <span className="dtp-stepper-val">{pad(val)}</span>
              <span className="dtp-stepper-label">{label}</span>
              <button type="button" className="dtp-arrow" onClick={() => step(val, setVal, min, max, -1)} aria-label={`${label} down`}>⌄</button>
            </div>
          ))}
        </div>
        <div className="dtp-ampm">
          {['AM', 'PM'].map(x => (
            <button type="button" key={x} className={`dtp-ampm-btn${ampm === x ? ' active' : ''}`} onClick={() => setAmpm(x)}>{x}</button>
          ))}
        </div>
        <div className="dtp-preview">{pad(hour12)}:{pad(minute)} {ampm}</div>

        <label className="dtp-duration">Duration
          <select value={duration} onChange={e => setDuration(Number(e.target.value))}>
            {DURATIONS.map(d => <option key={d} value={d}>{d} minutes</option>)}
          </select>
        </label>

        <button type="button" className="btn" style={{ width: '100%', marginTop: 6 }} onClick={confirm} disabled={!selDate}>
          Add this slot
        </button>
        {!selDate && <p className="muted" style={{ fontSize: 12.5, textAlign: 'center', marginTop: 8 }}>Pick a day on the calendar first.</p>}
      </div>
    </div>
  );
}
