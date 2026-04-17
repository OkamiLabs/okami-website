import type { Metadata } from 'next';
import BookFlow from '@/components/book/BookFlow';

export const metadata: Metadata = {
  title: 'Book the Okami Review',
  description:
    'Book the Okami Review. A structured conversation and full report on how your business runs, where it breaks, and what to fix first.',
  openGraph: {
    title: 'Book the Okami Review — Okami Labs',
    description:
      'Book the Okami Review. A structured conversation and full report on how your business runs, where it breaks, and what to fix first.',
  },
};

interface PageProps {
  searchParams: Promise<{ service?: string }>;
}

export default async function BookPage({ searchParams }: PageProps) {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
  const params = await searchParams;
  const defaultServiceId =
    params.service === 'discovery' ? 'discovery' : 'review';

  return (
    <main className="min-h-screen bg-dark">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-24">
        <BookFlow
          stripePublishableKey={publishableKey}
          defaultServiceId={defaultServiceId}
        />
      </div>
    </main>
  );
}
