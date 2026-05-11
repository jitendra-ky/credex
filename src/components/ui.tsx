/**
 * Shared UI Components
 * Reusable, styled components for consistent UI across the app
 */

export function Button({
  children,
  variant = 'primary',
  disabled = false,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
}) {
  const variants = {
    primary: 'bg-sky-400 hover:bg-sky-300 text-slate-950 font-semibold disabled:opacity-50',
    secondary: 'border border-white/10 hover:bg-white/10 text-white font-medium disabled:opacity-50',
    ghost: 'text-sky-400 hover:text-sky-300 font-medium disabled:opacity-50',
  };

  return (
    <button
      disabled={disabled}
      className={`rounded-full px-6 py-2 text-sm transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  error,
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
}) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>}
      <input
        className={`w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-sky-400 focus:outline-none transition ${
          error ? 'border-red-500/50' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function Select({
  label,
  error,
  children,
  className = '',
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
}) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>}
      <select
        className={`w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-slate-100 focus:border-sky-400 focus:outline-none transition ${
          error ? 'border-red-500/50' : ''
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}

export function Alert({
  type = 'info',
  children,
}: {
  type?: 'error' | 'success' | 'info';
  children: React.ReactNode;
}) {
  const variants = {
    error: 'border-red-500/50 bg-red-500/10 text-red-200',
    success: 'border-green-500/50 bg-green-500/10 text-green-200',
    info: 'border-sky-500/50 bg-sky-500/10 text-sky-200',
  };

  return (
    <div className={`rounded-lg border ${variants[type]} px-4 py-3 text-sm`}>
      {children}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-sky-400"></div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold text-white">{children}</h2>;
}

export function PageHeader({ title, subtitle, backLink }: { title: string; subtitle?: string; backLink?: string }) {
  return (
    <header className="mb-12">
      {backLink && (
        <a href={backLink} className="mb-6 inline-block text-sm text-sky-400 hover:text-sky-300">
          ← Back
        </a>
      )}
      <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
      {subtitle && <p className="mt-2 text-slate-300">{subtitle}</p>}
    </header>
  );
}
