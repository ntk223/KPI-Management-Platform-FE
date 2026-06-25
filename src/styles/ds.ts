/**
 * ds.ts — Design System Tokens
 * Single source of truth for spacing, typography, color, and component variants.
 * All values conform to an 8pt grid (multiples of 4px).
 */

/* ── Typography ─────────────────────────────────────────────────── */
export const T = {
  /** Page main title  — 20px / bold / slate-900 */
  pageTitle:   'text-xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight',
  /** Card / section header — 16px / semibold / slate-800 */
  cardTitle:   'text-base font-semibold text-slate-800 dark:text-zinc-100',
  /** Body / table row data — 14px / normal / slate-600 */
  body:        'text-sm font-normal text-slate-600 dark:text-zinc-200',
  /** Muted support text — 14px / slate-500 */
  muted:       'text-sm text-slate-500 dark:text-zinc-400',
  /** Metadata, codes, dates — 12px / mono / slate-400 */
  meta:        'text-xs font-mono text-slate-400 dark:text-zinc-500',
  /** Label above inputs — 12px / medium / slate-600 */
  label:       'text-xs font-medium text-slate-600 dark:text-zinc-400',
} as const;

/* ── Spacing ────────────────────────────────────────────────────── */
export const S = {
  /** Outer card padding — p-5 (20px) */
  cardPad:  'p-5',
  /** Card with more breathing room — p-6 (24px) */
  cardPadLg:'p-6',
  /** Table cell — px-6 py-3.5 */
  cellPad:  'px-6 py-3.5',
  /** Form row gap */
  formGap:  'space-y-4',
} as const;

/* ── Border Radius ──────────────────────────────────────────────── */
export const R = {
  /** Layout blocks, info cards */
  xl:   'rounded-xl',
  /** Buttons, inputs, tables */
  lg:   'rounded-lg',
  /** Badges, tooltips */
  md:   'rounded-md',
} as const;

/* ── Status badge variants ─────────────────────────────────────── */
export const STATUS_BADGE: Record<string, string> = {
  DRAFT:            'bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
  PENDING_APPROVAL: 'bg-amber-50  text-amber-700  border-amber-200  dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60',
  APPROVED:         'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60',
  REJECTED:         'bg-rose-50   text-rose-700   border-rose-200    dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60',
  IN_PROGRESS:      'bg-indigo-50 text-indigo-700 border-indigo-200  dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/60',
  CLOSED:           'bg-slate-200 text-slate-600  border-slate-300   dark:bg-zinc-700 dark:text-zinc-300 dark:border-zinc-600',
};

export const STATUS_LABEL: Record<string, string> = {
  DRAFT:            'Nháp',
  PENDING_APPROVAL: 'Chờ duyệt',
  APPROVED:         'Đã duyệt',
  REJECTED:         'Từ chối',
  IN_PROGRESS:      'Đang thực hiện',
  CLOSED:           'Đã đóng',
};

/* ── Role badge variants ────────────────────────────────────────── */
export const ROLE_BADGE: Record<string, string> = {
  ADMIN:    'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900/60',
  DIRECTOR: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/60',
  MANAGER:  'bg-sky-50    text-sky-700    border-sky-200    dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/60',
  EMPLOYEE: 'bg-slate-100 text-slate-600  border-slate-200   dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
};

