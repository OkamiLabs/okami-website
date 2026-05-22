import { tool } from 'ai';
import { z } from 'zod';
import { sql } from '../db/client';
import { sendSlackNotification } from '../notifications';

export function getTools(visitorId: string, conversationId: string) {
  return {
    captureLeadInfo: tool({
      description: 'Capture contact information when a visitor shares it. Use for names, emails, phone numbers, or service interests.',
      inputSchema: z.object({
        name: z.string().max(200).optional().describe('Visitor name'),
        email: z.string().max(254).optional().describe('Visitor email'),
        phone: z.string().max(30).optional().describe('Visitor phone number'),
        serviceInterest: z.string().max(500).optional().describe('What service they are interested in'),
      }),
      execute: async ({ name, email, phone, serviceInterest }) => {
        // Validate email format if provided
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return 'The email address provided does not appear to be valid. Could you double-check it?';
        }

        // Max 3 captures per session (visitor)
        const [captureCount] = (await sql`
          SELECT COUNT(*) as count FROM leads
          WHERE visitor_id = ${visitorId}
          AND created_at > NOW() - INTERVAL '1 hour'
        `) as Array<{ count: string }>;

        if (parseInt(captureCount?.count ?? '0', 10) >= 3) {
          return 'Thank you, we already have your information on file.';
        }

        // Dedup by email within 1 hour
        if (email) {
          const recentLead = (await sql`
            SELECT id FROM leads
            WHERE email = ${email}
            AND created_at > NOW() - INTERVAL '1 hour'
            LIMIT 1
          `) as Array<{ id: string }>;

          if (recentLead.length > 0) {
            return 'Thanks, we already have your contact details.';
          }
        }

        await sql`
          INSERT INTO leads (id, visitor_id, conversation_id, name, email, phone, service_interest)
          VALUES (gen_random_uuid(), ${visitorId}, ${conversationId}, ${name ?? null}, ${email ?? null}, ${phone ?? null}, ${serviceInterest ?? null})
        `;

        await sendSlackNotification({
          type: 'lead',
          visitorId,
          data: { name, email, phone, serviceInterest },
        });

        return 'Got it, thanks for sharing your information.';
      },
    }),
  };
}
