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
// Tool-call display helpers (rendered inside MessageList)
// ---------------------------------------------------------------------------

export interface ToolCallDisplay {
  type: 'booking-confirmation' | 'lead-captured' | 'service-card';
  data: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Theme presets
// ---------------------------------------------------------------------------

export const LIGHT_THEME: WidgetTheme = {
  mode: 'light',
  primaryColor: '#7c3aed',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  borderRadius: '8px',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

export const DARK_THEME: WidgetTheme = {
  mode: 'dark',
  primaryColor: '#8b5cf6',
  backgroundColor: '#1f2937',
  textColor: '#f9fafb',
  borderRadius: '8px',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

// ---------------------------------------------------------------------------
// Default configuration
// ---------------------------------------------------------------------------

export const DEFAULT_CONFIG: WidgetConfig = {
  theme: LIGHT_THEME,
  companyName: 'Okami',
  welcomeMessage: 'Hey! How can we help you today?',
  placeholderText: 'Ask me anything...',
  maxMessageLength: 1000,
  position: 'bottom-right',
};
