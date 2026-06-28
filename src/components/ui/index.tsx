/**
 * components/ui/index.tsx
 * Reusable UI primitives aligned to the project design system.
 * All sizing follows the 8pt grid. No text emojis.
 */
import React from 'react';
import { STATUS_BADGE, STATUS_LABEL, T, R } from '../../styles/ds';

/* ═══════════════════════════════════════════════════════════════
   STATUS BADGE
   Micro-scale badge — never competes with headers.
   text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md
═══════════════════════════════════════════════════════════════ */
export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider border ${R.md} ${STATUS_BADGE[status] ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PROGRESS BAR  — h-2, ultra-clean tracking
═══════════════════════════════════════════════════════════════ */
export function ProgressBar({ pct, color = 'bg-indigo-500' }: { pct: number; color?: string }) {
  const clamped = Math.min(100, Math.max(0, pct));
  const barColor = color === 'auto'
    ? clamped >= 100 ? 'bg-emerald-500 dark:bg-emerald-400' : clamped >= 60 ? 'bg-indigo-500 dark:bg-indigo-400' : 'bg-amber-400 dark:bg-amber-300'
    : color;
  return (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden dark:bg-zinc-800">
      <div
        className={`h-full ${barColor} rounded-full transition-all duration-300`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BUTTON VARIANTS
   Primary / Secondary / Ghost — px-4 py-2 text-xs font-semibold rounded-lg
═══════════════════════════════════════════════════════════════ */
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type BtnSize    = 'sm' | 'md';




const BTN_SIZE: Record<BtnSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-xs',
};

export function Button({
  children, variant = 'primary', size = 'md',
  icon, disabled, onClick, type = 'button', className = '',
}: {
  children: React.ReactNode;
  variant?: BtnVariant;
  size?: BtnSize;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}) {
  const variantCls = {
    primary:   'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm dark:bg-indigo-500 dark:hover:bg-indigo-600',
    secondary: 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700',
    ghost:     'bg-transparent hover:bg-slate-100 text-slate-600 dark:hover:bg-zinc-800 dark:text-zinc-400',
    danger:    'bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 shadow-sm dark:bg-zinc-800 dark:border-rose-800 dark:hover:bg-rose-950 dark:text-rose-400',
  }[variant];
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 font-semibold ${R.lg} transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${BTN_SIZE[size]} ${variantCls} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   INPUT — h-9/h-10, px-3 text-sm rounded-lg
═══════════════════════════════════════════════════════════════ */
export function Input({
  label, id, inputSize = 'md', className = '', ...rest
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label?: string;
  inputSize?: 'sm' | 'md';
}) {
  const heightCls = inputSize === 'sm' ? 'h-9' : 'h-10';
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={id} className={T.label + ' dark:text-zinc-400'}>{label}</label>}
      <input
        id={id}
        className={`${heightCls} w-full ${R.lg} border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 dark:placeholder-zinc-500 dark:focus:ring-indigo-500 ${className}`}
        {...rest}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SELECT — h-9/h-10, px-3 text-sm rounded-lg
═══════════════════════════════════════════════════════════════ */
export function Select({
  label, id, inputSize = 'md', children, className = '', ...rest
}: Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> & {
  label?: string;
  inputSize?: 'sm' | 'md';
}) {
  const heightCls = inputSize === 'sm' ? 'h-9' : 'h-10';
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={id} className={T.label + ' dark:text-zinc-400'}>{label}</label>}
      <select
        id={id}
        className={`${heightCls} w-full ${R.lg} border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 dark:focus:ring-indigo-500 ${className}`}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD — uniform p-5/p-6 outer card wrapper
═══════════════════════════════════════════════════════════════ */
export function Card({
  children, padding = 'md', className = '',
}: {
  children: React.ReactNode;
  padding?: 'md' | 'lg' | 'none';
  className?: string;
}) {
  const padCls = padding === 'md' ? 'p-5' : padding === 'lg' ? 'p-6' : '';
  return (
    <div className={`bg-white border border-slate-200 ${R.xl} shadow-sm ${padCls} dark:bg-zinc-900 dark:border-zinc-800 ${className}`}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD HEADER — consistent section titles inside cards
═══════════════════════════════════════════════════════════════ */
export function CardHeader({
  icon, title, subtitle, action,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2 rounded-lg bg-slate-100 flex-shrink-0 dark:bg-zinc-800">{icon}</div>
        )}
        <div>
          <h2 className={T.cardTitle + ' dark:text-zinc-50'}>{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5 dark:text-zinc-500">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE HEADER — top-of-page section with title + actions
═══════════════════════════════════════════════════════════════ */
export function PageHeader({
  icon, title, subtitle, actions,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <Card padding="md" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon && <div className="p-2.5 rounded-xl bg-indigo-50 flex-shrink-0 dark:bg-indigo-950/60">{icon}</div>}
        <div>
          <h1 className={T.pageTitle + ' dark:text-zinc-50'}>{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5 dark:text-zinc-400">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STAT TILE — summary metric inside cards
═══════════════════════════════════════════════════════════════ */
export function StatTile({
  icon, label, value, color = 'text-slate-800',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-4 dark:bg-zinc-800/50 dark:border-zinc-700">
      <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0 dark:bg-zinc-800">{icon}</div>
      <div>
        <p className={`text-base font-bold ${color} dark:text-zinc-100`}>{value}</p>
        <p className="text-xs text-slate-400 font-medium mt-0.5 dark:text-zinc-500">{label}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STAT PILL — inline metric badge (header area)
═══════════════════════════════════════════════════════════════ */
export function StatPill({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${color}`}>
      {icon}
      <span className="font-bold">{value}</span>
      <span className="opacity-70">{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STAT CARD — larger metric card (grid overview panels)
═══════════════════════════════════════════════════════════════ */
export function StatCard({
  label, value, icon, color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className={`bg-white dark:bg-zinc-900 border border-slate-250 dark:border-zinc-800 ${R.xl} p-5 flex items-center gap-4 shadow-sm ${color}`}>
      <div className="p-2.5 bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700/60 rounded-xl shadow-sm flex-shrink-0">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-slate-800 dark:text-zinc-50">{value}</p>
        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-0.5 leading-tight">{label}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EMPTY STATE — centred placeholder
═══════════════════════════════════════════════════════════════ */
export function EmptyState({
  icon, message, description, action,
}: {
  icon?: React.ReactNode;
  message: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-12 flex flex-col items-center gap-3 text-slate-400">
      {icon && <div className="text-slate-200">{icon}</div>}
      <p className="text-sm font-semibold text-slate-500">{message}</p>
      {description && <p className="text-xs text-slate-400">{description}</p>}
      {action}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SPINNER
═══════════════════════════════════════════════════════════════ */
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-10 w-10' : 'h-7 w-7';
  return (
    <div className={`animate-spin rounded-full border-b-2 border-indigo-500 ${dim}`} />
  );
}

/* ═══════════════════════════════════════════════════════════════
   LOADING STATE — centered spinner with label
═══════════════════════════════════════════════════════════════ */
export function LoadingState({ label = 'Đang tải...' }: { label?: string }) {
  return (
    <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
      <Spinner />
      <span className="text-xs font-semibold">{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DIVIDER
═══════════════════════════════════════════════════════════════ */
export function Divider({ className = '' }: { className?: string }) {
  return <div className={`h-px bg-slate-100 ${className}`} />;
}

export { CustomSelect } from './CustomSelect';
export type { DropdownOption } from './CustomSelect';
