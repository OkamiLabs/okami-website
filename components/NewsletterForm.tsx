'use client';

import { useState, FormEvent } from 'react';
import Button from './Button';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Welcome to The Silent Brief.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {status === 'success' ? (
        <div className="text-center space-y-4">
          <span className="font-playfair text-lg text-off-white italic block">
            You&apos;re in.
          </span>
          <p className="font-body text-sm text-ash leading-relaxed">
            Check your inbox for <span className="text-off-white">The Operator&apos;s Blueprint</span> — a
            framework for seeing where your business actually stands before adding tools or
            technology.
          </p>
          <p className="font-body text-xs text-ash/60">
            Didn&apos;t get it? Check your spam folder or promotions tab.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <span className="font-mono text-xs uppercase tracking-widest text-ash/60 block mb-1">
              Newsletter
            </span>
            <span className="font-playfair text-lg text-off-white italic">
              The Silent Brief
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                type="email"
                id="newsletter-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={status === 'loading'}
                className="w-full px-6 py-4 bg-dark border border-ash/20 text-off-white font-body text-sm placeholder:text-ash/50 focus:outline-none focus:border-off-white transition-colors disabled:opacity-50"
              />
            </div>

            <Button
              type="submit"
              variant="ghost"
              className="w-full"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Subscribing...' : 'Get The Operator\'s Blueprint'}
            </Button>

            {status === 'error' && message && (
              <p className="font-body text-sm text-center text-ash">
                {message}
              </p>
            )}
          </form>

          <p className="mt-6 font-body text-xs text-ash text-center leading-relaxed">
            Subscribe and get the scorecard Okami uses in every review — free.
          </p>
        </>
      )}
    </div>
  );
}
