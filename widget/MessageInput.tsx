import { useState, useRef, useCallback, useEffect, FormEvent } from 'react';

interface MessageInputProps {
  placeholderText: string;
  maxMessageLength: number;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  input: string;
  onInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  isConnected?: boolean;
  className?: string;
}

// Send Icon Component
const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
    />
  </svg>
);

export const MessageInput: React.FC<MessageInputProps> = ({
  placeholderText,
  maxMessageLength,
  onSubmit,
  input,
  onInputChange,
  disabled = false,
  isConnected = true,
  className = '',
}) => {
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 120; // 6 lines approximately

    textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
  }, []);

  // Handle input change with length limit
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (event.target.value.length <= maxMessageLength) {
      onInputChange(event);
    }
  }, [maxMessageLength, onInputChange]);

  // Handle form submission
  const handleSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedMessage = input.trim();
    if (!trimmedMessage || isSending || disabled || !isConnected) {
      return;
    }

    setIsSending(true);

    try {
      onSubmit(event);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, disabled, isConnected, onSubmit]);

  // Handle key down for submit shortcuts
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        // Allow new line with Shift+Enter
        return;
      } else {
        // Submit with Enter
        event.preventDefault();
        if (textareaRef.current?.form) {
          textareaRef.current.form.requestSubmit();
        }
      }
    }
  }, []);

  // Auto-resize on input change
  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  // Focus textarea when connected
  useEffect(() => {
    if (isConnected && !disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isConnected, disabled]);

  const isSubmitDisabled = !input.trim() || isSending || disabled || !isConnected;
  const characterCount = input.length;
  const isNearLimit = characterCount > maxMessageLength * 0.8;

  return (
    <div className={`widget-chat__input-container ${className}`}>
      <form className="widget-chat__input-form" onSubmit={handleSubmit}>
        <div className="widget-chat__input-wrapper">
          <textarea
            ref={textareaRef}
            className="widget-chat__input"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? placeholderText : 'Connecting...'}
            disabled={disabled || !isConnected}
            rows={1}
            aria-label="Type your message"
            aria-describedby="character-count"
            maxLength={maxMessageLength}
          />

          {/* Character count indicator */}
          {isNearLimit && (
            <div
              id="character-count"
              className={`widget-chat__character-count ${
                characterCount >= maxMessageLength ? 'widget-chat__character-count--limit' : ''
              }`}
              aria-live="polite"
            >
              {characterCount}/{maxMessageLength}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="widget-chat__send-button"
          disabled={isSubmitDisabled}
          aria-label={
            isSending
              ? 'Sending message...'
              : isSubmitDisabled
                ? 'Cannot send message'
                : 'Send message'
          }
        >
          {isSending ? (
            <div className="widget-loading__spinner" aria-hidden="true" />
          ) : (
            <SendIcon className="widget-chat__send-icon" />
          )}
        </button>
      </form>

      {/* Connection status indicator */}
      {!isConnected && (
        <div className="widget-chat__connection-status" role="status" aria-live="polite">
          <span className="widget-sr-only">Disconnected from chat</span>
          Reconnecting...
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      <div className="widget-chat__input-hint">
        <span className="widget-sr-only">
          Press Enter to send, Shift+Enter for new line
        </span>
        <span aria-hidden="true" className="widget-chat__hint-text">
          Press Enter to send
        </span>
      </div>
    </div>
  );
};
