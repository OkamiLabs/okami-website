import { useEffect, useRef, useCallback } from 'react';
import type { Message } from 'ai/react';
import type { WidgetConfig } from './types/widget';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  config: WidgetConfig;
  className?: string;
}

// ---------------------------------------------------------------------------
// Typing Indicator (shown when waiting for assistant response)
// ---------------------------------------------------------------------------

const TypingIndicator: React.FC = () => (
  <div className="typing-indicator" role="status" aria-live="polite">
    <span className="widget-sr-only">Assistant is typing</span>
    <span aria-hidden="true">Assistant is typing</span>
    <div className="typing-indicator__dots">
      <div className="typing-indicator__dot" />
      <div className="typing-indicator__dot" />
      <div className="typing-indicator__dot" />
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Tool invocation cards
// ---------------------------------------------------------------------------

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  state: 'partial-call' | 'call' | 'result';
  result?: unknown;
}

const BookingCard: React.FC<{ args: Record<string, unknown> }> = ({ args }) => {
  const date = args.preferredDate != null ? String(args.preferredDate) : null;
  const time = args.preferredTime != null ? String(args.preferredTime) : null;
  const when = [date, time].filter(Boolean).join(' at ') || null;
  return (
    <div
      className="message__tool-card"
      style={{
        border: '1px solid var(--widget-success-color)',
        borderRadius: 'var(--widget-border-radius)',
        padding: 'var(--widget-spacing-sm) var(--widget-spacing-md)',
        marginTop: 'var(--widget-spacing-xs)',
        backgroundColor: 'rgba(5, 150, 105, 0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <svg width="16" height="16" fill="none" stroke="var(--widget-success-color)" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <strong style={{ fontSize: 'var(--widget-font-size-sm)' }}>Discovery call requested</strong>
      </div>
      {when && (
        <p style={{ margin: '0.25rem 0 0', fontSize: 'var(--widget-font-size-xs)', color: 'var(--widget-text-secondary)' }}>
          {'Requested ' + when + ' \u2014 Lucas will confirm by email'}
        </p>
      )}
    </div>
  );
};

const LeadChip: React.FC<{ args: Record<string, unknown> }> = ({ args }) => {
  const label = args.email != null ? String(args.email) : args.name != null ? String(args.name) : 'info';
  return (
    <span
      className="message__tool-chip"
      style={{
        display: 'inline-block',
        fontSize: 'var(--widget-font-size-xs)',
        color: 'var(--widget-success-color)',
        marginTop: 'var(--widget-spacing-xs)',
      }}
    >
      {'Saved: ' + label}
    </span>
  );
};

const ServiceCard: React.FC<{ result: unknown }> = ({ result }) => {
  const data = (typeof result === 'object' && result !== null ? result : {}) as Record<string, unknown>;
  const name = data.name != null ? String(data.name) : null;
  const description = data.description != null ? String(data.description) : null;
  const price = data.price != null ? String(data.price) : null;
  const duration = data.duration != null ? String(data.duration) : null;

  return (
    <div
      className="message__tool-card"
      style={{
        border: '1px solid var(--widget-border-color)',
        borderRadius: 'var(--widget-border-radius)',
        padding: 'var(--widget-spacing-sm) var(--widget-spacing-md)',
        marginTop: 'var(--widget-spacing-xs)',
        backgroundColor: 'var(--widget-surface-color)',
      }}
    >
      {name && (
        <strong style={{ fontSize: 'var(--widget-font-size-sm)', display: 'block' }}>
          {name}
        </strong>
      )}
      {description && (
        <p style={{ margin: '0.25rem 0', fontSize: 'var(--widget-font-size-xs)', color: 'var(--widget-text-secondary)' }}>
          {description}
        </p>
      )}
      <div style={{ display: 'flex', gap: '1rem', fontSize: 'var(--widget-font-size-xs)', color: 'var(--widget-text-secondary)' }}>
        {price && <span>{price}</span>}
        {duration && <span>{duration}</span>}
      </div>
    </div>
  );
};

const ToolCard: React.FC<{ invocation: ToolInvocation }> = ({ invocation }) => {
  // Only render completed tool results
  if (invocation.state !== 'result') return null;

  switch (invocation.toolName) {
    case 'bookDiscoveryCall':
      return <BookingCard args={invocation.args} />;
    case 'captureLeadInfo':
      return <LeadChip args={invocation.args} />;
    case 'lookupService':
      return <ServiceCard result={invocation.result} />;
    default:
      return null;
  }
};

// ---------------------------------------------------------------------------
// Streaming cursor (pulsing dot on the last assistant message while loading)
// ---------------------------------------------------------------------------

const StreamingCursor: React.FC = () => (
  <span
    className="widget-animate-pulse"
    style={{
      display: 'inline-block',
      width: '6px',
      height: '6px',
      borderRadius: 'var(--widget-border-radius-full)',
      backgroundColor: 'var(--widget-text-secondary)',
      marginLeft: '2px',
      verticalAlign: 'middle',
    }}
    aria-hidden="true"
  />
);

// ---------------------------------------------------------------------------
// Single message bubble
// ---------------------------------------------------------------------------

interface MessageBubbleProps {
  message: Message;
  showStreamingCursor: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, showStreamingCursor }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`message ${isUser ? 'message--user' : 'message--bot'}`}>
      <div className="message__bubble">
        {message.content && (
          <p className="message__text" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {message.content}
            {showStreamingCursor && <StreamingCursor />}
          </p>
        )}

        {/* Tool invocation results */}
        {!isUser && message.toolInvocations?.map((invocation) => (
          <ToolCard
            key={(invocation as ToolInvocation).toolCallId}
            invocation={invocation as ToolInvocation}
          />
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main MessageList
// ---------------------------------------------------------------------------

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  config,
  className = '',
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
  }, []);

  // Scroll to bottom when messages change or loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isLoading, scrollToBottom]);

  // Determine if we should show the typing indicator:
  // loading is true AND the last message is from the user (assistant hasn't started replying)
  const lastMessage = messages[messages.length - 1];
  const showTypingIndicator = isLoading && lastMessage?.role === 'user';

  // Determine if we should show the streaming cursor on the last assistant message
  const lastAssistantIndex = findLastIndex(messages, (m) => m.role === 'assistant');
  const showStreamingCursorOnIndex = isLoading && lastAssistantIndex >= 0 && lastAssistantIndex === messages.length - 1
    ? lastAssistantIndex
    : -1;

  return (
    <div
      ref={containerRef}
      className={`widget-chat__messages ${className}`}
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {/* Welcome message */}
      {messages.length === 0 && (
        <div className="message message--bot message--welcome">
          <div className="message__bubble">
            <p className="message__text" style={{ margin: 0 }}>{config.welcomeMessage}</p>
          </div>
        </div>
      )}

      {/* Message list */}
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          showStreamingCursor={index === showStreamingCursorOnIndex}
        />
      ))}

      {/* Typing indicator */}
      {showTypingIndicator && <TypingIndicator />}

      {/* Invisible element for auto-scrolling */}
      <div ref={messagesEndRef} className="widget-sr-only" aria-hidden="true" />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function findLastIndex<T>(arr: T[], predicate: (item: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    const item = arr[i];
    if (item !== undefined && predicate(item)) return i;
  }
  return -1;
}
