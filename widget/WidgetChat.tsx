import { useState, useCallback } from 'react';
import { useChat } from 'ai/react';
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
// WidgetChat
// ---------------------------------------------------------------------------

export const WidgetChat: React.FC<WidgetChatProps> = ({ config, isOpen, onClose }) => {
  const [conversationId, setConversationId] = useState<string | undefined>();

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
  } = useChat({
    api: '/api/chat',
    body: {
      ...getPageContext(),
      ...(conversationId ? { conversationId } : {}),
    },
    onResponse(response) {
      // Capture the conversation ID from the first response header
      const id = response.headers.get('x-conversation-id');
      if (id && !conversationId) {
        setConversationId(id);
      }
    },
  });

  const onInputChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleInputChange(event);
    },
    [handleInputChange],
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
      {error && (
        <div className="widget-error" role="alert">
          Something went wrong. Please try again.
        </div>
      )}

      {/* Messages */}
      <MessageList
        messages={messages}
        isLoading={isLoading}
        config={config}
      />

      {/* Input */}
      <MessageInput
        placeholderText={config.placeholderText}
        maxMessageLength={config.maxMessageLength}
        onSubmit={handleSubmit}
        input={input}
        onInputChange={onInputChange}
      />
    </div>
  );
};
