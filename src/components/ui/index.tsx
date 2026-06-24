import React from 'react';

/** Reusable stat pill: small colored badge with icon, number and label */
export function StatPill({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold ${color}`}>
      {icon}
      {value}
      <span className="font-semibold opacity-70">{label}</span>
    </div>
  );
}

/** Reusable stat card: bigger card with icon on the left */
export function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className={`bg-white border rounded-xl p-4 flex items-center gap-3 shadow-sm ${color}`}>
      <div className="p-2 rounded-lg bg-white shadow-inner flex-shrink-0">{icon}</div>
      <div>
        <p className="text-xl font-extrabold text-slate-800">{value}</p>
        <p className="text-[11px] font-semibold text-slate-500 mt-0.5 leading-tight">{label}</p>
      </div>
    </div>
  );
}

/** Generic empty-state placeholder */
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-8 text-center text-xs text-slate-400 font-semibold italic">
      {message}
    </div>
  );
}
