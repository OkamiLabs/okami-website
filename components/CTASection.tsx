import Button from './Button';

interface CTASectionProps {
  headline: string;
  subheadline?: string;
  buttonText?: string;
  buttonHref?: string;
  buttonVariant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
}

export default function CTASection({
  headline,
  subheadline,
  buttonText = 'Book a Consultation',
  buttonHref = '/contact',
  buttonVariant = 'primary',
  className = '',
}: CTASectionProps) {
  return (
    <section
      className={`py-24 md:py-32 border-t border-ash/10 ${className}`}
    >
      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="font-playfair text-4xl md:text-5xl lg:text-6xl text-off-white mb-6 leading-tight">
          {headline}
        </h2>
        {subheadline && (
          <p className="font-body text-base md:text-lg text-ash mb-12 max-w-2xl mx-auto leading-relaxed">
            {subheadline}
          </p>
        )}
        <Button href={buttonHref} variant={buttonVariant}>
          {buttonText}
        </Button>
      </div>
    </section>
  );
}
