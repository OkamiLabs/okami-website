import { useEffect, useRef, useCallback } from 'react';
import type { UIMessage } from 'ai';
import type { WidgetConfig } from './types/widget';

interface MessageListProps {
  messages: UIMessage[];
  status: 'submitted' | 'streaming' | 'ready' | 'error';
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
// Generic tool card (D-03: one card handles all tool invocations)
// ---------------------------------------------------------------------------

const GenericToolCard: React.FC<{ toolName: string; result: unknown }> = ({
  toolName,
  result,
}) => {
  let resultSummary: string;
  if (typeof result === 'string') {
    resultSummary = result.slice(0, 120);
  } else if (result !== null && typeof result === 'object') {
    resultSummary = Object.entries(result as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join(' · ')
      .slice(0, 120);
  } else {
    resultSummary = String(result ?? '');
  }

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
      <strong
        style={{
          fontSize: 'var(--widget-font-size-sm)',
          display: 'block',
        }}
      >
        {toolName}
      </strong>
      <p
        style={{
          margin: '0.25rem 0 0',
          fontSize: 'var(--widget-font-size-xs)',
          color: 'var(--widget-text-secondary)',
        }}
      >
        {resultSummary}
      </p>
    </div>
  );
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
// Link-aware text renderer
// ---------------------------------------------------------------------------

function renderTextWithLinks(text: string): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  const re = /(https?:\/\/[^\s<>"]+|okamilabs\.com\/[^\s<>"]*)/g;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const raw = match[0];
    const href = raw.startsWith('http') ? raw : `https://${raw}`;
    nodes.push(
      <a
        key={match.index}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: 'var(--widget-primary-color)',
          textDecoration: 'underline',
          wordBreak: 'break-all',
        }}
      >
        {raw}
      </a>
    );
    last = match.index + raw.length;
  }
  if (last < text.length) {
    nodes.push(text.slice(last));
  }
  return <>{nodes}</>;
}

// ---------------------------------------------------------------------------
// Single message bubble
// ---------------------------------------------------------------------------

interface MessageBubbleProps {
  message: UIMessage;
  showStreamingCursor: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, showStreamingCursor }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`message ${isUser ? 'message--user' : 'message--bot'}`}>
      <div className="message__bubble">
        {message.parts.map((part, i) => {
          if (part.type === 'text') {
            return (
              <p
                key={i}
                className="message__text"
                style={{ margin: 0, whiteSpace: 'pre-wrap' }}
              >
                {renderTextWithLinks(part.text)}
                {showStreamingCursor && i === message.parts.length - 1 && (
                  <StreamingCursor />
                )}
              </p>
            );
          }
          // Tool parts: type is 'tool-{toolName}' (e.g. 'tool-captureLeadInfo').
          // Render only when output is available (state === 'output-available').
          // Render nothing during execution (input-streaming, input-available).
          if (part.type.startsWith('tool-') && !isUser) {
            if ((part as { state: string }).state !== 'output-available') return null;
            const toolName = part.type.slice(5);
            return (
              <GenericToolCard
                key={i}
                toolName={toolName}
                result={(part as { output?: unknown }).output}
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main MessageList
// ---------------------------------------------------------------------------

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  status,
  config,
  className = '',
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  // Scroll to bottom when messages change or status changes
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, status, scrollToBottom]);

  // Determine if we should show the typing indicator:
  // status is submitted or streaming AND the last message is from the user (assistant hasn't started replying)
  const lastMessage = messages[messages.length - 1];
  const showTypingIndicator =
    (status === 'submitted' || status === 'streaming') &&
    lastMessage?.role === 'user';

  // Determine if we should show the streaming cursor on the last assistant message
  const lastAssistantIndex = findLastIndex(messages, (m) => m.role === 'assistant');
  const showStreamingCursorOnIndex =
    status === 'streaming' &&
    lastAssistantIndex >= 0 &&
    lastAssistantIndex === messages.length - 1
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
