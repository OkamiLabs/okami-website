-- Up Migration

INSERT INTO services (name, description, price, duration, sort_order) VALUES
  ('The Okami Review', 'A structured conversation that maps how your business runs, where it breaks, and what to fix first. You receive a full report with prioritized recommendations.', '$299', '45–60 min', 1),
  ('Discovery Call', 'A 15-minute conversation to talk through what''s slowing you down and whether the review is the right fit.', 'Free', '15 min', 2);

-- Down Migration

DELETE FROM services WHERE name IN (
  'The Okami Review',
  'Discovery Call'
);
