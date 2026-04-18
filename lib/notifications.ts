interface SlackPayload {
  type: 'lead' | 'booking';
  visitorId: string;
  data: Record<string, unknown>;
  conversationExcerpt?: string;
}

export async function sendSlackNotification(payload: SlackPayload): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const emoji = payload.type === 'booking' ? ':calendar:' : ':bust_in_silhouette:';
  const title = payload.type === 'booking' ? 'New Discovery Call Booking' : 'New Lead Captured';

  const fields = Object.entries(payload.data)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `*${k}:* ${String(v)}`)
    .join('\n');

  const blocks = [
    {
      type: 'section' as const,
      text: {
        type: 'mrkdwn' as const,
        text: `${emoji} *${title}*\nVisitor: \`${payload.visitorId.slice(0, 8)}...\``,
      },
    },
    {
      type: 'section' as const,
      text: {
        type: 'mrkdwn' as const,
        text: fields || '_No additional data_',
      },
    },
  ];

  if (payload.conversationExcerpt) {
    blocks.push({
      type: 'section' as const,
      text: {
        type: 'mrkdwn' as const,
        text: `> ${payload.conversationExcerpt.slice(0, 500)}`,
      },
    });
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });
  } catch (err) {
    // Fail silently — this is non-critical
    console.warn('Slack notification failed:', err instanceof Error ? err.message : err);
  }
}
