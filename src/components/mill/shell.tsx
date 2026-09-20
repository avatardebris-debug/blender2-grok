import { Link } from "@tanstack/react-router";

export function Mark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden className="text-fg">
      <rect x="1" y="1" width="26" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 18.5 L14 8.5 L21 18.5 Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10.5" y="14" width="7" height="5.5" fill="currentColor" />
    </svg>
  );
}

export function ShellHeader({ current }: { current: "mill" | "playbook" }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-3">
        <Link to="/" className="flex items-center gap-3">
          <Mark />
          <span>
            <span className="block font-display text-xl font-semibold leading-none tracking-[0.08em]">CRUCIBLE</span>
            <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
              Asset factory
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            to="/"
            className={
              current === "mill"
                ? "rounded-sm bg-raised px-3 py-2 text-sm text-fg"
                : "rounded-sm px-3 py-2 text-sm text-muted hover:text-fg"
            }
          >
            Mill
          </Link>
          <Link
            to="/playbook"
            className={
              current === "playbook"
                ? "rounded-sm bg-raised px-3 py-2 text-sm text-fg"
                : "rounded-sm px-3 py-2 text-sm text-muted hover:text-fg"
            }
          >
            Playbook
          </Link>
        </nav>
      </div>
    </header>
  );
}
