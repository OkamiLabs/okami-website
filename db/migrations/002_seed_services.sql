-- Up Migration

INSERT INTO services (name, description, price, duration, sort_order) VALUES
  ('AI Strategy Consultation', 'Deep-dive session to map your AI opportunities, evaluate feasibility, and build a prioritized roadmap', '$500', '2 hours', 1),
  ('Custom AI Development', 'End-to-end development of AI-powered applications tailored to your business needs', 'Starting at $5,000', '4-8 weeks', 2),
  ('WhatsApp Automation', 'Intelligent WhatsApp automation for lead capture, booking, and customer engagement', 'Starting at $2,000/mo', '2-4 weeks setup', 3),
  ('Discovery Call', 'Free introductory call to discuss your project and see if we''re a good fit', 'Free', '30 minutes', 4);

-- Down Migration

DELETE FROM services WHERE name IN (
  'AI Strategy Consultation',
  'Custom AI Development',
  'WhatsApp Automation',
  'Discovery Call'
);
