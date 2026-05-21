---
status: partial
phase: 05-foundation-live-ai
source: [05-VERIFICATION.md]
started: 2026-05-21T10:52:00Z
updated: 2026-05-21T10:52:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. End-to-end streaming
expected: With CHATBOT_ENABLED=1 + valid ANTHROPIC_API_KEY, send a message and confirm tokens stream progressively, TypingIndicator appears while status is 'submitted' or 'streaming', and disappears when status is 'ready'
result: [pending]

### 2. ConversationId on message 2+
expected: Send a second message in the same session — inspect Network tab and confirm the x-conversation-id UUID from the first response header is included in the second request body
result: [pending]

### 3. onAbort reconciliation
expected: Close the browser tab mid-stream and verify the DB shows actual_tokens = 0 on the reservation and no assistant message row was written
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
