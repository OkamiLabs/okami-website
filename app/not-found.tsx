import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-dark flex items-center justify-center px-6">
      <div className="max-w-2xl mx-auto text-center">
        <span className="font-mono text-8xl md:text-9xl text-ash/10 block leading-none mb-8">
          404
        </span>
        <h1 className="font-playfair text-4xl md:text-5xl text-off-white mb-6 leading-tight">
          Page not found.
        </h1>
        <p className="font-body text-base text-ash mb-12 leading-relaxed">
          The page you're looking for doesn't exist.
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-4 border border-ash text-ash font-mono text-sm uppercase tracking-wider hover:border-off-white hover:text-off-white transition-colors"
        >
          Go Home
        </Link>
      </div>
    </main>
  );
}
