import Link from "next/link";

export function Spinner({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`animate-spin text-red-700 ${className}`} aria-label="Loading">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function LoadingState({ text = "Loading…" }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-neutral-500">
      <Spinner />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  actionHref,
  actionText,
}: {
  title: string;
  message: string;
  actionHref?: string;
  actionText?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-14 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
        <svg viewBox="0 0 24 24" className="h-8 w-8 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 7h11v10H3zM14 10h4l3 3v4h-7zM7 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
        </svg>
      </div>
      <h3 className="mt-4 font-display text-lg font-bold text-neutral-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-neutral-500">{message}</p>
      {actionHref && (
        <Link
          href={actionHref}
          className="mt-5 rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
        >
          {actionText || "Continue Shopping"}
        </Link>
      )}
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  href,
  linkText = "View All",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-xl font-extrabold text-neutral-900 md:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="shrink-0 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 transition hover:border-red-700 hover:text-red-700"
        >
          {linkText} →
        </Link>
      )}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
      <div className="skeleton aspect-square" />
      <div className="space-y-2 p-4">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
        <div className="skeleton h-9 w-full rounded-xl" />
      </div>
    </div>
  );
}
