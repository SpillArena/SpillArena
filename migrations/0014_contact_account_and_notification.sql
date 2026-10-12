-- A small verified account snapshot, never credentials or gameplay documents.
ALTER TABLE contact_messages ADD COLUMN account_info TEXT;
-- Existing messages predate delivery tracking, so their state is unknown.
ALTER TABLE contact_messages ADD COLUMN notification_status TEXT NOT NULL DEFAULT 'unknown'
  CHECK (notification_status IN ('unknown', 'pending', 'sent', 'failed', 'not_configured'));
