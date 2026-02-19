-- =====================================================
-- FINAL WORKING SCHEMA (V3) - FIXED & CONSOLIDATED
-- =====================================================
-- This script replaces ALL previous schema scripts.
-- It fixes the "Policy already exists" errors by removing duplicate policy definitions.
-- It enforces strict security (RLS) and ensures all columns (is_active) exist.
-- =====================================================


-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 2. TABLE STRUCTURES
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('organizer', 'athlete', 'reporter', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bio TEXT,
  avatar TEXT,
  address TEXT,
  contact TEXT,
  website TEXT,
  "profilePicture" TEXT,
  "firstName" TEXT,
  "lastName" TEXT,
  "companyName" TEXT,
  organization TEXT,
  category TEXT,
  "previousVictories" TEXT,
  "socialMedia" TEXT,
  achievements TEXT,
  "mediaOrganization" TEXT,
  "reporterCategory" TEXT,
  experience TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TEXT,
  location TEXT NOT NULL,
  category TEXT,
  sport TEXT,
  prize_first TEXT,
  prize_second TEXT,
  prize_third TEXT,
  organizer UUID REFERENCES users(id) ON DELETE CASCADE,
  "organizerId" UUID REFERENCES users(id) ON DELETE CASCADE,
  participants JSONB DEFAULT '[]'::jsonb, 
  max_participants INTEGER,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled'))
);

-- Fix participants column type if it's uuid[] instead of JSONB
DO $$
BEGIN
  -- Check if participants is uuid[] and convert to JSONB
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='events' 
    AND column_name='participants' 
    AND data_type='ARRAY'
  ) THEN
    -- Drop the trigger first to avoid conflicts
    DROP TRIGGER IF EXISTS trg_sync_ticket_participant ON tickets;
    
    -- Drop the default first
    ALTER TABLE events ALTER COLUMN participants DROP DEFAULT;
    
    -- Convert uuid[] to JSONB
    ALTER TABLE events 
    ALTER COLUMN participants TYPE JSONB 
    USING to_jsonb(participants);
    
    -- Set new default
    ALTER TABLE events 
    ALTER COLUMN participants SET DEFAULT '[]'::jsonb;
    
    -- Recreate the trigger
    CREATE TRIGGER trg_sync_ticket_participant
    AFTER INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION sync_ticket_participant();
  END IF;
END $$;

-- Ensure prize columns exist for already-created databases
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='prize_first') THEN
      ALTER TABLE events ADD COLUMN prize_first TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='prize_second') THEN
      ALTER TABLE events ADD COLUMN prize_second TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='prize_third') THEN
      ALTER TABLE events ADD COLUMN prize_third TEXT;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reporter UUID REFERENCES users(id) ON DELETE CASCADE,
  event UUID REFERENCES events(id) ON DELETE SET NULL,
  images TEXT[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS ticket_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT,
  sale_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sale_end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sold_count INTEGER DEFAULT 0,
  total_quantity INTEGER DEFAULT 0, -- Ensure explicit existence
  available_quantity INTEGER DEFAULT 0
);

-- Fix Columns for ticket_types
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ticket_types' AND column_name='quantity') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ticket_types' AND column_name='total_quantity') THEN
      ALTER TABLE ticket_types RENAME COLUMN quantity TO total_quantity;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ticket_types' AND column_name='is_active') THEN
      ALTER TABLE ticket_types ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bank_transfer', 'easypaisa', 'jazzcash', 'cash')),
  name TEXT NOT NULL,
  account_details JSONB DEFAULT '{}',
  instructions TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fix Columns for payment_methods
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_methods' AND column_name='is_active') THEN
      ALTER TABLE payment_methods ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  ticket_type_id UUID REFERENCES ticket_types(id),
  payment_method_id UUID REFERENCES payment_methods(id),
  quantity INTEGER NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'pending_verification', 'paid', 'cancelled', 'rejected')),
  payment_details JSONB DEFAULT '{}',
  payment_proof_url TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  ticket_type_id UUID REFERENCES ticket_types(id),
  qr_code TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'cancelled')),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_validations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  scanned_by UUID REFERENCES users(id),
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_valid BOOLEAN DEFAULT FALSE,
  validation_message TEXT
);

