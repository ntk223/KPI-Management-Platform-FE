import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/**
 * ThemeSwitcher — reads from the global ThemeContext singleton.
 * Uses Lucide Sun / Moon icons. No text emojis.
 */
export function ThemeSwitcher() {
  const { isDark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={[
        'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border',
        'text-xs font-semibold transition-colors duration-150',
        isDark
          ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100'
          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm',
      ].join(' ')}
    >
      {isDark
        ? <Sun  className="w-3.5 h-3.5 text-amber-400" />
        : <Moon className="w-3.5 h-3.5 text-indigo-500" />
      }
      <span>{isDark ? 'Sáng' : 'Tối'}</span>
    </button>
  );
}
