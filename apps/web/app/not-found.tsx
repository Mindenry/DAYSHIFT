import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="overline text-muted">404</p>
      <h1 className="mt-3 font-display text-6xl leading-none md:text-8xl">Off the rack.</h1>
      <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
        The page you were looking for isn&apos;t here. It may have moved, sold out, or never existed.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">Return home</Link>
        <Link href="/collections/new-arrivals" className="btn btn-outline">Shop new arrivals</Link>
      </div>
    </div>
  );
}
