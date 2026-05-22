import { useState, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { WidgetConfig } from './types/widget';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface WidgetChatProps {
  config: WidgetConfig;
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Page context helper — reads URL, title, and optional data attribute
// ---------------------------------------------------------------------------

function getPageContext(): { url: string; title: string; meta?: string } {
  const ctx: { url: string; title: string; meta?: string } = {
    url: window.location.href,
    title: document.title,
  };

  const scriptEl = document.querySelector('script[data-page-context]');
  if (scriptEl) {
    const raw = scriptEl.getAttribute('data-page-context');
    if (raw) ctx.meta = raw;
  }

  return ctx;
}

// ---------------------------------------------------------------------------
// Close icon
// ---------------------------------------------------------------------------

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

// ---------------------------------------------------------------------------
// Error message helper
// ---------------------------------------------------------------------------

/**
 * Derive a typed error message from the useChat error object.
 *
 * HttpChatTransport throws new Error(await response.text()) when the HTTP
 * response is not OK. The raw JSON string from /api/chat becomes error.message.
 * Parse it to read the `error` field — 'rate_limit' or 'capacity'.
 *
 * NOTE: both rate_limit and capacity arrive as HTTP 429. Differentiate via the
 * JSON body field, NOT the HTTP status code.
 */
function getErrorMessage(error: Error | undefined): string {
  if (!error) return '';
  try {
    const parsed = JSON.parse(error.message) as { error?: string };
    if (parsed.error === 'rate_limit') {
      return "You've sent a lot of messages — give it a moment and try again.";
    }
    if (parsed.error === 'capacity') {
      return "We've hit our AI usage limit for now. Try again a bit later.";
    }
  } catch {
    // error.message is not JSON (network error, DNS failure, etc.) — fall through
  }
  return 'Something went wrong on our end. Try again in a moment.';
}

// ---------------------------------------------------------------------------
// WidgetChat
// ---------------------------------------------------------------------------

export const WidgetChat: React.FC<WidgetChatProps> = ({ config, isOpen, onClose }) => {
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [input, setInput] = useState('');

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      // Custom fetch wrapper: captures conversation ID from response headers.
      // This is the v5 replacement for the removed v4 callback (D-09 / Gotcha 3).
      fetch: async (url, init) => {
        const response = await globalThis.fetch(url, init);
        const id = response.headers.get('x-conversation-id');
        if (id) setConversationId(id);
        return response;
      },
    }),
  });

  // Build submit handler — captures conversationId at call time (not at hook init).
  // This fixes the staleness bug where message 2+ would use an empty conversationId.
  const handleFormSubmit = useCallback(() => {
    if (!input.trim()) return;
    sendMessage(
      { text: input },
      {
        body: {
          ...getPageContext(),
          ...(conversationId ? { conversationId } : {}),
        },
      },
    );
    setInput('');
  }, [input, sendMessage, conversationId]);

  const onInputChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(event.target.value);
    },
    [],
  );

  if (!isOpen) return null;

  return (
    <div className="widget-chat" role="dialog" aria-label={`Chat with ${config.companyName}`}>
      {/* Header */}
      <div className="widget-chat__header">
        <div className="widget-chat__header-content">
          <div className="widget-chat__avatar">
            {config.avatarUrl ? (
              <img src={config.avatarUrl} alt={`${config.companyName} avatar`} />
            ) : (
              <svg width="20" height="20" fill="white" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
            )}
          </div>
          <div>
            <h2 className="widget-chat__title">{config.companyName}</h2>
          </div>
        </div>

        <button
          className="widget-chat__close"
          onClick={onClose}
          aria-label="Close chat"
          type="button"
        >
          <CloseIcon className="widget-chat__close-icon" />
        </button>
      </div>

      {/* Error banner */}
      {status === 'error' && (
        <div className="widget-error" role="alert">
          {getErrorMessage(error)}
        </div>
      )}

      {/* Messages */}
      <MessageList
        messages={messages}
        status={status}
        config={config}
      />

      {/* Input */}
      <MessageInput
        placeholderText={config.placeholderText}
        maxMessageLength={config.maxMessageLength}
        onSubmit={handleFormSubmit}
        input={input}
        onInputChange={onInputChange}
      />
    </div>
  );
};