-- =====================================================
-- 3. LOGIC & AUTOMATION (Triggers & Functions)
-- =====================================================

CREATE OR REPLACE FUNCTION update_ticket_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- We strictly use 'total_quantity' now
  NEW.available_quantity := COALESCE(NEW.total_quantity, 0) - COALESCE(NEW.sold_count, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_ticket_availability ON ticket_types;
CREATE TRIGGER trg_update_ticket_availability
BEFORE INSERT OR UPDATE OF total_quantity, sold_count ON ticket_types
FOR EACH ROW
EXECUTE FUNCTION update_ticket_availability();

-- Force Backfill
UPDATE ticket_types SET available_quantity = total_quantity - sold_count;

CREATE OR REPLACE FUNCTION sync_ticket_participant()
RETURNS TRIGGER AS $$
DECLARE
  current_participants JSONB;
BEGIN
  SELECT participants INTO current_participants FROM events WHERE id = NEW.event_id;
  IF current_participants IS NULL THEN current_participants := '[]'::jsonb; END IF;
  
  IF NOT (current_participants @> to_jsonb(NEW.user_id)) THEN
    UPDATE events 
    SET participants = current_participants || to_jsonb(NEW.user_id)
    WHERE id = NEW.event_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_ticket_participant ON tickets;
CREATE TRIGGER trg_sync_ticket_participant
AFTER INSERT ON tickets
FOR EACH ROW
EXECUTE FUNCTION sync_ticket_participant();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. RPC FUNCTIONS
-- =====================================================

-- Drop all existing versions of functions to avoid conflicts
DROP FUNCTION IF EXISTS create_ticket_order(UUID, UUID, UUID, INTEGER, UUID);
DROP FUNCTION IF EXISTS create_ticket_order(p_event_id UUID, p_ticket_type_id UUID, p_user_id UUID, p_quantity INTEGER, p_payment_method_id UUID);
DROP FUNCTION IF EXISTS create_ticket_order(p_user_id UUID, p_event_id UUID, p_ticket_type_id UUID, p_payment_method_id UUID, p_quantity INTEGER);
DROP FUNCTION IF EXISTS approve_payment(UUID);
DROP FUNCTION IF EXISTS approve_payment(p_order_id UUID);
DROP FUNCTION IF EXISTS reject_payment(UUID, TEXT);
DROP FUNCTION IF EXISTS reject_payment(p_order_id UUID, p_reason TEXT);
DROP FUNCTION IF EXISTS validate_scan_ticket(TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS validate_scan_ticket(p_qr_code TEXT, p_event_id UUID, p_scanned_by UUID);

CREATE OR REPLACE FUNCTION create_ticket_order(
  p_event_id UUID,
  p_ticket_type_id UUID,
  p_user_id UUID,
  p_quantity INTEGER,
  p_payment_method_id UUID
) RETURNS UUID AS $$
DECLARE
  v_ticket_price NUMERIC;
  v_total_amount NUMERIC;
  v_order_id UUID;
  v_available INTEGER;
BEGIN
  SELECT available_quantity, price INTO v_available, v_ticket_price
  FROM ticket_types WHERE id = p_ticket_type_id;
  
  IF v_available < p_quantity THEN
    RAISE EXCEPTION 'Not enough tickets available';
  END IF;
  
  v_total_amount := v_ticket_price * p_quantity;
  
  INSERT INTO orders (user_id, event_id, ticket_type_id, payment_method_id, quantity, total_amount, status)
  VALUES (p_user_id, p_event_id, p_ticket_type_id, p_payment_method_id, p_quantity, v_total_amount, 'pending_payment')
  RETURNING id INTO v_order_id;
  
  UPDATE ticket_types SET sold_count = sold_count + p_quantity WHERE id = p_ticket_type_id;
  
  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION approve_payment(p_order_id UUID) RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  i INTEGER;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  
  IF v_order.status = 'paid' THEN
    RAISE EXCEPTION 'Order already paid';
  END IF;
  
  UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = p_order_id;
  
  FOR i IN 1..v_order.quantity LOOP
    INSERT INTO tickets (order_id, user_id, event_id, ticket_type_id, qr_code, status)
    VALUES (
      p_order_id,
      v_order.user_id,
      v_order.event_id,
      v_order.ticket_type_id,
      encode(digest(p_order_id::text || i::text || random()::text, 'sha256'), 'hex'),
      'active'
    );
  END LOOP;
  
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION reject_payment(p_order_id UUID, p_reason TEXT) RETURNS JSONB AS $$
DECLARE
  v_quantity INTEGER;
  v_ticket_type_id UUID;
BEGIN
  SELECT quantity, ticket_type_id INTO v_quantity, v_ticket_type_id FROM orders WHERE id = p_order_id;

  UPDATE orders SET status = 'rejected', rejection_reason = p_reason, updated_at = NOW() WHERE id = p_order_id;
  
  UPDATE ticket_types SET sold_count = sold_count - v_quantity WHERE id = v_ticket_type_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_scan_ticket(p_qr_code TEXT, p_event_id UUID, p_scanned_by UUID) RETURNS JSONB AS $$
DECLARE
  v_ticket RECORD;
  v_user RECORD;
  v_ticket_type RECORD;
BEGIN
  SELECT * INTO v_ticket FROM tickets WHERE qr_code = p_qr_code;
  
  IF v_ticket IS NULL THEN
    INSERT INTO ticket_validations (event_id, scanned_by, is_valid, validation_message)
    VALUES (p_event_id, p_scanned_by, false, 'Ticket not found');
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;
  
  IF v_ticket.event_id <> p_event_id THEN
    INSERT INTO ticket_validations (ticket_id, event_id, scanned_by, is_valid, validation_message)
    VALUES (v_ticket.id, p_event_id, p_scanned_by, false, 'Wrong event');
    RETURN jsonb_build_object('valid', false, 'reason', 'wrong_event');
  END IF;
  
  IF v_ticket.status = 'used' THEN
    INSERT INTO ticket_validations (ticket_id, event_id, scanned_by, is_valid, validation_message)
    VALUES (v_ticket.id, p_event_id, p_scanned_by, false, 'Already used');
    RETURN jsonb_build_object('valid', false, 'reason', 'already_used');
  END IF;
  
  UPDATE tickets SET status = 'used', used_at = NOW() WHERE id = v_ticket.id;
  
  INSERT INTO ticket_validations (ticket_id, event_id, scanned_by, is_valid, validation_message)
  VALUES (v_ticket.id, p_event_id, p_scanned_by, true, 'Valid entry');
  
  SELECT * INTO v_user FROM users WHERE id = v_ticket.user_id;
  SELECT * INTO v_ticket_type FROM ticket_types WHERE id = v_ticket.ticket_type_id;
  
  RETURN jsonb_build_object(
    'valid', true,
    'ticket', jsonb_build_object(
      'id', v_ticket.id,
      'user', jsonb_build_object('firstName', v_user."firstName", 'lastName', v_user."lastName"),
      'ticket_type', jsonb_build_object('name', v_ticket_type.name)
    )
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. ROW LEVEL SECURITY (The Fix)
-- =====================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_validations ENABLE ROW LEVEL SECURITY;

-- DROP ALL EXISTNG POLICIES (Cleanup Phase)
DROP POLICY IF EXISTS "Public view" ON users;
DROP POLICY IF EXISTS "Self insert" ON users;
DROP POLICY IF EXISTS "Authenticated insert own profile" ON users;
DROP POLICY IF EXISTS "Self update" ON users;
DROP POLICY IF EXISTS "Self delete" ON users;

DROP POLICY IF EXISTS "Public view events" ON events;
DROP POLICY IF EXISTS "Organizer create events" ON events;
DROP POLICY IF EXISTS "Organizer update events" ON events;
DROP POLICY IF EXISTS "Organizer delete events" ON events;

DROP POLICY IF EXISTS "Public view reports" ON reports;
DROP POLICY IF EXISTS "Reporter create reports" ON reports;
DROP POLICY IF EXISTS "Reporter update reports" ON reports;
DROP POLICY IF EXISTS "Reporter delete reports" ON reports;

DROP POLICY IF EXISTS "Public view ticket types" ON ticket_types;
DROP POLICY IF EXISTS "Organizer manage ticket types" ON ticket_types;

DROP POLICY IF EXISTS "Public view payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Organizer manage payment methods" ON payment_methods;

DROP POLICY IF EXISTS "User view own orders" ON orders;
DROP POLICY IF EXISTS "User create orders" ON orders;
DROP POLICY IF EXISTS "User update own orders" ON orders;
DROP POLICY IF EXISTS "Organizer view event orders" ON orders;
DROP POLICY IF EXISTS "Organizer update event orders" ON orders;
DROP POLICY IF EXISTS "Public view" ON orders;         -- cleaning up common defaults
DROP POLICY IF EXISTS "Authenticated view" ON orders;  -- cleaning up common defaults

DROP POLICY IF EXISTS "User view own tickets" ON tickets;
DROP POLICY IF EXISTS "User insert own tickets" ON tickets;
DROP POLICY IF EXISTS "Organizer view event tickets" ON tickets;
DROP POLICY IF EXISTS "Organizer insert event tickets" ON tickets;
DROP POLICY IF EXISTS "Public view" ON tickets;
DROP POLICY IF EXISTS "Authenticated view" ON tickets;


-- CREATE NEW POLICIES (Strict Phase)

-- Users
CREATE POLICY "Public view" ON users FOR SELECT USING (true);
CREATE POLICY "Authenticated insert own profile" ON users FOR INSERT WITH CHECK (
  auth.uid() = id
);
CREATE POLICY "Self update" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Self delete" ON users FOR DELETE USING (auth.uid() = id);

-- Events
CREATE POLICY "Public view events" ON events FOR SELECT USING (true);
CREATE POLICY "Organizer create events" ON events FOR INSERT WITH CHECK (auth.uid() = organizer OR auth.uid() = "organizerId");
CREATE POLICY "Organizer update events" ON events FOR UPDATE USING (auth.uid() = organizer OR auth.uid() = "organizerId");
CREATE POLICY "Organizer delete events" ON events FOR DELETE USING (auth.uid() = organizer OR auth.uid() = "organizerId");

-- Reports
CREATE POLICY "Public view reports" ON reports FOR SELECT USING (true);
CREATE POLICY "Reporter create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter);
CREATE POLICY "Reporter update reports" ON reports FOR UPDATE USING (auth.uid() = reporter);
CREATE POLICY "Reporter delete reports" ON reports FOR DELETE USING (auth.uid() = reporter);

-- Ticket Types
CREATE POLICY "Public view ticket types" ON ticket_types FOR SELECT USING (true);
CREATE POLICY "Organizer manage ticket types" ON ticket_types FOR ALL USING (
  EXISTS (SELECT 1 FROM events WHERE events.id = ticket_types.event_id AND (events.organizer = auth.uid() OR events."organizerId" = auth.uid()))
);

-- Payment Methods
CREATE POLICY "Public view payment methods" ON payment_methods FOR SELECT USING (true);
CREATE POLICY "Organizer manage payment methods" ON payment_methods FOR ALL USING (
  EXISTS (SELECT 1 FROM events WHERE events.id = payment_methods.event_id AND (events.organizer = auth.uid() OR events."organizerId" = auth.uid()))
);

-- Orders
CREATE POLICY "User view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User update own orders" ON orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Organizer view event orders" ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM events WHERE events.id = orders.event_id AND (events.organizer = auth.uid() OR events."organizerId" = auth.uid()))
);
CREATE POLICY "Organizer update event orders" ON orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM events WHERE events.id = orders.event_id AND (events.organizer = auth.uid() OR events."organizerId" = auth.uid()))
);

