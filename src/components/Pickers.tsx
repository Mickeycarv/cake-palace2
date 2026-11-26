import type { TimeSlot } from '../types';
import type { DateOption } from '../lib/rules';
import { slotLabel } from '../lib/rules';
import { fromISODate, relativeDayLabel } from '../lib/dates';

/** Horizontal, scrollable date chips. Disabled days stay visible with the reason. */
export function DatePicker({
  options,
  value,
  onChange,
  legend,
  error,
}: {
  options: DateOption[];
  value: string;
  onChange: (d: string) => void;
  legend: string;
  error?: string;
}) {
  return (
    <fieldset className="picker" aria-describedby={error ? 'date-error' : undefined}>
      <legend>{legend}</legend>
      <div className="chip-scroller">
        {options.map((o) => {
          const d = fromISODate(o.date);
          const rel = relativeDayLabel(o.date);
          const top = rel === 'Today' || rel === 'Tomorrow' ? rel : d.toLocaleDateString('en-IN', { weekday: 'short' });
          return (
            <label
              key={o.date}
              className={`date-chip ${value === o.date ? 'is-selected' : ''} ${o.disabled ? 'is-disabled' : ''}`}
              title={o.reason}
            >
              <input
                type="radio"
                name="order-date"
                value={o.date}
                checked={value === o.date}
                disabled={o.disabled}
                onChange={() => onChange(o.date)}
              />
              <span className="date-chip-top">{top}</span>
              <span className="date-chip-day">{d.getDate()}</span>
              <span className="date-chip-month">{d.toLocaleDateString('en-IN', { month: 'short' })}</span>
              {o.disabled && <span className="date-chip-reason">{o.reason === 'Shop closed' ? 'Closed' : 'N/A'}</span>}
              <span className="visually-hidden">{o.disabled ? `, unavailable: ${o.reason}` : ''}</span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id="date-error" className="field-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function SlotPicker({
  slots,
  value,
  onChange,
  legend,
  error,
  emptyText = 'No time slots left for this date — please pick another day.',
}: {
  slots: TimeSlot[];
  value: string;
  onChange: (id: string) => void;
  legend: string;
  error?: string;
  emptyText?: string;
}) {
  return (
    <fieldset className="picker" aria-describedby={error ? 'slot-error' : undefined}>
      <legend>{legend}</legend>
      {slots.length === 0 ? (
        <p className="muted">{emptyText}</p>
      ) : (
        <div className="slot-grid">
          {slots.map((s) => (
            <label key={s.id} className={`slot-chip ${value === s.id ? 'is-selected' : ''}`}>
              <input type="radio" name="order-slot" value={s.id} checked={value === s.id} onChange={() => onChange(s.id)} />
              {slotLabel(s)}
            </label>
          ))}
        </div>
      )}
      {error && (
        <p id="slot-error" className="field-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}
