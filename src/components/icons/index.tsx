import React from 'react';

export type SVGProps = React.SVGProps<SVGSVGElement>;

const defaults: SVGProps = { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

/** Filled Dot */
export const DotFilled = (p: SVGProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <circle cx="12" cy="12" r="8" />
  </svg>
);

// ── Entities ──────────────────────────────────────────────────────────────────

/** 🏢 Company / Office */
export const Building = (p: SVGProps) => (
  <svg {...defaults} {...p}>
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

/** 👥 Department / Group */
export const Users = (p: SVGProps) => (
  <svg {...defaults} {...p}>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);

/** 👤 Person / Employee */
export const User = (p: SVGProps) => (
  <svg {...defaults} {...p}>
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// ── Roles / Auth ──────────────────────────────────────────────────────────────

/** 🔑 Key / Admin */
export const Key = (p: SVGProps) => (
  <svg {...defaults} {...p}>
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

/** 🛡️ Shield / Security */
export const Shield = (p: SVGProps) => (
  <svg {...defaults} {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// ── KPI / Dashboard ───────────────────────────────────────────────────────────

/** 🎯 Target / Goal */
export const Target = (p: SVGProps) => (
  <svg {...defaults} {...p}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

/** 📊 Chart / Analytics */
export const BarChart = (p: SVGProps) => (
  <svg {...defaults} {...p}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);

/** 📈 Trending up */
export const TrendingUp = (p: SVGProps) => (
  <svg {...defaults} {...p}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

// ── Catalog / Admin ───────────────────────────────────────────────────────────

/** 🏅 Medal / Position */
export const Medal = (p: SVGProps) => (
  <svg {...defaults} {...p}>
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

/** 📅 Calendar / Cycle */
export const Calendar = (p: SVGProps) => (
  <svg {...defaults} {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

/** 🗂️ Folder / Category */
export const FolderOpen = (p: SVGProps) => (
  <svg {...defaults} {...p}>
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    <polyline points="8 13 12 17 16 13" />
    <line x1="12" y1="11" x2="12" y2="17" />
  </svg>
);

/** 📋 Clipboard / Template */
export const ClipboardList = (p: SVGProps) => (
  <svg {...defaults} {...p}>
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="16" x2="13" y2="16" />
  </svg>
);

/** 🗄️ Database / Catalog */
export const Database = (p: SVGProps) => (
  <svg {...defaults} {...p}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

// ── Status / Actions ──────────────────────────────────────────────────────────

/** ⚡ Lightning / Quick */
export const Zap = (p: SVGProps) => (
  <svg {...defaults} {...p}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

/** ✅ Check Circle / Done */
export const CheckCircle = (p: SVGProps) => (
  <svg {...defaults} {...p}>
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

/** ⚠️ Alert Triangle / Problem */
export const AlertTriangle = (p: SVGProps) => (
  <svg {...defaults} {...p}>
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

/** 🔵 Plan dot (circle outline) */
export const Circle = (p: SVGProps) => (
  <svg {...defaults} {...p}>
    <circle cx="12" cy="12" r="9" />
  </svg>
);

/** ✦ Star sparkle */
export const Sparkles = (p: SVGProps) => (
  <svg {...defaults} {...p}>
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
    <path d="M5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75L5 17z" />
    <path d="M19 3l.5 1.5L21 5l-1.5.5L19 7l-.5-1.5L17 5l1.5-.5L19 3z" />
  </svg>
);