-- Tickets
CREATE POLICY "User view own tickets" ON tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User insert own tickets" ON tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Organizer view event tickets" ON tickets FOR SELECT USING (
  EXISTS (SELECT 1 FROM events WHERE events.id = tickets.event_id AND (events.organizer = auth.uid() OR events."organizerId" = auth.uid()))
);
CREATE POLICY "Organizer insert event tickets" ON tickets FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM events WHERE events.id = tickets.event_id AND (events.organizer = auth.uid() OR events."organizerId" = auth.uid()))
);

-- Set default value for sold_count and update existing NULL values
ALTER TABLE ticket_types ALTER COLUMN sold_count SET DEFAULT 0;
UPDATE ticket_types SET sold_count = 0 WHERE sold_count IS NULL;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS trg_update_ticket_availability ON ticket_types;

CREATE TRIGGER trg_update_ticket_availability
BEFORE INSERT OR UPDATE OF total_quantity, sold_count ON ticket_types
FOR EACH ROW
EXECUTE FUNCTION update_ticket_availability();

-- Manually update to test
UPDATE ticket_types SET sold_count = sold_count WHERE id IS NOT NULL;


ALTER TABLE public.users REPLICA IDENTITY FULL;
ALTER TABLE public.events REPLICA IDENTITY FULL;
ALTER TABLE public.reports REPLICA IDENTITY FULL;
ALTER TABLE public.ticket_types REPLICA IDENTITY FULL;
ALTER TABLE public.payment_methods REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.tickets REPLICA IDENTITY FULL;
ALTER TABLE public.ticket_validations REPLICA IDENTITY FULL;


