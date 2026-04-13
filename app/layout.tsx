import type { Metadata } from "next";
import { Playfair_Display, Outfit, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-face",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit-face",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-face",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://okamilabs.com'),
  title: {
    default: 'Okami Labs',
    template: '%s | Okami Labs',
  },
  description: 'Okami Labs fixes operational foundations before implementing AI. Consulting diagnostics and silent systems that handle the work.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://okamilabs.com',
    siteName: 'Okami Labs',
    title: 'Okami Labs — The Silent Giant Behind Modern Business',
    description: 'Okami Labs fixes operational foundations before implementing AI. Consulting diagnostics and silent systems that handle the work.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Okami Labs' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Okami Labs',
    description: 'Okami Labs fixes operational foundations before implementing AI.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ProfessionalService',
              name: 'Okami Labs',
              url: 'https://okamilabs.com',
              logo: 'https://okamilabs.com/wolf-logo.webp',
              description:
                'Okami Labs fixes operational foundations before implementing AI. Consulting diagnostics and silent systems that handle the work.',
              areaServed: {
                '@type': 'Place',
                name: 'South Florida',
              },
              serviceType: [
                'Operations Consulting',
                'AI Systems Integration',
                'Workflow Automation',
              ],
              knowsAbout: [
                'Operations Diagnostic',
                'Workflow Optimization',
                'AI Automation',
                'Business Process Improvement',
              ],
            }),
          }}
        />
      </head>
      <body className={`${playfair.variable} ${outfit.variable} ${jetbrainsMono.variable}`}>
        <Navigation />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
