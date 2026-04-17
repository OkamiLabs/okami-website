import Link from 'next/link';
import Image from 'next/image';

export default function BookTopBar() {
  return (
    <div className="w-full border-b border-ash/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-20">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-full overflow-hidden transition-transform duration-300 group-hover:scale-105">
            <Image
              src="/wolf-logo.webp"
              alt="Okami Labs"
              fill
              className="object-cover scale-[1.15]"
            />
          </div>
          <span className="font-mono text-sm tracking-wider uppercase text-off-white">
            Okami
          </span>
        </Link>
        <Link
          href="/"
          className="font-mono text-xs tracking-widest uppercase text-ash hover:text-off-white transition-colors"
        >
          Exit
        </Link>
      </div>
    </div>
  );
}
