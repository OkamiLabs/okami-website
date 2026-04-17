'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith('/book/confirmed') || pathname.startsWith('/book/cancelled')) return null;

  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-ash/10 mt-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-mono text-xs tracking-wider text-ash">
            &copy; {currentYear} Okami Labs. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="font-mono text-xs tracking-wider text-ash hover:text-off-white transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="font-mono text-xs tracking-wider text-ash hover:text-off-white transition-colors"
            >
              Terms
            </Link>
            <a
              href="https://okamilabs.com"
              className="font-mono text-xs tracking-wider text-ash hover:text-off-white transition-colors"
            >
              okamilabs.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
