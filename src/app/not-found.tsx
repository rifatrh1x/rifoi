import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
      <p className="font-display text-7xl font-extrabold text-neutral-200">404</p>
      <h1 className="mt-4 font-display text-2xl font-extrabold">Page Not Found</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Sorry, the page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="rounded-xl bg-neutral-900 px-6 py-3 text-sm font-bold text-white hover:bg-red-700">
          Go Home
        </Link>
        <Link href="/shop" className="rounded-xl border border-neutral-200 bg-white px-6 py-3 text-sm font-bold hover:border-neutral-400">
          Shop Now
        </Link>
      </div>
    </div>
  );
}