-- Add tables to Realtime publication (will error if already exists, that's ok)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_types;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Verify
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- Remove and re-add to publication to force refresh
ALTER PUBLICATION supabase_realtime DROP TABLE public.events;
ALTER PUBLICATION supabase_realtime DROP TABLE public.reports;
ALTER PUBLICATION supabase_realtime DROP TABLE public.users;
ALTER PUBLICATION supabase_realtime DROP TABLE public.ticket_types;
ALTER PUBLICATION supabase_realtime DROP TABLE public.orders;
ALTER PUBLICATION supabase_realtime DROP TABLE public.tickets;

ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_types;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;

-- First, check current state
SELECT id, name, total_quantity, sold_count, available_quantity 
FROM ticket_types;

-- Update the function to explicitly set available_quantity
CREATE OR REPLACE FUNCTION create_ticket_order(
  p_event_id UUID,
  p_ticket_type_id UUID,
  p_user_id UUID,
  p_quantity INTEGER,
  p_payment_method_id UUID
) RETURNS UUID AS $$
DECLARE
  v_ticket_price NUMERIC;
  v_total_amount NUMERIC;
  v_order_id UUID;
  v_available INTEGER;
  v_total INTEGER;
  v_sold INTEGER;
BEGIN
  -- Get current ticket info
  SELECT total_quantity, sold_count, price 
  INTO v_total, v_sold, v_ticket_price
  FROM ticket_types WHERE id = p_ticket_type_id;
  
  -- Calculate available
  v_available := COALESCE(v_total, 0) - COALESCE(v_sold, 0);
  
  IF v_available < p_quantity THEN
    RAISE EXCEPTION 'Not enough tickets available. Only % tickets remaining.', v_available;
  END IF;
  
  v_total_amount := v_ticket_price * p_quantity;
  
  -- Create order
  INSERT INTO orders (user_id, event_id, ticket_type_id, payment_method_id, quantity, total_amount, status)
  VALUES (p_user_id, p_event_id, p_ticket_type_id, p_payment_method_id, p_quantity, v_total_amount, 'pending_payment')
  RETURNING id INTO v_order_id;
  
  -- Update both sold_count AND available_quantity
  UPDATE ticket_types 
  SET sold_count = COALESCE(sold_count, 0) + p_quantity,
      available_quantity = COALESCE(total_quantity, 0) - (COALESCE(sold_count, 0) + p_quantity)
  WHERE id = p_ticket_type_id;
  
  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- Verify the update
SELECT id, name, total_quantity, sold_count, available_quantity 
FROM ticket_types;



-- Verify
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- Add RLS policies for ticket_validations table
DROP POLICY IF EXISTS "Organizer view event validations" ON ticket_validations;
DROP POLICY IF EXISTS "Organizer create validations" ON ticket_validations;

CREATE POLICY "Organizer view event validations" ON ticket_validations FOR SELECT USING (
  EXISTS (SELECT 1 FROM events WHERE events.id = ticket_validations.event_id AND (events.organizer = auth.uid() OR events."organizerId" = auth.uid()))
);

CREATE POLICY "Organizer create validations" ON ticket_validations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM events WHERE events.id = ticket_validations.event_id AND (events.organizer = auth.uid() OR events."organizerId" = auth.uid()))
);

