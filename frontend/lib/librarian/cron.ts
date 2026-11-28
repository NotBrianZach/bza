/**
 * Five-field cron, parsed and advanced.
 *
 * ── WHY THIS IS HERE AND NOT A DEPENDENCY ─────────────────────────────────
 *
 * The runner needs two things — "is this expression valid" at save time, and
 * "when is the next firing after T" at schedule time — and nothing else. Every
 * cron library on npm also brings a scheduler, a timer loop and a process
 * model, none of which apply: the firing is a row comparison made by a route
 * that something else invokes. Importing a scheduler into a stateless worker
 * and using none of it is how a dependency becomes a surprise.
 *
 * ── WHAT IT SUPPORTS, AND WHAT IT REFUSES ─────────────────────────────────
 *
 * `minute hour day-of-month month day-of-week`, with `*`, lists (`1,15`),
 * ranges (`1-5`), steps (`*​/15`, `1-5/2`) and names (`mon`, `jan`). Sunday is
 * both 0 and 7, because both spellings are common and a schedule that silently
 * never fires is the worst possible way to learn which one this parser wanted.
 *
 * No `@daily`, no seconds field, no `L`/`W`/`#`. Each is a real cron feature
 * and each would be a second syntax to validate, document and get wrong; a
 * user writing `0 7 * * *` is served by this, and one who needs "last weekday
 * of the month" is not writing a reading task.
 *
 * ── DAY-OF-MONTH AND DAY-OF-WEEK ARE OR, NOT AND ──────────────────────────
 *
 * This is the one rule people get wrong, and it is inherited from Vixie cron
 * rather than invented: when BOTH day fields are restricted, a day matching
 * EITHER fires. `0 0 13 * fri` is the 13th and also every Friday, not only
 * Friday the 13th. Matching it matters because a user's expression came from
 * somewhere that behaves this way, and a parser that quietly ANDs would fire a
 * weekly task about four times a year.
 */

export class CronError extends Error {
  constructor(message: string) { super(message); this.name = 'CronError' }
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

interface FieldSpec { min: number; max: number; names?: string[]; label: string }
const FIELDS: FieldSpec[] = [
  { min: 0, max: 59, label: 'minute' },
  { min: 0, max: 23, label: 'hour' },
  { min: 1, max: 31, label: 'day of month' },
  { min: 1, max: 12, names: MONTHS, label: 'month' },
  { min: 0, max: 7, names: DAYS, label: 'day of week' },
]

function parseField(raw: string, spec: FieldSpec): Set<number> {
  const out = new Set<number>()
  const named = (tok: string): number => {
    const i = spec.names?.indexOf(tok.toLowerCase()) ?? -1
    if (i >= 0) return spec.names === MONTHS ? i + 1 : i
    const n = Number(tok)
    if (!Number.isInteger(n)) throw new CronError(`"${tok}" is not a ${spec.label}`)
    return n
  }

  for (const part of raw.split(',')) {
    const [rangePart, stepPart] = part.split('/')
    const step = stepPart === undefined ? 1 : Number(stepPart)
    if (!Number.isInteger(step) || step < 1) {
      throw new CronError(`"${part}" has a step that is not a positive whole number`)
    }
    let lo: number, hi: number
    if (rangePart === '*') {
      lo = spec.min; hi = spec.max
    } else if (rangePart.includes('-')) {
      const [a, b] = rangePart.split('-')
      lo = named(a); hi = named(b)
    } else {
      lo = named(rangePart)
      // `5/15` means "from 5 to the end, every 15" — a bare value with a step
      // is a range, not a single point. Without this, `*​/15` works and
      // `5/15` silently means just 5.
      hi = stepPart === undefined ? lo : spec.max
    }
    if (lo < spec.min || hi > spec.max || lo > hi) {
      throw new CronError(`${spec.label} "${part}" is outside ${spec.min}-${spec.max}`)
    }
    for (let v = lo; v <= hi; v += step) out.add(v)
  }
  if (out.size === 0) throw new CronError(`${spec.label} "${raw}" matches nothing`)
  return out
}

export interface ParsedCron {
  minute: Set<number>
  hour: Set<number>
  dom: Set<number>
  month: Set<number>
  dow: Set<number>
  /** Whether each day field was restricted, which decides the OR rule. */
  domRestricted: boolean
  dowRestricted: boolean
}

export function parseCron(expr: string): ParsedCron {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) {
    throw new CronError(`a cron expression has five fields, and this has ${parts.length}`)
  }
  const [minute, hour, dom, month, dowRaw] = parts.map((p, i) => parseField(p, FIELDS[i]))
  // Sunday is 0 and 7. Normalised here so every comparison downstream is on 0-6.
  const dow = new Set([...dowRaw].map(d => (d === 7 ? 0 : d)))
  return {
    minute, hour, dom, month, dow,
    domRestricted: parts[2] !== '*',
    dowRestricted: parts[4] !== '*',
  }
}

/** Valid-or-not, for a save-time check that wants no exception handling. */
export function cronIsValid(expr: string): string | null {
  try { parseCron(expr); return null } catch (e) { return e instanceof Error ? e.message : 'invalid' }
}

/**
 * The first firing strictly after `from`, in `timeZone`.
 *
 * Minute-by-minute rather than by arithmetic on the fields, and that is a
 * deliberate trade: a year of minutes is about half a million iterations of
 * five set lookups, which is microseconds, and it is the version that cannot
 * be subtly wrong about February, a DST boundary or the OR rule. Closed-form
 * next-cron is a classic source of off-by-one-hour bugs that only appear twice
 * a year.
 *
 * The 366-day bound is the honest answer to an expression like `0 0 30 feb *`,
 * which is valid syntax and never fires. Returning null is better than looping,
 * and the caller can tell the user their schedule is unsatisfiable.
 *
 * The zone is applied by formatting the candidate instant INTO the zone and
 * matching the fields there, so "7am every day" stays 7am local across a DST
 * shift rather than drifting by an hour.
 */
export function nextRun(expr: string, from: Date, timeZone = 'UTC'): Date | null {
  const cron = parseCron(expr)
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone, hour12: false,
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', weekday: 'short',
  })

  // Start at the next whole minute after `from`, so a task never re-fires
  // within the minute it just ran.
  const cursor = new Date(from.getTime())
  cursor.setUTCSeconds(0, 0)
  cursor.setUTCMinutes(cursor.getUTCMinutes() + 1)

  const LIMIT = 366 * 24 * 60
  for (let i = 0; i < LIMIT; i++) {
    const parts = Object.fromEntries(
      fmt.formatToParts(cursor).map(p => [p.type, p.value]))
    const minute = Number(parts.minute)
    const hour = Number(parts.hour) % 24
    const dom = Number(parts.day)
    const month = Number(parts.month)
    const dow = DAYS.indexOf(String(parts.weekday).slice(0, 3).toLowerCase())

    const dayMatches =
      cron.domRestricted && cron.dowRestricted
        ? cron.dom.has(dom) || cron.dow.has(dow)     // OR — see the header
        : cron.dom.has(dom) && cron.dow.has(dow)

    if (cron.minute.has(minute) && cron.hour.has(hour) && cron.month.has(month) && dayMatches) {
      return cursor
    }
    cursor.setUTCMinutes(cursor.getUTCMinutes() + 1)
  }
  return null
}
