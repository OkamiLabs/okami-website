import { tool } from 'ai';
import { z } from 'zod';
import { sql } from '../db/client.js';
import { sendSlackNotification } from '../notifications.js';

export function getTools(visitorId: string, conversationId: string) {
  return {
    bookDiscoveryCall: tool({
      description: 'Book a discovery call for the visitor. Use when they want to schedule a meeting or consultation.',
      parameters: z.object({
        preferredDate: z.string().describe('Preferred date in ISO format (YYYY-MM-DD)'),
        preferredTime: z.string().describe('Preferred time (e.g. "10:00 AM", "14:00")'),
        name: z.string().describe('Visitor name'),
        email: z.string().email().describe('Visitor email address'),
        notes: z.string().optional().describe('Additional notes about the call'),
      }),
      execute: async ({ preferredDate, preferredTime, name, email, notes }) => {
        // Check for existing pending booking
        const existing = (await sql`
          SELECT id FROM bookings
          WHERE visitor_id = ${visitorId} AND status = 'pending'
          LIMIT 1
        `) as Array<{ id: string }>;

        if (existing.length > 0) {
          return 'You already have a pending discovery call booking. We will be in touch soon to confirm the details.';
        }

        await sql`
          INSERT INTO bookings (id, visitor_id, conversation_id, requested_date, requested_time, name, email, notes, status)
          VALUES (gen_random_uuid(), ${visitorId}, ${conversationId}, ${preferredDate}, ${preferredTime}, ${name}, ${email}, ${notes ?? null}, 'pending')
        `;

        // Load recent conversation for excerpt
        const recentMessages = (await sql`
          SELECT role, content FROM messages
          WHERE conversation_id = ${conversationId}
          ORDER BY created_at DESC LIMIT 3
        `) as Array<{ role: string; content: string }>;

        const excerpt = recentMessages
          .reverse()
          .map((m) => `${m.role}: ${m.content.slice(0, 100)}`)
          .join('\n');

        await sendSlackNotification({
          type: 'booking',
          visitorId,
          data: { name, email, preferredDate, preferredTime, notes },
          conversationExcerpt: excerpt,
        });

        return `Discovery call booked for ${name} on ${preferredDate} at ${preferredTime}. We'll send a confirmation to ${email} shortly.`;
      },
    }),

    captureLeadInfo: tool({
      description: 'Capture contact information when a visitor shares it. Use for names, emails, phone numbers, or service interests.',
      parameters: z.object({
        name: z.string().optional().describe('Visitor name'),
        email: z.string().optional().describe('Visitor email'),
        phone: z.string().optional().describe('Visitor phone number'),
        serviceInterest: z.string().optional().describe('What service they are interested in'),
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

    lookupService: tool({
      description: 'Look up information about Okami services. Use when a visitor asks about specific services, pricing, or what Okami offers.',
      parameters: z.object({
        query: z.string().describe('Search query for the service'),
      }),
      execute: async ({ query }) => {
        const result = (await sql`
          SELECT name, description, price, duration
          FROM services
          WHERE name ILIKE ${`%${query}%`} OR description ILIKE ${`%${query}%`}
          LIMIT 5
        `) as Array<{
          name: string;
          description: string;
          price: string | null;
          duration: string | null;
        }>;

        if (result.length === 0) {
          return 'I could not find a specific service matching that query. I can help you book a discovery call to discuss your needs in detail.';
        }

        return result
          .map((s) => {
            let line = `${s.name}: ${s.description}`;
            if (s.price) line += ` | Price: ${s.price}`;
            if (s.duration) line += ` | Duration: ${s.duration}`;
            return line;
          })
          .join('\n');
      },
    }),
  };
}