CREATE OR REPLACE FUNCTION validate_scan_ticket(p_qr_code TEXT, p_event_id UUID, p_scanned_by UUID) RETURNS JSONB AS $$
DECLARE
  v_ticket RECORD;
  v_user RECORD;
  v_ticket_type RECORD;
BEGIN
  -- Try to find ticket by qr_code OR by id (for manual entry)
  SELECT * INTO v_ticket FROM tickets 
  WHERE qr_code = p_qr_code 
     OR id::text = p_qr_code 
     OR id::text LIKE p_qr_code || '%';
  
  IF v_ticket IS NULL THEN
    INSERT INTO ticket_validations (event_id, scanned_by, is_valid, validation_message)
    VALUES (p_event_id, p_scanned_by, false, 'Ticket not found');
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;
  
  IF v_ticket.event_id <> p_event_id THEN
    INSERT INTO ticket_validations (ticket_id, event_id, scanned_by, is_valid, validation_message)
    VALUES (v_ticket.id, p_event_id, p_scanned_by, false, 'Wrong event');
    RETURN jsonb_build_object('valid', false, 'reason', 'wrong_event');
  END IF;
  
  IF v_ticket.status = 'used' THEN
    INSERT INTO ticket_validations (ticket_id, event_id, scanned_by, is_valid, validation_message)
    VALUES (v_ticket.id, p_event_id, p_scanned_by, false, 'Already used');
    RETURN jsonb_build_object('valid', false, 'reason', 'already_used');
  END IF;
  
  UPDATE tickets SET status = 'used', used_at = NOW() WHERE id = v_ticket.id;
  
  INSERT INTO ticket_validations (ticket_id, event_id, scanned_by, is_valid, validation_message)
  VALUES (v_ticket.id, p_event_id, p_scanned_by, true, 'Valid entry');
  
  SELECT * INTO v_user FROM users WHERE id = v_ticket.user_id;
  SELECT * INTO v_ticket_type FROM ticket_types WHERE id = v_ticket.ticket_type_id;
  
  RETURN jsonb_build_object(
    'valid', true,
    'ticket', jsonb_build_object(
      'id', v_ticket.id,
      'user', jsonb_build_object('firstName', v_user."firstName", 'lastName', v_user."lastName"),
      'ticket_type', jsonb_build_object('name', v_ticket_type.name)
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Function to allow athletes to join events directly
CREATE OR REPLACE FUNCTION join_event_direct(p_event_id UUID, p_user_id UUID) 
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges to bypass RLS
AS $$
DECLARE
  v_event RECORD;
  v_current_participants JSONB;
BEGIN
  -- Get the event
  SELECT * INTO v_event FROM events WHERE id = p_event_id;
  
  IF v_event IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event not found');
  END IF;
  
  -- Get current participants (JSONB array)
  v_current_participants := COALESCE(v_event.participants, '[]'::jsonb);
  
  -- Check if user is already a participant
  IF v_current_participants @> to_jsonb(p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already joined this event');
  END IF;
  
  -- Add user to participants
  UPDATE events 
  SET participants = v_current_participants || to_jsonb(p_user_id)
  WHERE id = p_event_id
  RETURNING * INTO v_event;
  
  RETURN jsonb_build_object('success', true, 'data', row_to_json(v_event));
END;
$$;


-- Reload Cache
NOTIFY pgrst, 'reload config';
