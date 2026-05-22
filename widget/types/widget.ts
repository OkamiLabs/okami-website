/**
 * Okami Widget - Type Definitions
 *
 * Clean types aligned with AI SDK's useChat hook.
 * Rewritten from Vox — no legacy baggage.
 */

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

export interface WidgetTheme {
  mode: 'light' | 'dark' | 'auto';
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: string;
  fontFamily: string;
}

/** CSS custom-property name → value mapping applied to the widget container. */
export type ThemeVariables = Record<string, string>;

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface WidgetConfig {
  theme: WidgetTheme;
  companyName: string;
  welcomeMessage: string;
  placeholderText: string;
  maxMessageLength: number;
  avatarUrl?: string;
  position: 'bottom-right' | 'bottom-left';
}

// ---------------------------------------------------------------------------
// Default configuration
// ---------------------------------------------------------------------------

export const DEFAULT_CONFIG: WidgetConfig = {
  theme: {
    mode: 'dark',
    primaryColor: '#6878A0',
    backgroundColor: 'rgba(15, 15, 15, 0.95)',
    textColor: '#e8e6e1',
    borderRadius: '16px',
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  companyName: 'Okami',
  welcomeMessage: 'What can I help you with?',
  placeholderText: 'Ask me anything...',
  maxMessageLength: 1000,
  position: 'bottom-right',
};
