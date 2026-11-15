import Link from "next/link";

export function Nav() {
  return (
    <header className="border-b border-border bg-canvas/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-black text-ink-primary">Granted Source Agent</span>
          <span className="hidden text-xs text-ink-muted sm:inline">AI Grant Research &amp; Intelligence Platform</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-ink-secondary" aria-label="Primary">
          <Link href="/" className="hover:text-ink-primary">
            Dashboard
          </Link>
          <Link href="/profile" className="hover:text-ink-primary">
            Org Profile
          </Link>
        </nav>
      </div>
    </header>
  );
}
